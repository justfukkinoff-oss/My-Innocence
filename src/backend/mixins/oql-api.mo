// OQL exposure for the workspace's queryable per-user data.
//
// Every entity is scoped to the signed-in caller: a user's own AI assistant
// reads only that user's rows, and the platform controller reads all. The
// per-user maps are keyed by owner principal, so each entity is built with
// `OQL.Entity.newScoped`, whose scoped iterator yields only the subject's rows.
//
// The row type is a flat record of primitives (the owner principal plus the
// stored record's fields), so every entity auto-derives its schema. The
// per-user maps are `Map<Principal, Map<Id, Record>>`, so the owner comes from
// the outer key and the id from the inner key — neither is a field of the
// stored record.

import Iter "mo:core/Iter";
import Map "mo:core/Map";
import Principal "mo:core/Principal";

import OQL "mo:caffeineai-oql";
import Entity "mo:caffeineai-oql/Entity";
import Expose "mo:caffeineai-oql/Expose";
import RecordValue "mo:caffeineai-oql/RecordValue";
import NatValue "mo:caffeineai-oql/NatValue";
import TextValue "mo:caffeineai-oql/TextValue";
import PrincipalValue "mo:caffeineai-oql/PrincipalValue";

import Common "../types/common";
import Drafts "../types/drafts";
import Files "../types/files";
import Projects "../types/projects";
import DraftsLib "../lib/drafts";
import FilesLib "../lib/files";
import ProjectsLib "../lib/projects";

