// Case files uploaded into a project, plus the indexed passages they yield.

import Common "../types/common";
import Map "mo:core/Map";
import Storage "mo:caffeineai-object-storage/Storage";

module {
  // A registered case file. The bytes live in object storage; this record
  // holds the reference and the indexing bookkeeping.
  public type CaseFile = {
    id : Common.Id;
    projectId : Common.Id;
    filename : Text;
    // Upload version, starting at 1 and incremented per re-upload.
    version : Nat;
    // MIME type as reported by the browser, e.g. "application/pdf".
    mimeType : Text;
    sizeBytes : Nat;
    pageCount : Nat;
    blob : Storage.ExternalBlob;
    // Text the browser extracted from the upload, split into passages by the
    // indexer. Absent when extraction produced nothing.
    extractedText : ?Text;
    indexingStatus : Common.IndexingStatus;
    uploadedAt : Common.Timestamp;
  };

  // What the browser sends when registering an upload.
  public type CaseFileInput = {
    projectId : Common.Id;
    filename : Text;
    mimeType : Text;
    sizeBytes : Nat;
    pageCount : Nat;
    blob : Storage.ExternalBlob;
    // Extracted text, when the browser could extract it.
    extractedText : ?Text;
  };

  // One page of a file's indexed passages, bounded for the reply limit.
  public type PassagePage = {
    passages : [Common.Passage];
    total : Nat;
  };

  // A user's case files, keyed by file id.
  public type UserFiles = {
    var nextId : Nat;
    files : Map.Map<Common.Id, CaseFile>;
  };

  // A user's indexed passages, keyed by passage id.
  public type UserPassages = {
    var nextId : Nat;
    passages : Map.Map<Common.Id, Common.Passage>;
  };
};
