import type {
  Attestation,
  CaseFile,
  CitationCheckResult,
  ConversationSummary,
  Credentials,
  Draft,
  DraftType,
  GroundedAnswer,
  GroundingResult,
  KeyStatus,
  KeyValidation,
  MessagePage,
  PassagePage,
  Project,
  RetrievalResult,
  UserRole,
  backendInterface,
} from "../backend";

const NOW = BigInt(Date.now()) * 1_000_000n;
const DAY = 86_400n * 1_000_000_000n;

const PROJECT_ID = 1n;
const FILE_ID = 10n;
const DRAFT_ID = 100n;

const project: Project = {
  id: PROJECT_ID,
  name: "Smith v. Warden",
  caption: "In re: John Smith, No. 24-cv-01234 (E.D. Cal.)",
  createdAt: NOW - 12n * DAY,
  lastActivityAt: NOW - 2n * DAY,
  fileCount: 2n,
  indexingStatus: { __kind__: "indexed", indexed: null },
};

const caseFiles: CaseFile[] = [
  {
    id: FILE_ID,
    projectId: PROJECT_ID,
    filename: "petition-for-writ.pdf",
    mimeType: "application/pdf",
    sizeBytes: 482_113n,
    pageCount: 24n,
    version: 1n,
    uploadedAt: NOW - 10n * DAY,
    indexingStatus: { __kind__: "indexed", indexed: null },
    blob: { hash: "mock-hash-1", size: 482_113n } as unknown as CaseFile["blob"],
    extractedText:
      "Petitioner John Smith was convicted in the Superior Court of California. The state appellate court affirmed, and the California Supreme Court denied review.",
  },
  {
    id: FILE_ID + 1n,
    projectId: PROJECT_ID,
    filename: "state-court-opinion.pdf",
    mimeType: "application/pdf",
    sizeBytes: 311_204n,
    pageCount: 18n,
    version: 2n,
    uploadedAt: NOW - 9n * DAY,
    indexingStatus: { __kind__: "indexing", indexing: null },
    blob: { hash: "mock-hash-2", size: 311_204n } as unknown as CaseFile["blob"],
  },
];

const draftType: DraftType = "petition" as DraftType;

const draft: Draft = {
  id: DRAFT_ID,
  projectId: PROJECT_ID,
  title: "Petition for Writ of Habeas Corpus",
  draftType,
  createdAt: NOW - 6n * DAY,
  autosavedAt: NOW - 3n * 3_600n * 1_000_000_000n,
  sections: [
    {
      id: 1n,
      heading: "Introduction",
      body: "Petitioner John Smith, proceeding pro se, seeks a writ of habeas corpus under 28 U.S.C. §2254. He is in custody pursuant to a state court judgment that rests on an unreasonable determination of the facts.",
    },
    {
      id: 2n,
      heading: "Statement of the Case",
      body: "The state appellate court affirmed the conviction in a reasoned opinion. The California Supreme Court denied review without comment.",
    },
    {
      id: 3n,
      heading: "Ground One — Ineffective Assistance of Counsel",
      body: "Trial counsel failed to investigate the alibi witness identified in the police report. See Strickland v. Washington, 466 U.S. 668, 687 (1984).",
    },
  ],
  versions: [
    {
      version: 1n,
      savedAt: NOW - 5n * DAY,
      sections: [{ id: 1n, heading: "Introduction", body: "Draft opening." }],
    },
  ],
};

const passage = {
  id: 500n,
  fileId: FILE_ID,
  page: 14n,
  paragraph: 3n,
  text: "The state appellate court held that the exhaustion requirement was satisfied because the claim was presented to the California Supreme Court in the petition for review.",
};

const citedPassage = {
  filename: "petition-for-writ.pdf",
  passage,
};

const attestation: Attestation = { confirmed: true, confirmedAt: NOW - 12n * DAY };

const keyStatus: KeyStatus = { configured: true, last4: "7Q2F" };

const credentials: Credentials = {
  baseUrl: "https://inference.caffeine.ai",
  apiKey: "mock-key",
  expiresAt: new Date(Date.now() + 3 * 3_600_000).toISOString(),
};

const conversations: ConversationSummary[] = [
  {
    id: 1n,
    title: "Exhaustion of state remedies",
    updatedAtNs: NOW - 1n * DAY,
    messageCount: 4n,
  },
];