mixin (
  projects : Map.Map<Principal, ProjectsLib.UserProjects>,
  caseFiles : Map.Map<Principal, FilesLib.UserFiles>,
  passages : Map.Map<Principal, FilesLib.UserPassages>,
  drafts : Map.Map<Principal, DraftsLib.UserDrafts>,
) {
  // ---- Flat row shapes (owner + stored record fields) ----

  type ProjectRow = {
    owner : Principal;
    id : Nat;
    name : Text;
    caption : Text;
    createdAt : Int;
    lastActivityAt : Int;
    fileCount : Nat;
  };

  type CaseFileRow = {
    owner : Principal;
    id : Nat;
    projectId : Nat;
    filename : Text;
    version : Nat;
    mimeType : Text;
    sizeBytes : Nat;
    pageCount : Nat;
    uploadedAt : Int;
  };

  type PassageRow = {
    owner : Principal;
    id : Nat;
    fileId : Nat;
    page : Nat;
    paragraph : Nat;
    text : Text;
  };

  type DraftRow = {
    owner : Principal;
    id : Nat;
    projectId : Nat;
    draftType : Text;
    title : Text;
    sectionCount : Nat;
    createdAt : Int;
    autosavedAt : Int;
  };

  // ---- Row sources, scoped to the query subject ----

  func projectRows(owner : ?Principal) : Iter.Iter<ProjectRow> {
    switch (owner) {
      case (?p) {
        switch (projects.get(p)) {
          case (?owned) owned.projects.entries().map(func((id, v)) = {
            owner = p;
            id;
            name = v.name;
            caption = v.caption;
            createdAt = v.createdAt;
            lastActivityAt = v.lastActivityAt;
            fileCount = v.fileCount;
          });
          case null [].values();
        };
      };
      case null {
        projects.entries().flatMap(func((p, owned)) = owned.projects.entries().map(func((id, v)) = {
          owner = p;
          id;
          name = v.name;
          caption = v.caption;
          createdAt = v.createdAt;
          lastActivityAt = v.lastActivityAt;
          fileCount = v.fileCount;
        }));
      };
    };
  };

  func fileRows(owner : ?Principal) : Iter.Iter<CaseFileRow> {
    switch (owner) {
      case (?p) {
        switch (caseFiles.get(p)) {
          case (?owned) owned.files.entries().map(func((id, v)) = {
            owner = p;
            id;
            projectId = v.projectId;
            filename = v.filename;
            version = v.version;
            mimeType = v.mimeType;
            sizeBytes = v.sizeBytes;
            pageCount = v.pageCount;
            uploadedAt = v.uploadedAt;
          });
          case null [].values();
        };
      };
      case null {
        caseFiles.entries().flatMap(func((p, owned)) = owned.files.entries().map(func((id, v)) = {
          owner = p;
          id;
          projectId = v.projectId;
          filename = v.filename;
          version = v.version;
          mimeType = v.mimeType;
          sizeBytes = v.sizeBytes;
          pageCount = v.pageCount;
          uploadedAt = v.uploadedAt;
        }));
      };
    };
  };

  func passageRows(owner : ?Principal) : Iter.Iter<PassageRow> {
    switch (owner) {
      case (?p) {
        switch (passages.get(p)) {
          case (?owned) owned.passages.entries().map(func((id, v)) = {
            owner = p;
            id;
            fileId = v.fileId;
            page = v.page;
            paragraph = v.paragraph;
            text = v.text;
          });
          case null [].values();
        };
      };
      case null {
        passages.entries().flatMap(func((p, owned)) = owned.passages.entries().map(func((id, v)) = {
          owner = p;
          id;
          fileId = v.fileId;
          page = v.page;
          paragraph = v.paragraph;
          text = v.text;
        }));
      };
    };
  };

  func draftTypeText(t : Drafts.DraftType) : Text {
    switch (t) {
      case (#petition) "petition";
      case (#memorandum) "memorandum";
      case (#motion) "motion";
      case (#reply) "reply";
      case (#noticeOfExhaustion) "noticeOfExhaustion";
    };
  };

  func draftRows(owner : ?Principal) : Iter.Iter<DraftRow> {
    switch (owner) {
      case (?p) {
        switch (drafts.get(p)) {
          case (?owned) owned.drafts.entries().map(func((id, v)) = {
            owner = p;
            id;
            projectId = v.projectId;
            draftType = draftTypeText(v.draftType);
            title = v.title;
            sectionCount = v.sections.size();
            createdAt = v.createdAt;
            autosavedAt = v.autosavedAt;
          });
          case null [].values();
        };
      };
      case null {
        drafts.entries().flatMap(func((p, owned)) = owned.drafts.entries().map(func((id, v)) = {
          owner = p;
          id;
          projectId = v.projectId;
          draftType = draftTypeText(v.draftType);
          title = v.title;
          sectionCount = v.sections.size();
          createdAt = v.createdAt;
          autosavedAt = v.autosavedAt;
        }));
      };
    };
  };

  transient let anyP = Principal.fromText("aaaaa-aa");

  include Expose({
    entities = [
      OQL.Entity.newScoped<ProjectRow>("project", projectRows, "Project", "id")
        .sample({ owner = anyP; id = 0; name = ""; caption = ""; createdAt = 0; lastActivityAt = 0; fileCount = 0 })
        .ownedBy("owner")
        .scopedPerUser()
        .build(),
      OQL.Entity.newScoped<CaseFileRow>("caseFile", fileRows, "CaseFile", "id")
        .sample({ owner = anyP; id = 0; projectId = 0; filename = ""; version = 1; mimeType = ""; sizeBytes = 0; pageCount = 0; uploadedAt = 0 })
        .ownedBy("owner")
        .scopedPerUser()
        .build(),
      OQL.Entity.newScoped<PassageRow>("passage", passageRows, "Passage", "id")
        .sample({ owner = anyP; id = 0; fileId = 0; page = 1; paragraph = 1; text = "" })
        .ownedBy("owner")
        .scopedPerUser()
        .build(),
      OQL.Entity.newScoped<DraftRow>("draft", draftRows, "Draft", "id")
        .sample({ owner = anyP; id = 0; projectId = 0; draftType = "petition"; title = ""; sectionCount = 0; createdAt = 0; autosavedAt = 0 })
        .ownedBy("owner")
        .scopedPerUser()
        .build(),
    ];
  });
};
