// DOCX generation for a draft: caption block, numbered paragraphs, headings,
// the not-legal-advice disclaimer and a source appendix of cited passages.
//
// The output is a minimal but valid WordprocessingML package: a ZIP archive
// holding [Content_Types].xml, _rels/.rels and word/document.xml, stored
// uncompressed so the archive needs no deflate implementation.

import Array "mo:core/Array";
import List "mo:core/List";
import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Text "mo:core/Text";

import Citations "../types/citations";
import Common "../types/common";
import Drafts "../types/drafts";
import Export "../types/export";
import Files "../types/files";
import CitationsLib "citations";
import DraftsLib "drafts";
import FilesLib "files";

module {
  // ---- ZIP (stored, no compression) ----

  func buildCrcTable() : [Nat32] {
    Array.tabulate(256, func(i) {
      var c : Nat32 = i.toNat32();
      var k = 0;
      while (k < 8) {
        c := if ((c & 1) == 1) { 0xEDB88320 ^ (c >> 1) } else { c >> 1 };
        k += 1;
      };
      c;
    });
  };

  func crcTable() : [Nat32] {
    buildCrcTable();
  };

  func crc32(bytes : [Nat8]) : Nat32 {
    var crc : Nat32 = 0xFFFFFFFF;
    for (b in bytes.values()) {
      let idx = ((crc ^ b.toNat32()) & 0xFF).toNat();
      crc := crcTable()[idx] ^ (crc >> 8);
    };
    crc ^ 0xFFFFFFFF;
  };

  func u16(v : Nat) : [Nat8] = [v.toNat8(), (v / 256).toNat8()];

  func u32(v : Nat) : [Nat8] = [
    v.toNat8(),
    (v / 256).toNat8(),
    (v / 65_536).toNat8(),
    (v / 16_777_216).toNat8(),
  ];

  type Entry = {
    name : Text;
    data : [Nat8];
    crc : Nat32;
    offset : Nat;
  };

  // Builds a stored (method 0) ZIP archive from named byte entries.
  func zip(entries : [(Text, [Nat8])]) : [Nat8] {
    let out = List.empty<Nat8>();
    let central = List.empty<Entry>();
    var offset = 0;
    for ((name, data) in entries.values()) {
      let nameBytes = name.encodeUtf8().toArray();
      let crc = crc32(data);
      let size = data.size();
      let header = u32(0x04034b50)
        .concat(u16(20))
        .concat(u16(0))
        .concat(u16(0))
        .concat(u16(0))
        .concat(u16(0))
        .concat(u32(crc.toNat()))
        .concat(u32(size))
        .concat(u32(size))
        .concat(u16(nameBytes.size()))
        .concat(u16(0))
        .concat(nameBytes);
      out.addAll(header.values());
      out.addAll(data.values());
      central.add({ name; data; crc; offset });
      offset += header.size() + size;
    };
    let centralStart = offset;
    var centralSize = 0;
    for (entry in central.values()) {
      let nameBytes = entry.name.encodeUtf8().toArray();
      let size = entry.data.size();
      let record = u32(0x02014b50)
        .concat(u16(20))
        .concat(u16(20))
        .concat(u16(0))
        .concat(u16(0))
        .concat(u16(0))
        .concat(u16(0))
        .concat(u32(entry.crc.toNat()))
        .concat(u32(size))
        .concat(u32(size))
        .concat(u16(nameBytes.size()))
        .concat(u16(0))
        .concat(u16(0))
        .concat(u16(0))
        .concat(u16(0))
        .concat(u32(0))
        .concat(u32(entry.offset))
        .concat(nameBytes);
      out.addAll(record.values());
      centralSize += record.size();
    };
    let end = u32(0x06054b50)
      .concat(u16(0))
      .concat(u16(0))
      .concat(u16(central.size()))
      .concat(u16(central.size()))
      .concat(u32(centralSize))
      .concat(u32(centralStart))
      .concat(u16(0));
    out.addAll(end.values());
    out.toArray();
  };

  // ---- WordprocessingML ----

  func escape(text : Text) : Text {
    text.replace(#text "&", "&amp;").replace(#text "<", "&lt;").replace(#text ">", "&gt;");
  };

  func paragraph(text : Text, style : ?Text) : Text {
    let pPr = switch (style) {
      case (?s) "<w:pPr><w:pStyle w:val=\"" # s # "\"/></w:pPr>";
      case null "";
    };
    "<w:p>" # pPr # "<w:r><w:t xml:space=\"preserve\">" # escape(text) # "</w:t></w:r></w:p>";
  };

  func heading(text : Text) : Text = paragraph(text, ?"Heading1");

  func documentXml(
    draft : Drafts.Draft,
    options : Export.ExportOptions,
    sources : [Common.CitedPassage],
  ) : Text {
    let body = List.empty<Text>();
    // Caption block.
    for (line in options.caption.split(#char '\n')) {
      body.add(paragraph(line, null));
    };
    body.add(paragraph("", null));
    body.add(heading(draft.title));
    // Numbered paragraphs: each section heading followed by its body.
    var number = 0;
    for (section in draft.sections.values()) {
      number += 1;
      body.add(heading(number.toText() # ". " # section.heading));
      for (line in section.body.split(#char '\n')) {
        if (line != "") { body.add(paragraph(line, null)) };
      };
    };
    // Source appendix.
    body.add(heading("Appendix — Sources Cited"));
    if (sources.size() == 0) {
      body.add(paragraph("No library passages were cited in this draft.", null));
    } else {
      for (source in sources.values()) {
        let locator = source.filename # ", page " # source.passage.page.toText()
          # ", paragraph " # source.passage.paragraph.toText();
        body.add(paragraph(locator, null));
      };
    };
    // Not-legal-advice disclaimer.
    body.add(paragraph("", null));
    body.add(paragraph(options.disclaimer, ?"Disclaimer"));
    let content = body.values().join("");
    "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>"
    # "<w:document xmlns:w=\"http://schemas.openxmlformats.org/wordprocessingml/2006/main\">"
    # "<w:body>" # content
    # "<w:sectPr><w:pgSz w:w=\"12240\" w:h=\"15840\"/>"
    # "<w:pgMar w:top=\"1440\" w:right=\"1440\" w:bottom=\"1440\" w:left=\"1440\"/></w:sectPr>"
    # "</w:body></w:document>";
  };

  func contentTypes() : Text =
    "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>"
    # "<Types xmlns=\"http://schemas.openxmlformats.org/package/2006/content-types\">"
    # "<Default Extension=\"rels\" ContentType=\"application/vnd.openxmlformats-package.relationships+xml\"/>"
    # "<Default Extension=\"xml\" ContentType=\"application/xml\"/>"
    # "<Override PartName=\"/word/document.xml\" ContentType=\"application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml\"/>"
    # "</Types>";

  func rootRels() : Text =
    "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>"
    # "<Relationships xmlns=\"http://schemas.openxmlformats.org/package/2006/relationships\">"
    # "<Relationship Id=\"rId1\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument\" Target=\"word/document.xml\"/>"
    # "</Relationships>";

  func safeFilename(title : Text) : Text {
    let cleaned = title.replace(#char '/', "-").replace(#char '\\', "-").trim(#char ' ');
    let base = if (cleaned == "") { "draft" } else { cleaned };
    base # ".docx";
  };

  public func exportDocx(
    files : Map.Map<Principal, FilesLib.UserFiles>,
    passages : Map.Map<Principal, FilesLib.UserPassages>,
    drafts : Map.Map<Principal, DraftsLib.UserDrafts>,
    caller : Principal,
    draftId : Common.Id,
    options : Export.ExportOptions,
  ) : Export.ExportedDocument {
    let draft = switch (drafts.get(caller)) {
      case (?owned) {
        switch (owned.drafts.get(draftId)) {
          case (?draft) draft;
          case null Runtime.trap("Unknown draft");
        };
      };
      case null Runtime.trap("Unknown draft");
    };
    // Every verified citation in the draft becomes a source appendix entry.
    let check = CitationsLib.check(files, passages, drafts, caller, draftId);
    let sources = List.empty<Common.CitedPassage>();
    for (citation in check.citations.values()) {
      switch (citation.status) {
        case (#verifiedInLibrary(cited)) {
          let already = sources.any(func(s) = s.passage.id == cited.passage.id);
          if (not already) { sources.add(cited) };
        };
        case (_) {};
      };
    };
    let xml = documentXml(draft, options, sources.toArray());
    let bytes = zip([
      ("[Content_Types].xml", contentTypes().encodeUtf8().toArray()),
      ("_rels/.rels", rootRels().encodeUtf8().toArray()),
      ("word/document.xml", xml.encodeUtf8().toArray()),
    ]);
    { filename = safeFilename(draft.title); bytes = bytes.toBlob() };
  };
};
