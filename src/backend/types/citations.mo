// Citation verification and grounding results for a draft.

import Common "../types/common";

module {
  // Where a citation appears in a draft.
  public type CitationLocation = {
    sectionId : Common.Id;
    // Character offset of the citation inside the section body.
    offset : Nat;
  };

  public type CitationStatus = {
    // Found in the indexed library; carries the supporting passage.
    #verifiedInLibrary : Common.CitedPassage;
    #unverified;
    #malformed;
  };

  public type CitationCheck = {
    // The citation exactly as it appears in the draft.
    rawText : Text;
    location : CitationLocation;
    status : CitationStatus;
  };

  public type CitationCheckResult = {
    citations : [CitationCheck];
  };

  // A draft sentence with no supporting library citation.
  public type UngroundedSentence = {
    sectionId : Common.Id;
    sentence : Text;
  };

  public type GroundingResult = {
    ungrounded : [UngroundedSentence];
  };
};
