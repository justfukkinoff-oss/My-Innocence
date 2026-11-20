// Retrieval over the indexed library: cited passages or an explicit
// not-found-in-library outcome.

import Common "../types/common";

module {
  // Scope of a retrieval question: one project, or the whole library.
  public type RetrievalScope = {
    #project : Common.Id;
    #library;
  };

  public type RetrievalRequest = {
    scope : RetrievalScope;
    question : Text;
  };

  public type RetrievalResult = {
    #found : { passages : [Common.CitedPassage] };
    #notFoundInLibrary;
  };

  // A grounded answer to a retrieval question. `answer` is the model's prose
  // written only from `passages`; `passages` carries the file, page and
  // paragraph locators the answer rests on. `#notFoundInLibrary` means the
  // library held no passage supporting the question, so no answer was written.
  public type GroundedAnswer = {
    #answered : {
      answer : Text;
      passages : [Common.CitedPassage];
    };
    #notFoundInLibrary;
  };
};
