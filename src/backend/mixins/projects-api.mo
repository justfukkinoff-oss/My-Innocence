// Public project endpoints. Every call is scoped to the signed-in caller.

import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Time "mo:core/Time";

import Common "../types/common";
import Files "../types/files";
import Projects "../types/projects";
import FilesLib "../lib/files";
import ProjectsLib "../lib/projects";

mixin (
  projects : Map.Map<Principal, ProjectsLib.UserProjects>,
  files : Map.Map<Principal, FilesLib.UserFiles>,
  passages : Map.Map<Principal, FilesLib.UserPassages>,
) {
  public shared ({ caller }) func createProject(input : Projects.ProjectInput) : async Projects.Project {
    ProjectsLib.create(projects, files, caller, input, Time.now());
  };

  public shared ({ caller }) func renameProject(id : Common.Id, input : Projects.ProjectInput) : async Projects.Project {
    ProjectsLib.rename(projects, files, caller, id, input, Time.now());
  };

  public query ({ caller }) func listProjects() : async [Projects.Project] {
    ProjectsLib.list(projects, files, caller);
  };

  public shared ({ caller }) func deleteProject(id : Common.Id) : async () {
    ProjectsLib.delete(projects, files, passages, caller, id);
  };
};
