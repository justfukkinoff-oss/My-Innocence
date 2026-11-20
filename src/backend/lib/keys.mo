// Per-user model provider key (BYOK): save and validate a pasted key, report
// configured status with only the last four characters, remove the key. The
// full key is never returned to the browser after saving.

import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Text "mo:core/Text";

import Keys "../types/keys";

module {
  // The caller's saved provider key. Never read outside this module.
  public type UserKeys = {
    var key : ?Text;
  };

  let minKeyChars : Nat = 20;
  let maxKeyChars : Nat = 400;

  func userKeys(all : Map.Map<Principal, UserKeys>, caller : Principal) : UserKeys {
    switch (all.get(caller)) {
      case (?owned) owned;
      case null {
        let fresh : UserKeys = { var key = null };
        all.add(caller, fresh);
        fresh;
      };
    };
  };

  func last4(key : Text) : Text {
    let chars = key.toArray();
    let n = chars.size();
    if (n < 4) { return key };
    Text.fromIter(chars.sliceToArray((n - 4).toInt(), n.toInt()).values());
  };

  // Validates the pasted key's shape and stores it. The key is never echoed
  // back; only its last four characters are ever reported.
  public func save(
    all : Map.Map<Principal, UserKeys>,
    caller : Principal,
    key : Text,
  ) : Keys.KeyValidation {
    let trimmed = key.trim(#char ' ');
    if (trimmed.size() < minKeyChars or trimmed.size() > maxKeyChars) {
      return #invalid({ reason = "That does not look like a provider API key" });
    };
    if (trimmed.contains(#char ' ') or trimmed.contains(#char '\n')) {
      return #invalid({ reason = "API keys contain no spaces" });
    };
    let owned = userKeys(all, caller);
    owned.key := ?trimmed;
    #valid;
  };

  public func status(
    all : Map.Map<Principal, UserKeys>,
    caller : Principal,
  ) : Keys.KeyStatus {
    switch (all.get(caller)) {
      case (?owned) {
        switch (owned.key) {
          case (?key) ({ configured = true; last4 = ?last4(key) });
          case null ({ configured = false; last4 = null });
        };
      };
      case null ({ configured = false; last4 = null });
    };
  };

  public func remove(
    all : Map.Map<Principal, UserKeys>,
    caller : Principal,
  ) : () {
    switch (all.get(caller)) {
      case (?owned) owned.key := null;
      case null {};
    };
  };

  // The caller's saved key, for canister-side provider calls only. Never
  // exposed through a public endpoint.
  public func providerKey(
    all : Map.Map<Principal, UserKeys>,
    caller : Principal,
  ) : ?Text {
    switch (all.get(caller)) {
      case (?owned) owned.key;
      case null null;
    };
  };
};
