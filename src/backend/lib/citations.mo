// Citation verification against the indexed library, and grounding of a
// draft's sentences.
//
// A citation is recognised by its reporter form — "550 U.S. 465",
// "28 U.S.C. § 2254", "372 F.3d 123" — and verified by finding a library
// passage that carries the same reporter citation. Grounding flags sentences
// that make a claim but cite nothing from the library.

import Array "mo:core/Array";
import Char "mo:core/Char";
import List "mo:core/List";
import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Text "mo:core/Text";

import Citations "../types/citations";
import Common "../types/common";
import Drafts "../types/drafts";
import Files "../types/files";
import DraftsLib "drafts";
import FilesLib "files";

module {
  // A citation found in a section body, with its character offset.
  type Found = {
    rawText : Text;
    offset : Nat;
    // The reporter citation used for matching, e.g. "550 U.S. 465".
    key : Text;
    // False when the text looks like a citation but lacks a volume or page.
    wellFormed : Bool;
  };

  // Reporter abbreviations recognised as a citation's core.
  let reporters : [Text] = [
    "U.S.",
    "S. Ct.",
    "L. Ed. 2d",
    "F.2d",
    "F.3d",
    "F.4th",
    "F. Supp.",
    "F. Supp. 2d",
    "F. Supp. 3d",
    "U.S.C.",
    "F. App'x",
  ];

  // A sentence that makes a claim but cites nothing from the library.
  let claimMarkers : [Text] = [
    "the court held",
    "the court found",
    "the court concluded",
    "the court reasoned",
    "the supreme court",
    "this court",
    "the state court",
    "the appellate court",
    "the trial court",
    "the record shows",
    "the record reflects",
    "the record establishes",
    "the evidence shows",
    "the evidence establishes",
    "petitioner argued",
    "petitioner contends",
    "petitioner asserts",
    "respondent argues",
    "respondent contends",
    "it is well settled",
    "it is established",
    "clearly established",
    "contrary to",
    "unreasonable application",
    "ineffective assistance",
    "therefore",
    "accordingly",
    "thus",
  ];

  func isDigit(c : Char) : Bool = c >= '0' and c <= '9';

  func isSpace(c : Char) : Bool = c == ' ' or c == '\t' or c == '\n' or c == '\r';

  // The reporter abbreviation that starts at `i`, longest match first, or null.
  func reporterAt(chars : [Char], i : Nat) : ?Text {
    var best : ?Text = null;
    var bestLen = 0;
    for (reporter in reporters.values()) {
      let rchars = reporter.toArray();
      let len = rchars.size();
      if (i + len <= chars.size() and len > bestLen) {
        var matches = true;
        var k = 0;
        while (matches and k < len) {
          if (chars[i + k] != rchars[k]) { matches := false };
          k += 1;
        };
        if (matches) {
          best := ?reporter;
          bestLen := len;
        };
      };
    };
    best;
  };

  // Scans one section body for reporter citations. Each match is the run of
  // digits before the reporter, the reporter, and the run of digits after it.
  // A reporter with no volume or no page is still reported, as malformed.
  func scanSection(sectionId : Common.Id, body : Text) : [Found] {
    let chars = body.toArray();
    let n = chars.size();
    let found = List.empty<Found>();
    var i = 0;
    while (i < n) {
      switch (reporterAt(chars, i)) {
        case (?reporter) {
          // Walk back over the volume number and the space before it.
          var start = i;
          while (start > 0 and isSpace(chars[start - 1])) { start -= 1 };
          let digitsEnd = start;
          while (start > 0 and isDigit(chars[start - 1])) { start -= 1 };
          let hasVolume = start < digitsEnd;
          // Walk forward over the space after the reporter and the page.
          var after = i + reporter.toArray().size();
          while (after < n and isSpace(chars[after])) { after += 1 };
          let pageStart = after;
          while (after < n and isDigit(chars[after])) { after += 1 };
          let hasPage = after > pageStart;
          let raw = Text.fromIter(chars.sliceToArray(start, after).values());
          let key = raw.split(#char ' ').filter(func(part) = part != "").join(" ");
          found.add({ rawText = raw; offset = start; key; wellFormed = hasVolume and hasPage });
          i := after;
        };
        case null { i += 1 };
      };
    };
    ignore sectionId;
    found.toArray();
  };

  // The library passage whose text carries `key`, if any.
  func findPassage(
    files : Map.Map<Principal, FilesLib.UserFiles>,
    passages : Map.Map<Principal, FilesLib.UserPassages>,
    caller : Principal,
    key : Text,
  ) : ?Common.CitedPassage {
    let ownedPassages = switch (passages.get(caller)) {
      case (?owned) owned;
      case null return null;
    };
    let ownedFiles = switch (files.get(caller)) {
      case (?owned) owned;
      case null return null;
    };
    let needle = key.toLower();
    switch (ownedPassages.passages.values().find(func(p) = p.text.toLower().contains(#text needle))) {
      case (?passage) {
        let filename = switch (ownedFiles.files.get(passage.fileId)) {
          case (?file) file.filename;
          case null "";
        };
        ?{ passage; filename };
      };
      case null null;
    };
  };

  func draftSections(
    drafts : Map.Map<Principal, DraftsLib.UserDrafts>,
    caller : Principal,
    draftId : Common.Id,
  ) : [Drafts.DraftSection] {
    switch (drafts.get(caller)) {
      case (?owned) {
        switch (owned.drafts.get(draftId)) {
          case (?draft) draft.sections;
          case null Runtime.trap("Unknown draft");
        };
      };
      case null Runtime.trap("Unknown draft");
    };
  };

  public func check(
    files : Map.Map<Principal, FilesLib.UserFiles>,
    passages : Map.Map<Principal, FilesLib.UserPassages>,
    drafts : Map.Map<Principal, DraftsLib.UserDrafts>,
    caller : Principal,
    draftId : Common.Id,
  ) : Citations.CitationCheckResult {
    let sections = draftSections(drafts, caller, draftId);
    let checks = List.empty<Citations.CitationCheck>();
    for (section in sections.values()) {
      for (found in scanSection(section.id, section.body).values()) {
        let status : Citations.CitationStatus = if (not found.wellFormed) {
          #malformed;
        } else {
          switch (findPassage(files, passages, caller, found.key)) {
            case (?cited) #verifiedInLibrary(cited);
            case null #unverified;
          };
        };
        checks.add({
          rawText = found.rawText;
          location = { sectionId = section.id; offset = found.offset };
          status;
        });
      };
    };
    { citations = checks.toArray() };
  };

  // Splits a body into sentences on '.', '!' and '?' followed by whitespace.
  func sentences(body : Text) : [Text] {
    let chars = body.toArray();
    let n = chars.size();
    let out = List.empty<Text>();
    var start = 0;
    var i = 0;
    while (i < n) {
      let c = chars[i];
      let isEnd = c == '.' or c == '!' or c == '?';
      let nextIsBreak = i + 1 >= n or isSpace(chars[i + 1]);
      if (isEnd and nextIsBreak) {
        let piece = Text.fromIter(chars.sliceToArray(start, i + 1).values()).trim(#char ' ');
        if (piece != "") { out.add(piece) };
        start := i + 1;
      };
      i += 1;
    };
    if (start < n) {
      let piece = Text.fromIter(chars.sliceToArray(start, n).values()).trim(#char ' ');
      if (piece != "") { out.add(piece) };
    };
    out.toArray();
  };

  // Words that carry no assertion on their own, so a sentence made only of
  // these (plus punctuation) is not treated as a claim.
  let nonClaimWords : [Text] = [
    "a", "an", "the", "and", "or", "but", "of", "in", "on", "at", "to", "for",
    "from", "by", "with", "as", "is", "are", "was", "were", "be", "been",
    "being", "that", "this", "these", "those", "it", "its", "his", "her",
    "their", "our", "my", "he", "she", "they", "we", "i", "you", "not", "no",
    "if", "then", "than", "so", "such", "which", "who", "whom", "whose",
    "there", "here", "also", "however", "moreover", "furthermore", "see",
    "id", "cf", "e.g", "i.e", "v", "vs", "section", "sections", "page",
    "pages", "exhibit", "appendix", "respectfully", "submitted", "dated",
    "signed", "attorney", "counsel", "pro", "se", "petitioner", "respondent",
    "court", "state", "federal", "united", "states", "district", "circuit",
    "supreme", "habeas", "corpus", "case", "no", "nos", "filed", "order",
    "judgment", "opinion", "memorandum", "decision", "record", "trial",
    "appeal", "brief", "motion", "claim", "claims", "ground", "grounds",
  ];

  func isWordChar(c : Char) : Bool {
    isDigit(c) or (c >= 'a' and c <= 'z') or (c >= 'A' and c <= 'Z') or c == '\'';
  };

  // True when the sentence contains at least one word that is not a
  // stopword, i.e. it asserts something rather than being a heading or a
  // citation fragment.
  func hasAssertiveWord(sentence : Text) : Bool {
    let chars = sentence.toArray();
    let n = chars.size();
    var i = 0;
    var assertive = false;
    while (i < n and not assertive) {
      if (isWordChar(chars[i])) {
        let start = i;
        while (i < n and isWordChar(chars[i])) { i += 1 };
        let word = Text.fromIter(chars.sliceToArray(start, i).values()).toLower();
        if (not nonClaimWords.contains(word)) { assertive := true };
      } else {
        i += 1;
      };
    };
    assertive;
  };

  func makesClaim(sentence : Text) : Bool {
    let lower = sentence.toLower();
    if (claimMarkers.any(func(marker) = lower.contains(#text marker))) {
      return true;
    };
    hasAssertiveWord(sentence);
  };

  public func ground(
    files : Map.Map<Principal, FilesLib.UserFiles>,
    passages : Map.Map<Principal, FilesLib.UserPassages>,
    drafts : Map.Map<Principal, DraftsLib.UserDrafts>,
    caller : Principal,
    draftId : Common.Id,
  ) : Citations.GroundingResult {
    let sections = draftSections(drafts, caller, draftId);
    let ungrounded = List.empty<Citations.UngroundedSentence>();
    for (section in sections.values()) {
      for (sentence in sentences(section.body).values()) {
        if (makesClaim(sentence)) {
          let cited = scanSection(section.id, sentence).any(
            func(found) = findPassage(files, passages, caller, found.key) != null
          );
          if (not cited) {
            ungrounded.add({ sectionId = section.id; sentence });
          };
        };
      };
    };
    { ungrounded = ungrounded.toArray() };
  };
};
