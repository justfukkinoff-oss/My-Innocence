// Per-user first-run attestation: read and record that the signed-in user
// confirmed they are in the United States and proceeding pro se.

import Map "mo:core/Map";
import Principal "mo:core/Principal";

import Attestation "../types/attestation";
import Common "../types/common";

module {
  public func get(
    all : Map.Map<Principal, Attestation.Attestation>,
    caller : Principal,
  ) : Attestation.Attestation {
    switch (all.get(caller)) {
      case (?attestation) attestation;
      case null ({ confirmed = false; confirmedAt = null });
    };
  };

  public func confirm(
    all : Map.Map<Principal, Attestation.Attestation>,
    caller : Principal,
    now : Common.Timestamp,
  ) : Attestation.Attestation {
    let attestation : Attestation.Attestation = { confirmed = true; confirmedAt = ?now };
    all.add(caller, attestation);
    attestation;
  };
};
