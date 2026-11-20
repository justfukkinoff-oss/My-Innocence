// Retrieval over the caller's indexed passages, scoped to one project or the
// whole library, returning cited passages or an explicit not-found outcome.
//
// `retrieve` is the deterministic lexical search: it scores every in-scope
// passage by how many distinct question terms it contains and returns the best
// few with their locators. `groundedAnswer` builds on it: when the search finds
// supporting passages it asks the caller's own model (BYOK) to answer strictly
// from those passages, and returns the answer together with the citations it
// rests on. When the library holds nothing supporting the question it returns
// `#notFoundInLibrary` and never calls the model.

import List "mo:core/List";
import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Text "mo:core/Text";

import ChatApi "mo:caffeineai-inference-client/Apis/ChatApi";
import Config "mo:caffeineai-inference-client/Config";
import ChatCompletionRequest "mo:caffeineai-inference-client/Models/ChatCompletionRequest";
import ChatCompletionRequestMessage "mo:caffeineai-inference-client/Models/ChatCompletionRequestMessage";
import ChatCompletionRequestMessageOneOf "mo:caffeineai-inference-client/Models/ChatCompletionRequestMessageOneOf";
import ChatCompletionRequestMessageOneOf2 "mo:caffeineai-inference-client/Models/ChatCompletionRequestMessageOneOf2";

import Common "../types/common";
import Files "../types/files";
import Keys "../types/keys";
import Retrieval "../types/retrieval";
import FilesLib "files";
import KeysLib "keys";

