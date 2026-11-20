// Public retrieval endpoints: answer a question scoped to one project or the
// whole library, returning cited passages or an explicit not-found outcome.

import Map "mo:core/Map";
import Principal "mo:core/Principal";

import Files "../types/files";
import Keys "../types/keys";
import Retrieval "../types/retrieval";
import FilesLib "../lib/files";
import KeysLib "../lib/keys";
import RetrievalLib "../lib/retrieval";

mixin (
  files : Map.Map<Principal, FilesLib.UserFiles>,
  passages : Map.Map<Principal, FilesLib.UserPassages>,
  keys : Map.Map<Principal, KeysLib.UserKeys>,
) {
  // Lexical search over the caller's indexed passages: the best supporting
  // passages with their locators, or `#notFoundInLibrary`.
  public shared ({ caller }) func retrievePassages(request : Retrieval.RetrievalRequest) : async Retrieval.RetrievalResult {
    RetrievalLib.retrieve(files, passages, caller, request);
  };

  // Grounded answer: the caller's own model answers strictly from the
  // supporting passages, which are returned alongside the answer as citations.
  public shared ({ caller }) func answerFromLibrary(request : Retrieval.RetrievalRequest) : async Retrieval.GroundedAnswer {
    await RetrievalLib.groundedAnswer(files, passages, keys, caller, request);
  };
};
