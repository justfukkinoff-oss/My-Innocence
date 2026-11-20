// Public per-user model key endpoints. The full key is never returned.

import Map "mo:core/Map";
import Principal "mo:core/Principal";

import Keys "../types/keys";
import KeysLib "../lib/keys";

mixin (keys : Map.Map<Principal, KeysLib.UserKeys>) {
  public shared ({ caller }) func saveModelKey(key : Text) : async Keys.KeyValidation {
    KeysLib.save(keys, caller, key);
  };

  public query ({ caller }) func getModelKeyStatus() : async Keys.KeyStatus {
    KeysLib.status(keys, caller);
  };

  public shared ({ caller }) func removeModelKey() : async () {
    KeysLib.remove(keys, caller);
  };
};
