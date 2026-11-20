// Per-user model provider key (BYOK) status.

module {
  // What the browser may learn about the caller's saved key. The full key is
  // never returned after saving.
  public type KeyStatus = {
    configured : Bool;
    // Last four characters of the saved key, for recognition only.
    last4 : ?Text;
  };

  // Result of validating a pasted key against the provider.
  public type KeyValidation = {
    #valid;
    #invalid : { reason : Text };
  };
};
