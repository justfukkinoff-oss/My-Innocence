// Public first-run attestation endpoints.

import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Time "mo:core/Time";

import Attestation "../types/attestation";
import AttestationLib "../lib/attestation";

mixin (attestations : Map.Map<Principal, Attestation.Attestation>) {
  public query ({ caller }) func getAttestation() : async Attestation.Attestation {
    AttestationLib.get(attestations, caller);
  };

  public shared ({ caller }) func confirmAttestation() : async Attestation.Attestation {
    AttestationLib.confirm(attestations, caller, Time.now());
  };
};
