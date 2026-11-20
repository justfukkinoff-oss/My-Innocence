// First-run attestation: the user confirms they are in the United States and
// proceeding pro se.

import Common "../types/common";

module {
  public type Attestation = {
    confirmed : Bool;
    confirmedAt : ?Common.Timestamp;
  };
};
