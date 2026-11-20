// Per-user §2254 drafts: create, read, autosave, list versions, restore a
// version.
//
// Every operation is scoped to the calling principal's own draft map, so one
// user can never read or modify another user's drafts. A draft's `sections`
// array is its ordered outline; each autosave appends a restorable snapshot to
// `versions` and stamps `autosavedAt`.

import Array "mo:core/Array";
import Int "mo:core/Int";
import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";

import Common "../types/common";
import Drafts "../types/drafts";

module {
  // The caller's drafts, keyed by draft id.
  public type UserDrafts = {
    var nextId : Common.Id;
    drafts : Map.Map<Common.Id, Drafts.Draft>;
  };

  // Bounds that keep a draft and its history inside the IC reply limit.
  let maxTitleChars : Nat = 200;
  let maxSections : Nat = 100;
  let maxSectionChars : Nat = 40_000;
  let maxVersions : Nat = 20;

  func userDrafts(all : Map.Map<Principal, UserDrafts>, caller : Principal) : UserDrafts {
    switch (all.get(caller)) {
      case (?owned) owned;
      case null {
        let fresh : UserDrafts = { var nextId = 0; drafts = Map.empty() };
        all.add(caller, fresh);
        fresh;
      };
    };
  };

  func ownDraft(all : Map.Map<Principal, UserDrafts>, caller : Principal, id : Common.Id) : Drafts.Draft {
    switch (all.get(caller)) {
      case (?owned) {
        switch (owned.drafts.get(id)) {
          case (?draft) draft;
          case null Runtime.trap("Unknown draft");
        };
      };
      case null Runtime.trap("Unknown draft");
    };
  };

  func validateContent(content : Drafts.DraftContent) {
    if (content.title.size() > maxTitleChars) {
      Runtime.trap("Draft title is too long");
    };
    if (content.sections.size() > maxSections) {
      Runtime.trap("Draft has too many sections");
    };
    for (section in content.sections.values()) {
      if (section.body.size() > maxSectionChars) {
        Runtime.trap("Draft section is too long");
      };
    };
  };

  // The default ordered outline for a draft type, so a new draft opens with
  // the sections a §2254 filing of that kind needs.
  func defaultOutline(draftType : Drafts.DraftType) : [Drafts.DraftSection] {
    let headings : [Text] = switch (draftType) {
      case (#petition) [
        "Caption",
        "Statement of the Case",
        "Statement of Facts",
        "Grounds for Relief",
        "Exhaustion of State Remedies",
        "Timeliness Under 28 U.S.C. § 2244(d)",
        "Request for Relief",
        "Verification",
      ];
      case (#memorandum) [
        "Introduction",
        "Statement of Facts",
        "Standard of Review",
        "Argument",
        "Conclusion",
      ];
      case (#motion) [
        "Caption",
        "Relief Requested",
        "Statement of Facts",
        "Argument",
        "Proposed Order",
      ];
      case (#reply) [
        "Caption",
        "Introduction",
        "Argument in Reply",
        "Conclusion",
      ];
      case (#noticeOfExhaustion) [
        "Caption",
        "State Court Proceedings",
        "Remedies Available and Exhausted",
        "Conclusion",
      ];
    };
    Array.tabulate(headings.size(), func(i) = { id = i; heading = headings[i]; body = "" });
  };

  public func create(
    all : Map.Map<Principal, UserDrafts>,
    caller : Principal,
    input : Drafts.DraftInput,
    now : Common.Timestamp,
  ) : Drafts.Draft {
    if (input.title.size() > maxTitleChars) {
      Runtime.trap("Draft title is too long");
    };
    let owned = userDrafts(all, caller);
    let id = owned.nextId;
    owned.nextId += 1;
    let draft : Drafts.Draft = {
      id;
      projectId = input.projectId;
      draftType = input.draftType;
      title = input.title;
      sections = defaultOutline(input.draftType);
      createdAt = now;
      autosavedAt = now;
      versions = [];
    };
    owned.drafts.add(id, draft);
    draft;
  };

  public func get(
    all : Map.Map<Principal, UserDrafts>,
    caller : Principal,
    id : Common.Id,
  ) : Drafts.Draft {
    ownDraft(all, caller, id);
  };

  // The caller's drafts for one project, newest first.
  public func list(
    all : Map.Map<Principal, UserDrafts>,
    caller : Principal,
    projectId : Common.Id,
  ) : [Drafts.Draft] {
    switch (all.get(caller)) {
      case null [];
      case (?owned) {
        let matching = owned.drafts.values().filter(func(draft) = draft.projectId == projectId).toArray();
        matching.sort(func(a, b) = Int.compare(b.autosavedAt, a.autosavedAt));
      };
    };
  };

  // Saves the current outline and body, snapshotting the previous state into
  // the version history first so the edit can be restored.
  public func autosave(
    all : Map.Map<Principal, UserDrafts>,
    caller : Principal,
    id : Common.Id,
    content : Drafts.DraftContent,
    now : Common.Timestamp,
  ) : Drafts.Draft {
    validateContent(content);
    let draft = ownDraft(all, caller, id);
    let snapshot : Drafts.DraftVersion = {
      version = draft.versions.size();
      sections = draft.sections;
      savedAt = draft.autosavedAt;
    };
    let history = draft.versions.concat([snapshot]);
    let bounded = if (history.size() > maxVersions) {
      history.sliceToArray(history.size() - maxVersions : Int, history.size() : Int);
    } else {
      history;
    };
    let updated : Drafts.Draft = {
      id = draft.id;
      projectId = draft.projectId;
      draftType = draft.draftType;
      title = content.title;
      sections = content.sections;
      createdAt = draft.createdAt;
      autosavedAt = now;
      versions = bounded;
    };
    let owned = userDrafts(all, caller);
    owned.drafts.add(id, updated);
    updated;
  };

  // Restores the outline and body of a saved version, snapshotting the current
  // state into the history first so the restore itself is reversible.
  public func restoreVersion(
    all : Map.Map<Principal, UserDrafts>,
    caller : Principal,
    id : Common.Id,
    version : Nat,
    now : Common.Timestamp,
  ) : Drafts.Draft {
    let draft = ownDraft(all, caller, id);
    let target = switch (draft.versions.find(func(v) = v.version == version)) {
      case (?v) v;
      case null Runtime.trap("Unknown draft version");
    };
    let snapshot : Drafts.DraftVersion = {
      version = draft.versions.size();
      sections = draft.sections;
      savedAt = draft.autosavedAt;
    };
    let history = draft.versions.concat([snapshot]);
    let bounded = if (history.size() > maxVersions) {
      history.sliceToArray(history.size() - maxVersions : Int, history.size() : Int);
    } else {
      history;
    };
    let updated : Drafts.Draft = {
      id = draft.id;
      projectId = draft.projectId;
      draftType = draft.draftType;
      title = draft.title;
      sections = target.sections;
      createdAt = draft.createdAt;
      autosavedAt = now;
      versions = bounded;
    };
    let owned = userDrafts(all, caller);
    owned.drafts.add(id, updated);
    updated;
  };

  public func delete(
    all : Map.Map<Principal, UserDrafts>,
    caller : Principal,
    id : Common.Id,
  ) : () {
    ignore ownDraft(all, caller, id);
    switch (all.get(caller)) {
      case (?owned) owned.drafts.remove(id);
      case null {};
    };
  };
};