const messagePage: MessagePage = {
  total: 2n,
  messages: [
    {
      role: "user" as MessagePage["messages"][number]["role"],
      content: "What did the state court hold about exhaustion?",
      createdAtNs: NOW - 1n * DAY,
    },
    {
      role: "assistant" as MessagePage["messages"][number]["role"],
      content:
        "The state appellate court held that the exhaustion requirement was satisfied because the claim was presented to the California Supreme Court in the petition for review.",
      createdAtNs: NOW - 1n * DAY,
    },
  ],
};

const passagePage: PassagePage = { total: 1n, passages: [passage] };

const citationResult: CitationCheckResult = {
  citations: [
    {
      rawText: "Strickland v. Washington, 466 U.S. 668, 687 (1984)",
      status: { __kind__: "verifiedInLibrary", verifiedInLibrary: citedPassage },
      location: { sectionId: 3n, offset: 120n },
    },
    {
      rawText: "28 U.S.C. §2254(d)(1)",
      status: { __kind__: "unverified", unverified: null },
      location: { sectionId: 1n, offset: 40n },
    },
  ],
};

const groundingResult: GroundingResult = {
  ungrounded: [
    {
      sectionId: 2n,
      sentence:
        "The California Supreme Court denied review without comment.",
    },
  ],
};

const groundedAnswer: GroundedAnswer = {
  __kind__: "answered",
  answered: {
    answer:
      "The state appellate court held that the exhaustion requirement was satisfied because the claim was presented to the California Supreme Court in the petition for review.",
    passages: [citedPassage],
  },
};

const retrievalResult: RetrievalResult = {
  __kind__: "found",
  found: { passages: [citedPassage] },
};

export const mockBackend = {
  getAttestation: async () => attestation,
  confirmAttestation: async () => attestation,
  getCallerUserRole: async () => "admin" as UserRole,
  isCallerAdmin: async () => true,
  assignCallerUserRole: async () => undefined,
  isInferenceConfigured: async () => true,
  getInferenceCredentials: async () => credentials,
  probeEphemeralMint: async () => ({
    last4: "7Q2F",
    expiresAt: credentials.expiresAt,
  }),
  getModelKeyStatus: async () => keyStatus,
  saveModelKey: async () => ({ __kind__: "valid", valid: null }) as KeyValidation,
  removeModelKey: async () => undefined,
  listProjects: async () => [project],
  createProject: async () => project,
  renameProject: async () => project,
  deleteProject: async () => undefined,
  listCaseFiles: async () => caseFiles,
  registerCaseFile: async () => caseFiles[0],
  deleteCaseFile: async () => undefined,
  retryFileIndexing: async () => caseFiles[1],
  getFilePassages: async () => passagePage,
  listDrafts: async () => [draft],
  getDraft: async () => draft,
  createDraft: async () => draft,
  autosaveDraft: async () => draft,
  restoreDraftVersion: async () => draft,
  deleteDraft: async () => undefined,
  checkDraftCitations: async () => citationResult,
  checkDraftGrounding: async () => groundingResult,
  exportDraftDocx: async () => ({
    filename: "petition.docx",
    bytes: new Uint8Array([80, 75, 3, 4]),
  }),
  answerFromLibrary: async () => groundedAnswer,
  retrievePassages: async () => retrievalResult,
  listConversations: async () => conversations,
  getConversationPage: async () => messagePage,
  recordExchange: async () => 1n,
  setConversationSummary: async () => undefined,
  deleteConversation: async () => undefined,
  getApiDoc: async () => "# Docket API",
  schema: async () => "{}",
  execute: async () => ({ hasMore: false, rows: [] }),
} satisfies Pick<
  backendInterface,
  | "getAttestation"
  | "confirmAttestation"
  | "getCallerUserRole"
  | "isCallerAdmin"
  | "assignCallerUserRole"
  | "isInferenceConfigured"
  | "getInferenceCredentials"
  | "probeEphemeralMint"
  | "getModelKeyStatus"
  | "saveModelKey"
  | "removeModelKey"
  | "listProjects"
  | "createProject"
  | "renameProject"
  | "deleteProject"
  | "listCaseFiles"
  | "registerCaseFile"
  | "deleteCaseFile"
  | "retryFileIndexing"
  | "getFilePassages"
  | "listDrafts"
  | "getDraft"
  | "createDraft"
  | "autosaveDraft"
  | "restoreDraftVersion"
  | "deleteDraft"
  | "checkDraftCitations"
  | "checkDraftGrounding"
  | "exportDraftDocx"
  | "answerFromLibrary"
  | "retrievePassages"
  | "listConversations"
  | "getConversationPage"
  | "recordExchange"
  | "setConversationSummary"
  | "deleteConversation"
  | "getApiDoc"
  | "schema"
  | "execute"
>;
