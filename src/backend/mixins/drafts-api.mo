// Public draft endpoints. Every call is scoped to the signed-in caller.

import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Time "mo:core/Time";

import Common "../types/common";
import Drafts "../types/drafts";
import DraftsLib "../lib/drafts";

mixin (drafts : Map.Map<Principal, DraftsLib.UserDrafts>) {
  public shared ({ caller }) func createDraft(input : Drafts.DraftInput) : async Drafts.Draft {
    DraftsLib.create(drafts, caller, input, Time.now());
  };

  public query ({ caller }) func getDraft(id : Common.Id) : async Drafts.Draft {
    DraftsLib.get(drafts, caller, id);
  };

  public query ({ caller }) func listDrafts(projectId : Common.Id) : async [Drafts.Draft] {
    DraftsLib.list(drafts, caller, projectId);
  };

  public shared ({ caller }) func autosaveDraft(id : Common.Id, content : Drafts.DraftContent) : async Drafts.Draft {
    DraftsLib.autosave(drafts, caller, id, content, Time.now());
  };

  public shared ({ caller }) func restoreDraftVersion(id : Common.Id, version : Nat) : async Drafts.Draft {
    DraftsLib.restoreVersion(drafts, caller, id, version, Time.now());
  };

  public shared ({ caller }) func deleteDraft(id : Common.Id) : async () {
    DraftsLib.delete(drafts, caller, id);
  };
};
