// DOCX generation for a draft: caption block, numbered paragraphs, headings,
// the not-legal-advice disclaimer and a source appendix of cited passages.
//
// The implementation lives in lib/docx.mo; this module keeps the export
// endpoint's entry point.

import Map "mo:core/Map";
import Principal "mo:core/Principal";

import Common "../types/common";
import Drafts "../types/drafts";
import Export "../types/export";
import Files "../types/files";
import DraftsLib "drafts";
import Docx "docx";
import FilesLib "files";

module {
  public func exportDocx(
    files : Map.Map<Principal, FilesLib.UserFiles>,
    passages : Map.Map<Principal, FilesLib.UserPassages>,
    drafts : Map.Map<Principal, DraftsLib.UserDrafts>,
    caller : Principal,
    draftId : Common.Id,
    options : Export.ExportOptions,
  ) : Export.ExportedDocument {
    Docx.exportDocx(files, passages, drafts, caller, draftId, options);
  };
};
