// Indexing for a case file: split its extracted text into passages that carry
// page and paragraph locators, store them, and move the file through
// pending -> indexing -> indexed, or -> failed with a readable reason.
//
// The canister never parses the uploaded bytes itself. The browser extracts
// the text (PDF/DOCX/TXT) and submits it with the upload; this module owns the
// passage split, the locators and the job lifecycle. A file registered with no
// extracted text is marked failed with a reason the user can act on.

import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";

import Common "../types/common";
import Files "../types/files";

module {
  // Passages per page of `getFilePassages`, bounded for the reply limit.
  public let pageSize : Nat = 50;

  // A paragraph longer than this is split into further passages so no single
  // passage blows the reply budget.
  let maxPassageChars : Nat = 2_000;

  // Document order: page, then paragraph, then passage id.
  public func compareLocator(a : Common.Passage, b : Common.Passage) : { #less; #equal; #greater } {
    if (a.page < b.page) { return #less };
    if (a.page > b.page) { return #greater };
    if (a.paragraph < b.paragraph) { return #less };
    if (a.paragraph > b.paragraph) { return #greater };
    if (a.id < b.id) { return #less };
    if (a.id > b.id) { return #greater };
    #equal;
  };

  func isBlank(c : Char) : Bool {
    c == ' ' or c == '\n' or c == '\r' or c == '\t';
  };

  func userPassages(all : Map.Map<Principal, Files.UserPassages>, caller : Principal) : Files.UserPassages {
    switch (all.get(caller)) {
      case (?owned) owned;
      case null {
        let fresh : Files.UserPassages = { var nextId = 0; passages = Map.empty() };
        all.add(caller, fresh);
        fresh;
      };
    };
  };

  // Drops every passage indexed from the file.
  public func clearFile(
    passages : Map.Map<Principal, Files.UserPassages>,
    caller : Principal,
    fileId : Common.Id,
  ) : () {
    switch (passages.get(caller)) {
      case null {};
      case (?owned) {
        let stale = owned.passages.values().filter(func(p) = p.fileId == fileId).toArray();
        for (passage in stale.values()) {
          owned.passages.remove(passage.id);
        };
      };
    };
  };

  func setStatus(
    files : Map.Map<Principal, Files.UserFiles>,
    caller : Principal,
    fileId : Common.Id,
    status : Common.IndexingStatus,
  ) {
    switch (files.get(caller)) {
      case (?owned) {
        switch (owned.files.get(fileId)) {
          case (?file) owned.files.add(fileId, { file with indexingStatus = status });
          case null {};
        };
      };
      case null {};
    };
  };

  // Splits one paragraph into passages of at most `maxPassageChars`, keeping
  // the paragraph locator on each piece.
  func splitParagraph(text : Text) : [Text] {
    if (text.size() <= maxPassageChars) {
      return [text];
    };
    let chars = text.chars().toArray();
    let total = chars.size();
    var offset = 0;
    var pieces : [Text] = [];
    while (offset < total) {
      let end = Nat.min(offset + maxPassageChars, total);
      pieces := pieces.concat([Text.fromIter(chars.sliceToArray(offset.toInt(), end.toInt()).values())]);
      offset := end;
    };
    pieces;
  };

  // Splits the extracted text into passages. Pages are separated by a form
  // feed; paragraphs by a blank line. Both locators are 1-based.
  public func split(
    passages : Map.Map<Principal, Files.UserPassages>,
    caller : Principal,
    fileId : Common.Id,
    text : Text,
  ) : Nat {
    let owned = userPassages(passages, caller);
    var stored = 0;
    var page : Nat = 1;
    for (pageText in text.split(#char '\u{0C}')) {
      var paragraph : Nat = 1;
      for (paragraphText in pageText.split(#text "\n\n")) {
        let trimmed = paragraphText.trim(#predicate(isBlank));
        if (trimmed.size() > 0) {
          for (piece in splitParagraph(trimmed).values()) {
            let id = owned.nextId;
            owned.nextId += 1;
            owned.passages.add(id, {
              id;
              fileId;
              page;
              paragraph;
              text = piece;
            });
            stored += 1;
          };
          paragraph += 1;
        };
      };
      page += 1;
    };
    stored;
  };

  // Runs the indexing job for a file: pending -> indexing -> indexed, or
  // failed with a readable reason. The extracted text is supplied by the
  // browser alongside the upload; without it the job fails rather than
  // silently producing an empty index.
  public func index(
    files : Map.Map<Principal, Files.UserFiles>,
    passages : Map.Map<Principal, Files.UserPassages>,
    caller : Principal,
    fileId : Common.Id,
    now : Common.Timestamp,
  ) : () {
    ignore now;
    let file = switch (files.get(caller)) {
      case (?owned) {
        switch (owned.files.get(fileId)) {
          case (?file) file;
          case null Runtime.trap("Unknown case file");
        };
      };
      case null Runtime.trap("Unknown case file");
    };
    setStatus(files, caller, fileId, #indexing);
    let extracted = file.extractedText;
    switch (extracted) {
      case null {
        setStatus(files, caller, fileId, #failed({ reason = "No text was extracted from this file. Re-upload it as a text-based PDF, DOCX or TXT." }));
      };
      case (?text) {
        if (text.trim(#predicate(isBlank)).size() == 0) {
          setStatus(files, caller, fileId, #failed({ reason = "The extracted text is empty. This file may be a scanned image; upload a text-based copy." }));
        } else {
          let stored = split(passages, caller, fileId, text);
          if (stored == 0) {
            setStatus(files, caller, fileId, #failed({ reason = "No passages could be indexed from this file." }));
          } else {
            setStatus(files, caller, fileId, #indexed);
          };
        };
      };
    };
  };
};
