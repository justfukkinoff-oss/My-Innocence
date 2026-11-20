// Per-user case-file store: register an upload, list a project's files, read
// one file's indexed passages, delete a file, retry a failed indexing job.
//
// Re-uploading a filename that already exists in the project creates a new
// version of that file (the old version's passages are dropped and the new
// bytes are indexed) instead of adding a duplicate entry.

import Int "mo:core/Int";
import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";

import Common "../types/common";
import Files "../types/files";
import IndexingLib "indexing";

module {
  // The caller's case files, keyed by file id.
  public type UserFiles = Files.UserFiles;

  // The caller's indexed passages, keyed by passage id.
  public type UserPassages = Files.UserPassages;

  let maxFilenameChars : Nat = 255;

  func userFiles(all : Map.Map<Principal, UserFiles>, caller : Principal) : UserFiles {
    switch (all.get(caller)) {
      case (?owned) owned;
      case null {
        let fresh : UserFiles = { var nextId = 0; files = Map.empty() };
        all.add(caller, fresh);
        fresh;
      };
    };
  };

  func userPassages(all : Map.Map<Principal, UserPassages>, caller : Principal) : UserPassages {
    switch (all.get(caller)) {
      case (?owned) owned;
      case null {
        let fresh : UserPassages = { var nextId = 0; passages = Map.empty() };
        all.add(caller, fresh);
        fresh;
      };
    };
  };

  func ownFile(all : Map.Map<Principal, UserFiles>, caller : Principal, fileId : Common.Id) : Files.CaseFile {
    switch (all.get(caller)) {
      case (?owned) {
        switch (owned.files.get(fileId)) {
          case (?file) file;
          case null Runtime.trap("Unknown case file");
        };
      };
      case null Runtime.trap("Unknown case file");
    };
  };

  // The caller's file with the given name in the project, if any.
  func findByName(
    all : Map.Map<Principal, UserFiles>,
    caller : Principal,
    projectId : Common.Id,
    filename : Text,
  ) : ?Files.CaseFile {
    switch (all.get(caller)) {
      case null null;
      case (?owned) {
        owned.files.values().find(
          func(file) = file.projectId == projectId and file.filename == filename
        );
      };
    };
  };

  // Registers an upload and starts indexing it. A filename already present in
  // the project becomes a new version of that file.
  public func register(
    files : Map.Map<Principal, UserFiles>,
    passages : Map.Map<Principal, UserPassages>,
    caller : Principal,
    input : Files.CaseFileInput,
    now : Common.Timestamp,
  ) : Files.CaseFile {
    if (input.filename.size() == 0 or input.filename.size() > maxFilenameChars) {
      Runtime.trap("Filename must be 1 to 255 characters");
    };
    let owned = userFiles(files, caller);
    let existing = findByName(files, caller, input.projectId, input.filename);
    let (id, version) = switch (existing) {
      case (?file) {
        // New version: the previous version's passages no longer describe
        // the stored bytes, so drop them before re-indexing.
        IndexingLib.clearFile(passages, caller, file.id);
        (file.id, file.version + 1);
      };
      case null {
        let id = owned.nextId;
        owned.nextId += 1;
        (id, 1);
      };
    };
    let file : Files.CaseFile = {
      id;
      projectId = input.projectId;
      filename = input.filename;
      version;
      mimeType = input.mimeType;
      sizeBytes = input.sizeBytes;
      pageCount = input.pageCount;
      blob = input.blob;
      extractedText = input.extractedText;
      indexingStatus = #pending;
      uploadedAt = now;
    };
    owned.files.add(id, file);
    IndexingLib.index(files, passages, caller, id, now);
    ownFile(files, caller, id);
  };

  // The project's files, newest upload first.
  public func list(
    files : Map.Map<Principal, UserFiles>,
    caller : Principal,
    projectId : Common.Id,
  ) : [Files.CaseFile] {
    switch (files.get(caller)) {
      case null [];
      case (?owned) {
        let matching = owned.files.values().filter(func(file) = file.projectId == projectId).toArray();
        matching.sort(func(a, b) = Int.compare(b.uploadedAt, a.uploadedAt));
      };
    };
  };

  // One bounded page of a file's passages, in document order.
  public func passages(
    files : Map.Map<Principal, UserFiles>,
    passages : Map.Map<Principal, UserPassages>,
    caller : Principal,
    fileId : Common.Id,
    start : Nat,
  ) : Files.PassagePage {
    ignore ownFile(files, caller, fileId);
    let owned = userPassages(passages, caller);
    let matching = owned.passages.values().filter(func(p) = p.fileId == fileId).toArray();
    let ordered = matching.sort(func(a, b) = IndexingLib.compareLocator(a, b));
    let total = ordered.size();
    if (start >= total) {
      return { passages = []; total };
    };
    let end = Nat.min(start + IndexingLib.pageSize, total);
    let count : Nat = if (end > start) { end - start : Nat } else { 0 };
    { passages = ordered.sliceToArray(start.toInt(), (start + count).toInt()); total };
  };

  // Deletes the file and every passage indexed from it.
  public func delete(
    files : Map.Map<Principal, UserFiles>,
    passages : Map.Map<Principal, UserPassages>,
    caller : Principal,
    fileId : Common.Id,
  ) : () {
    ignore ownFile(files, caller, fileId);
    IndexingLib.clearFile(passages, caller, fileId);
    switch (files.get(caller)) {
      case (?owned) owned.files.remove(fileId);
      case null {};
    };
  };

  // Re-runs indexing for a file whose job failed.
  public func retryIndexing(
    files : Map.Map<Principal, UserFiles>,
    passages : Map.Map<Principal, UserPassages>,
    caller : Principal,
    fileId : Common.Id,
    now : Common.Timestamp,
  ) : Files.CaseFile {
    let file = ownFile(files, caller, fileId);
    switch (file.indexingStatus) {
      case (#failed(_)) {};
      case (_) Runtime.trap("Only a failed indexing job can be retried");
    };
    IndexingLib.clearFile(passages, caller, fileId);
    IndexingLib.index(files, passages, caller, fileId, now);
    ownFile(files, caller, fileId);
  };
};
