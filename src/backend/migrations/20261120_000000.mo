// Adds the §2254 habeas workspace state to the chat canister.
//
// OldActor is the NewActor of the previous migration (20260903_000000.mo):
// the authorization state and the per-user conversation history. NewActor
// keeps both unchanged and adds the per-user workspace collections, each
// starting empty. Self-contained: only mo:core imports; every type is
// inlined because the chain replays forever.

import List "mo:core/List";
import Map "mo:core/Map";
import Principal "mo:core/Principal";

module {
  type UserRole = { #admin; #user; #guest };

  type AccessControlState = {
    var adminAssigned : Bool;
    userRoles : Map.Map<Principal, UserRole>;
  };

  type StoredMessage = {
    role : { #user; #assistant };
    content : Text;
    createdAtNs : Int;
  };

  type Summary = {
    content : Text;
    coversCount : Nat;
    createdAtNs : Int;
  };

  type Conversation = {
    id : Nat;
    var title : Text;
    createdAtNs : Int;
    var updatedAtNs : Int;
    var summary : ?Summary;
    messages : List.List<StoredMessage>;
  };

  type UserChats = {
    var nextId : Nat;
    chats : Map.Map<Nat, Conversation>;
  };

  // ---- Workspace shapes (mirror types/*.mo) ----

  type IndexingStatus = {
    #pending;
    #indexing;
    #indexed;
    #failed : { reason : Text };
  };

  type Project = {
    id : Nat;
    name : Text;
    caption : Text;
    createdAt : Int;
    lastActivityAt : Int;
    fileCount : Nat;
    indexingStatus : IndexingStatus;
  };

  type UserProjects = {
    var nextId : Nat;
    projects : Map.Map<Nat, Project>;
  };

  type CaseFile = {
    id : Nat;
    projectId : Nat;
    filename : Text;
    version : Nat;
    mimeType : Text;
    sizeBytes : Nat;
    pageCount : Nat;
    blob : Blob;
    // Text the browser extracted from the upload; the indexer splits it into
    // passages. Absent when extraction produced nothing.
    extractedText : ?Text;
    indexingStatus : IndexingStatus;
    uploadedAt : Int;
  };

  type UserFiles = {
    var nextId : Nat;
    files : Map.Map<Nat, CaseFile>;
  };

  type Passage = {
    id : Nat;
    fileId : Nat;
    page : Nat;
    paragraph : Nat;
    text : Text;
  };

  type UserPassages = {
    var nextId : Nat;
    passages : Map.Map<Nat, Passage>;
  };

  type DraftType = {
    #petition;
    #memorandum;
    #motion;
    #reply;
    #noticeOfExhaustion;
  };

  type DraftSection = {
    id : Nat;
    heading : Text;
    body : Text;
  };

  type DraftVersion = {
    version : Nat;
    sections : [DraftSection];
    savedAt : Int;
  };

  type Draft = {
    id : Nat;
    projectId : Nat;
    draftType : DraftType;
    title : Text;
    sections : [DraftSection];
    createdAt : Int;
    autosavedAt : Int;
    versions : [DraftVersion];
  };

  type UserDrafts = {
    var nextId : Nat;
    drafts : Map.Map<Nat, Draft>;
  };

  type UserKeys = {
    var key : ?Text;
  };

  type Attestation = {
    confirmed : Bool;
    confirmedAt : ?Int;
  };

  type OldActor = {
    accessControlState : AccessControlState;
    conversations : Map.Map<Principal, UserChats>;
  };

  type NewActor = {
    accessControlState : AccessControlState;
    conversations : Map.Map<Principal, UserChats>;
    projects : Map.Map<Principal, UserProjects>;
    caseFiles : Map.Map<Principal, UserFiles>;
    passages : Map.Map<Principal, UserPassages>;
    drafts : Map.Map<Principal, UserDrafts>;
    modelKeys : Map.Map<Principal, UserKeys>;
    attestations : Map.Map<Principal, Attestation>;
  };

  public func migration(old : OldActor) : NewActor {
    {
      accessControlState = old.accessControlState;
      conversations = old.conversations;
      projects = Map.empty();
      caseFiles = Map.empty();
      passages = Map.empty();
      drafts = Map.empty();
      modelKeys = Map.empty();
      attestations = Map.empty();
    };
  };
};
