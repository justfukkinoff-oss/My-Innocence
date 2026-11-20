// Composition root for the §2254 habeas workspace canister.
//
// The app is a per-user pro se litigation workspace: projects hold uploaded
// case files, files are indexed into passages, drafts are written against the
// library, and citations are verified against it. Every endpoint is scoped to
// the signed-in caller, so one user can never read or modify another user's
// projects, files, drafts, citations or key status.
//
// The chat surface from the template is kept unchanged: the browser talks to
// Caffeine Inference directly and this canister only brokers short-lived
// ephemeral credentials and stores conversation history.

import AccessControl "mo:caffeineai-authorization/access-control";
import MixinAuthorization "mo:caffeineai-authorization/MixinAuthorization";
import MixinObjectStorage "mo:caffeineai-object-storage/Mixin";
import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Time "mo:core/Time";

import Attestation "types/attestation";

import AttestationLib "lib/attestation";
import DraftsLib "lib/drafts";
import FilesLib "lib/files";
import History "lib/history";
import Inference "lib/inference";
import KeysLib "lib/keys";
import ProjectsLib "lib/projects";

import ApiDocMixin "mixins/api-doc";
import AttestationApi "mixins/attestation-api";
import CitationsApi "mixins/citations-api";
import DraftsApi "mixins/drafts-api";
import ExportApi "mixins/export-api";
import FilesApi "mixins/files-api";
import KeysApi "mixins/keys-api";
import OqlApi "mixins/oql-api";
import ProjectsApi "mixins/projects-api";
import RetrievalApi "mixins/retrieval-api";

