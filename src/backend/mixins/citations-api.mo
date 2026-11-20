// Public citation-check and grounding endpoints.

import Map "mo:core/Map";
import Principal "mo:core/Principal";

import Citations "../types/citations";
import Common "../types/common";
import Drafts "../types/drafts";
import Files "../types/files";
import DraftsLib "../lib/drafts";
import FilesLib "../lib/files";
import CitationsLib "../lib/citations";

mixin (
  files : Map.Map<Principal, FilesLib.UserFiles>,
  passages : Map.Map<Principal, FilesLib.UserPassages>,
  drafts : Map.Map<Principal, DraftsLib.UserDrafts>,
) {
  public shared ({ caller }) func checkDraftCitations(draftId : Common.Id) : async Citations.CitationCheckResult {
    CitationsLib.check(files, passages, drafts, caller, draftId);
  };

  public shared ({ caller }) func checkDraftGrounding(draftId : Common.Id) : async Citations.GroundingResult {
    CitationsLib.ground(files, passages, drafts, caller, draftId);
  };
};
