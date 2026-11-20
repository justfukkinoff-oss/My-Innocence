// §2254 draft documents: five draft types, an ordered section outline, body
// content, autosave timestamps and restorable version history.

import Common "../types/common";

module {
  public type DraftType = {
    #petition;
    #memorandum;
    #motion;
    #reply;
    #noticeOfExhaustion;
  };

  // One section of the ordered outline. `body` is the section's text.
  public type DraftSection = {
    id : Common.Id;
    heading : Text;
    body : Text;
  };

  // A restorable snapshot of a draft's outline and body.
  public type DraftVersion = {
    version : Nat;
    sections : [DraftSection];
    savedAt : Common.Timestamp;
  };

  public type Draft = {
    id : Common.Id;
    projectId : Common.Id;
    draftType : DraftType;
    title : Text;
    sections : [DraftSection];
    createdAt : Common.Timestamp;
    autosavedAt : Common.Timestamp;
    versions : [DraftVersion];
  };

  // What the browser sends when creating a draft.
  public type DraftInput = {
    projectId : Common.Id;
    draftType : DraftType;
    title : Text;
  };

  // What the browser sends on autosave.
  public type DraftContent = {
    title : Text;
    sections : [DraftSection];
  };
};