actor {
  // ---- Stable state (types only — initial values come from the migration) ----

  let accessControlState : AccessControl.AccessControlState;

  // Per-user conversation history, recorded by the frontend after each
  // completed exchange (the completions themselves never pass through here).
  let conversations : Map.Map<Principal, History.UserChats>;

  // Habeas workspace state, all keyed by the owning principal.
  let projects : Map.Map<Principal, ProjectsLib.UserProjects>;
  let caseFiles : Map.Map<Principal, FilesLib.UserFiles>;
  let passages : Map.Map<Principal, FilesLib.UserPassages>;
  let drafts : Map.Map<Principal, DraftsLib.UserDrafts>;
  let modelKeys : Map.Map<Principal, KeysLib.UserKeys>;
  let attestations : Map.Map<Principal, Attestation.Attestation>;

  // Per-principal sliding-window counters for credential mints. Transient:
  // rate limiting is bookkeeping over the last hour, and surviving an
  // upgrade would keep callers blocked through a redeploy.
  transient let credentialGrants = Map.empty<Principal, Inference.GrantWindow>();

  // ---- Authorization ----

  include MixinAuthorization(accessControlState, null);

  // Object storage plumbing for case-file uploads.
  include MixinObjectStorage();

  // Single-user app: the first principal to sign in becomes the owner
  // (AccessControl.initialize assigns #admin exactly once, during the
  // Internet Identity sign-in flow) and every call is owner-only from then
  // on. Anyone else is pointed at remixing their own copy.
  func requireOwner(caller : Principal) {
    if (caller.isAnonymous()) {
      Runtime.trap("Unauthorized: sign in to use this workspace");
    };
    switch (accessControlState.userRoles.get(caller)) {
      case (?#admin) {};
      case (_) {
        Runtime.trap(
          "This workspace belongs to its owner. Remix your own copy from the Caffeine App Market."
        );
      };
    };
  };

  // Anonymous-safe diagnostic: reports only whether the platform has
  // provisioned inference credentials, never anything about them.
  public shared func isInferenceConfigured() : async Bool {
    Inference.isConfigured();
  };

  // Owner-only diagnostic for the mint path: performs a real ephemeral mint
  // and reports metadata only — the key itself is discarded, so nothing
  // spendable is exposed. Each call is one HTTP outcall, so only the owner may
  // make it, and it shares the owner's credential rate window.
  public shared ({ caller }) func probeEphemeralMint() : async {
    last4 : Text;
    expiresAt : Text;
  } {
    requireOwner(caller);
    Inference.checkRateLimit(credentialGrants, caller, Time.now());
    let minted = await* Inference.mintEphemeral<system>("probe");
    { last4 = Inference.last4(minted.apiKey); expiresAt = minted.expiresAt };
  };

  // ---- Inference credential brokering ----

  // Recently minted child keys, per principal, so a burst of page reloads
  // reuses one key instead of minting (and rate-charging) each time.
  // Transient on purpose: an upgrade — which is also when the platform
  // rotates the parent and revokes all children — starts it empty.
  transient let childCache = Map.empty<Principal, Inference.CachedGrant>();

  // Mints and returns a short-lived ephemeral key for the caller. Any signed-in
  // user of this app can obtain one — direct browser calls are the point of
  // this app — but what they get expires on its own (3h TTL), spends against
  // the app key's caps, and dies with the parent on every app deploy. The
  // caller must be authenticated, mints are rate-limited per principal, the
  // grant is labeled with the caller for attribution, and the frontend keeps
  // the key in memory only.
  public shared ({ caller }) func getInferenceCredentials() : async Inference.Credentials {
    requireOwner(caller);
    let now = Time.now();
    switch (Inference.cachedGrant(childCache, caller, now)) {
      case (?credentials) { return credentials };
      case null {};
    };
    Inference.checkRateLimit(credentialGrants, caller, now);
    let minted = await* Inference.mintEphemeral<system>(caller.toText());
    childCache.add(caller, { credentials = minted; mintedAtNs = Time.now() });
    minted;
  };

  // ---- Conversation history ----

  public query ({ caller }) func listConversations() : async [History.ConversationSummary] {
    requireOwner(caller);
    History.list(conversations, caller);
  };

  // One page (25 messages) of a conversation, oldest-first — bounded so a
  // long conversation never exceeds the reply size limit.
  public query ({ caller }) func getConversationPage(id : Nat, start : Nat) : async History.MessagePage {
    requireOwner(caller);
    History.page(conversations, caller, id, start);
  };

  // Appends one completed user/assistant exchange; a null id starts a new
  // conversation. Returns the conversation id either way.
  public shared ({ caller }) func recordExchange(
    conversationId : ?Nat,
    userContent : Text,
    assistantContent : Text,
  ) : async Nat {
    requireOwner(caller);
    History.recordExchange(conversations, caller, conversationId, userContent, assistantContent, Time.now());
  };

  // Stores a running summary alongside the (untouched) full transcript; the
  // frontend uses it to keep prompts bounded on long conversations.
  public shared ({ caller }) func setConversationSummary(
    id : Nat,
    coversCount : Nat,
    content : Text,
  ) : async () {
    requireOwner(caller);
    History.setSummary(conversations, caller, id, coversCount, content, Time.now());
  };

  public shared ({ caller }) func deleteConversation(id : Nat) : async () {
    requireOwner(caller);
    History.delete(conversations, caller, id);
  };

  // ---- Habeas workspace ----

  include ProjectsApi(projects, caseFiles, passages);
  include FilesApi(caseFiles, passages);
  include RetrievalApi(caseFiles, passages, modelKeys);
  include DraftsApi(drafts);
  include CitationsApi(caseFiles, passages, drafts);
  include ExportApi(caseFiles, passages, drafts);
  include KeysApi(modelKeys);
  include AttestationApi(attestations);

  // ---- OQL: queryable per-user data (schema() / execute()) ----
  //
  // Every entity is scoped to the signed-in caller, so a user's own AI
  // assistant reads only that user's rows and the platform controller reads
  // all. The Expose mixin must stay included even when nothing is queryable:
  // the host refuses to deploy a backend whose interface lacks `schema()`
  // and `execute()`.

  include OqlApi(projects, caseFiles, passages, drafts);

  // ---- Behavioral API documentation ----

  include ApiDocMixin();
};
