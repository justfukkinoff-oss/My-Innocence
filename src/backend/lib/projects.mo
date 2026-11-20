// Per-user project store: create, rename, list, delete. Every operation is
// scoped to the calling principal's own project map.
//
// A project's `fileCount` and `indexingStatus` are derived from the caller's
// case files on every read, so they can never drift from the library.

import Int "mo:core/Int";
import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";

import Common "../types/common";
import Files "../types/files";
import Projects "../types/projects";
import FilesLib "files";

module {
  // The caller's projects, keyed by project id.
  public type UserProjects = {
    var nextId : Common.Id;
    projects : Map.Map<Common.Id, Projects.Project>;
  };

  let maxNameChars : Nat = 120;
  let maxCaptionChars : Nat = 400;

  func userProjects(all : Map.Map<Principal, UserProjects>, caller : Principal) : UserProjects {
    switch (all.get(caller)) {
      case (?owned) owned;
      case null {
        let fresh : UserProjects = { var nextId = 0; projects = Map.empty() };
        all.add(caller, fresh);
        fresh;
      };
    };
  };

  func ownProject(all : Map.Map<Principal, UserProjects>, caller : Principal, id : Common.Id) : Projects.Project {
    switch (all.get(caller)) {
      case (?owned) {
        switch (owned.projects.get(id)) {
          case (?project) project;
          case null Runtime.trap("Unknown project");
        };
      };
      case null Runtime.trap("Unknown project");
    };
  };

  func validate(input : Projects.ProjectInput) {
    if (input.name.size() == 0 or input.name.size() > maxNameChars) {
      Runtime.trap("Project name must be 1 to 120 characters");
    };
    if (input.caption.size() > maxCaptionChars) {
      Runtime.trap("Case caption must be at most 400 characters");
    };
  };

  // The project's files, newest upload first.
  func projectFiles(
    files : Map.Map<Principal, FilesLib.UserFiles>,
    caller : Principal,
    projectId : Common.Id,
  ) : [Files.CaseFile] {
    switch (files.get(caller)) {
      case null [];
      case (?owned) {
        let matching = owned.files.values().filter(func(file) = file.projectId == projectId).toArray();
        matching.sort(func(a, b) = Int.compare(b.uploadedAt, a.uploadedAt));
      };
    };
  };

  // Aggregate indexing status over the project's files: any failure surfaces
  // first (so the user sees what needs a retry), then in-flight work, then
  // success. An empty project is `#indexed` — nothing is outstanding.
  func aggregateStatus(files : [Files.CaseFile]) : Common.IndexingStatus {
    var anyFailed : ?Text = null;
    var anyIndexing = false;
    var anyPending = false;
    for (file in files.values()) {
      switch (file.indexingStatus) {
        case (#failed({ reason })) {
          if (anyFailed == null) { anyFailed := ?reason };
        };
        case (#indexing) { anyIndexing := true };
        case (#pending) { anyPending := true };
        case (#indexed) {};
      };
    };
    switch (anyFailed) {
      case (?reason) #failed({ reason });
      case null {
        if (anyIndexing) { #indexing } else if (anyPending) { #pending } else { #indexed };
      };
    };
  };

  // The stored project with its derived file count and indexing status.
  func withDerived(
    project : Projects.Project,
    files : Map.Map<Principal, FilesLib.UserFiles>,
    caller : Principal,
  ) : Projects.Project {
    let owned = projectFiles(files, caller, project.id);
    {
      project with
      fileCount = owned.size();
      indexingStatus = aggregateStatus(owned);
    };
  };

  public func create(
    all : Map.Map<Principal, UserProjects>,
    files : Map.Map<Principal, FilesLib.UserFiles>,
    caller : Principal,
    input : Projects.ProjectInput,
    now : Common.Timestamp,
  ) : Projects.Project {
    validate(input);
    let owned = userProjects(all, caller);
    let id = owned.nextId;
    owned.nextId += 1;
    let project : Projects.Project = {
      id;
      name = input.name;
      caption = input.caption;
      createdAt = now;
      lastActivityAt = now;
      fileCount = 0;
      indexingStatus = #indexed;
    };
    owned.projects.add(id, project);
    withDerived(project, files, caller);
  };

  public func rename(
    all : Map.Map<Principal, UserProjects>,
    files : Map.Map<Principal, FilesLib.UserFiles>,
    caller : Principal,
    id : Common.Id,
    input : Projects.ProjectInput,
    now : Common.Timestamp,
  ) : Projects.Project {
    validate(input);
    let project = ownProject(all, caller, id);
    let updated : Projects.Project = {
      project with
      name = input.name;
      caption = input.caption;
      lastActivityAt = now;
    };
    switch (all.get(caller)) {
      case (?owned) owned.projects.add(id, updated);
      case null {};
    };
    withDerived(updated, files, caller);
  };

  // Newest activity first.
  public func list(
    all : Map.Map<Principal, UserProjects>,
    files : Map.Map<Principal, FilesLib.UserFiles>,
    caller : Principal,
  ) : [Projects.Project] {
    switch (all.get(caller)) {
      case null [];
      case (?owned) {
        let views = owned.projects.values().map(
          func(project) = withDerived(project, files, caller)
        ).toArray();
        views.sort(func(a, b) = Int.compare(b.lastActivityAt, a.lastActivityAt));
      };
    };
  };

  // Deletes the project and every case file (and its passages) inside it.
  public func delete(
    all : Map.Map<Principal, UserProjects>,
    files : Map.Map<Principal, FilesLib.UserFiles>,
    passages : Map.Map<Principal, FilesLib.UserPassages>,
    caller : Principal,
    id : Common.Id,
  ) : () {
    ignore ownProject(all, caller, id);
    for (file in projectFiles(files, caller, id).values()) {
      FilesLib.delete(files, passages, caller, file.id);
    };
    switch (all.get(caller)) {
      case (?owned) owned.projects.remove(id);
      case null {};
    };
  };
};
