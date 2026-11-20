// Public DOCX export endpoint.

import Map "mo:core/Map";
import Principal "mo:core/Principal";

import Common "../types/common";
import Drafts "../types/drafts";
import Export "../types/export";
import Files "../types/files";
import DraftsLib "../lib/drafts";
import FilesLib "../lib/files";
import ExportLib "../lib/export";

mixin (
  files : Map.Map<Principal, FilesLib.UserFiles>,
  passages : Map.Map<Principal, FilesLib.UserPassages>,
  drafts : Map.Map<Principal, DraftsLib.UserDrafts>,
) {
  public shared ({ caller }) func exportDraftDocx(
    draftId : Common.Id,
    options : Export.ExportOptions,
  ) : async Export.ExportedDocument {
    ExportLib.exportDocx(files, passages, drafts, caller, draftId, options);
  };
};
