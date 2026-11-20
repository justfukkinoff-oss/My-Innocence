// Per-user habeas projects: the container a litigant groups case files,
// drafts and retrieval under.

import Common "../types/common";

module {
  public type Project = {
    id : Common.Id;
    name : Text;
    // The case caption, e.g. "Smith v. Warden, FCI Allenwood".
    caption : Text;
    createdAt : Common.Timestamp;
    lastActivityAt : Common.Timestamp;
    fileCount : Nat;
    indexingStatus : Common.IndexingStatus;
  };

  // What the browser sends when creating or renaming a project.
  public type ProjectInput = {
    name : Text;
    caption : Text;
  };
};
