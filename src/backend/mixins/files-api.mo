// Public case-file endpoints. Every call is scoped to the signed-in caller.

import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Time "mo:core/Time";

import Common "../types/common";
import Files "../types/files";
import FilesLib "../lib/files";

mixin (
  files : Map.Map<Principal, FilesLib.UserFiles>,
  passages : Map.Map<Principal, FilesLib.UserPassages>,
) {
  public shared ({ caller }) func registerCaseFile(input : Files.CaseFileInput) : async Files.CaseFile {
    FilesLib.register(files, passages, caller, input, Time.now());
  };

  public query ({ caller }) func listCaseFiles(projectId : Common.Id) : async [Files.CaseFile] {
    FilesLib.list(files, caller, projectId);
  };

  public query ({ caller }) func getFilePassages(fileId : Common.Id, start : Nat) : async Files.PassagePage {
    FilesLib.passages(files, passages, caller, fileId, start);
  };

  public shared ({ caller }) func deleteCaseFile(fileId : Common.Id) : async () {
    FilesLib.delete(files, passages, caller, fileId);
  };

  public shared ({ caller }) func retryFileIndexing(fileId : Common.Id) : async Files.CaseFile {
    FilesLib.retryIndexing(files, passages, caller, fileId, Time.now());
  };
};