module {
  // Words too common to discriminate between passages.
  let stopWords : [Text] = [
    "the", "and", "for", "that", "this", "with", "from", "was", "were", "are",
    "has", "have", "had", "not", "but", "his", "her", "its", "they", "them",
    "which", "what", "when", "where", "who", "how", "why", "into", "than",
    "then", "there", "their", "been", "being", "does", "did", "can", "could",
    "would", "should", "will", "shall", "may", "might", "must", "about", "also",
    "any", "all", "some", "such", "only", "more", "most", "other", "upon",
  ];

  // Passages returned to the browser and offered to the model per question.
  let maxCited : Nat = 5;

  // Characters of each passage offered to the model, so a handful of long
  // passages still fit one prompt.
  let maxPassageCharsForPrompt : Nat = 1_500;

  func terms(question : Text) : [Text] {
    question.toLower()
      .split(#predicate(func(c) = not (c >= 'a' and c <= 'z') and not (c >= '0' and c <= '9')))
      .filter(func(t) = t.size() >= 3 and not stopWords.contains(t))
      .toArray();
  };

  func score(text : Text, queryTerms : [Text]) : Nat {
    let lower = text.toLower();
    queryTerms.foldLeft(0, func(acc, term) = if (lower.contains(#text term)) { acc + 1 } else { acc });
  };

  // The best in-scope passages for the question, best first. Empty when the
  // library holds nothing that shares a term with the question.
  func search(
    files : Map.Map<Principal, FilesLib.UserFiles>,
    passages : Map.Map<Principal, FilesLib.UserPassages>,
    caller : Principal,
    request : Retrieval.RetrievalRequest,
  ) : [Common.CitedPassage] {
    let ownedPassages = switch (passages.get(caller)) {
      case (?owned) owned;
      case null return [];
    };
    let ownedFiles = switch (files.get(caller)) {
      case (?owned) owned;
      case null return [];
    };
    let queryTerms = terms(request.question);
    if (queryTerms.size() == 0) {
      return [];
    };
    let inScope = ownedPassages.passages.values().filter(func(p) {
      switch (request.scope) {
        case (#library) true;
        case (#project(projectId)) {
          switch (ownedFiles.files.get(p.fileId)) {
            case (?file) file.projectId == projectId;
            case null false;
          };
        };
      };
    });
    let scored = List.empty<(Nat, Common.Passage)>();
    for (p in inScope) {
      let s = score(p.text, queryTerms);
      if (s > 0) { scored.add((s, p)) };
    };
    if (scored.size() == 0) {
      return [];
    };
    let ranked = scored.toArray().sort(func(a, b) = Nat.compare(b.0, a.0));
    let top = ranked.sliceToArray(0, maxCited);
    top.map(func(entry) {
      let p = entry.1;
      let filename = switch (ownedFiles.files.get(p.fileId)) {
        case (?file) file.filename;
        case null "";
      };
      { passage = p; filename };
    });
  };

  public func retrieve(
    files : Map.Map<Principal, FilesLib.UserFiles>,
    passages : Map.Map<Principal, FilesLib.UserPassages>,
    caller : Principal,
    request : Retrieval.RetrievalRequest,
  ) : Retrieval.RetrievalResult {
    let cited = search(files, passages, caller, request);
    if (cited.size() == 0) {
      return #notFoundInLibrary;
    };
    #found({ passages = cited });
  };

  // ---- Grounded answer (BYOK) ----

  func systemPrompt() : Text =
    "You are a legal research assistant for a pro se federal habeas corpus "
    # "litigant proceeding under 28 U.S.C. section 2254 in the United States. "
    # "Answer the user's question using ONLY the numbered library passages "
    # "provided. Cite each supporting passage inline as [n] using its number. "
    # "If the passages do not support an answer, say so plainly instead of "
    # "guessing. Do not invent citations, case names, page numbers or facts. "
    # "Your answer is research assistance, not legal advice.";

  func passageBlock(cited : [Common.CitedPassage]) : Text {
    let parts = List.empty<Text>();
    var n = 0;
    for (c in cited.values()) {
      n += 1;
      let chars = c.passage.text.toArray();
      let text = if (chars.size() > maxPassageCharsForPrompt) {
        Text.fromIter(chars.sliceToArray(0, maxPassageCharsForPrompt).values()) # "…";
      } else {
        c.passage.text;
      };
      parts.add(
        "[" # n.toText() # "] " # c.filename # ", page " # c.passage.page.toText()
        # ", paragraph " # c.passage.paragraph.toText() # ":\n" # text
      );
    };
    parts.values().join("\n\n");
  };

  func userPrompt(request : Retrieval.RetrievalRequest, cited : [Common.CitedPassage]) : Text {
    "Library passages:\n\n" # passageBlock(cited)
    # "\n\nQuestion: " # request.question;
  };

  // Asks the caller's own model to answer from the cited passages only. The
  // key is read from the caller's own store and never leaves the canister.
  public func groundedAnswer(
    files : Map.Map<Principal, FilesLib.UserFiles>,
    passages : Map.Map<Principal, FilesLib.UserPassages>,
    keys : Map.Map<Principal, KeysLib.UserKeys>,
    caller : Principal,
    request : Retrieval.RetrievalRequest,
  ) : async Retrieval.GroundedAnswer {
    let cited = search(files, passages, caller, request);
    if (cited.size() == 0) {
      return #notFoundInLibrary;
    };
    let key = switch (KeysLib.providerKey(keys, caller)) {
      case (?key) key;
      case null Runtime.trap("Save your model provider key before asking a grounded question");
    };
    let config : Config.Config = {
      Config.defaultConfig with
      auth = ?#bearer key;
    };
    let messages : [ChatCompletionRequestMessage.ChatCompletionRequestMessage] = [
      #system_(ChatCompletionRequestMessageOneOf.JSON.init({ content = #string (systemPrompt()); role = #system_ })),
      #user(ChatCompletionRequestMessageOneOf2.JSON.init({ content = #string (userPrompt(request, cited)); role = #user })),
    ];
    let chatRequest = ChatCompletionRequest.JSON.init({ messages; model = "auto" });
    let completion = await* ChatApi.createChatCompletion(config, chatRequest);
    let answer = switch (completion.choices.find(func(c) = c.index == 0)) {
      case (?choice) choice.message.content ?? "";
      case null "";
    };
    if (answer.trim(#char ' ').size() == 0) {
      return #notFoundInLibrary;
    };
    #answered({ answer; passages = cited });
  };
};
