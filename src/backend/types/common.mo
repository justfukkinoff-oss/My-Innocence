// Cross-cutting types shared by every habeas-workspace domain.
//
// Timestamps are signed Int nanoseconds from `Time.now()`. Ids and counters
// are Nat. Every record here is a shared (Candid-serializable) type so it can
// cross the actor boundary unchanged.

module {
  // Nanoseconds since the Unix epoch, as returned by `Time.now()`.
  public type Timestamp = Int;

  // Monotonic per-user identifier for a project, file, passage or draft.
  public type Id = Nat;

  // A page number inside a case file, 1-based.
  public type PageNumber = Nat;

  // A paragraph number inside a page, 1-based.
  public type ParagraphNumber = Nat;

  // Where a passage sits in a case file.
  public type PassageLocator = {
    fileId : Id;
    page : PageNumber;
    paragraph : ParagraphNumber;
  };

  // Lifecycle of an indexing job attached to a case file.
  public type IndexingStatus = {
    #pending;
    #indexing;
    #indexed;
    #failed : { reason : Text };
  };

  // A passage of case-file text with its locator, as returned to the browser.
  public type Passage = {
    id : Id;
    fileId : Id;
    page : PageNumber;
    paragraph : ParagraphNumber;
    text : Text;
  };

  // A passage plus the file it came from, for citation display.
  public type CitedPassage = {
    passage : Passage;
    filename : Text;
  };
};
