import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
import type { ExternalBlob } from "@caffeineai/object-storage";
export type { ExternalBlob } from "@caffeineai/object-storage";
export interface Attestation {
    confirmedAt?: Timestamp;
    confirmed: boolean;
}
export interface CaseFile {
    id: Id;
    blob: ExternalBlob;
    mimeType: string;
    extractedText?: string;
    filename: string;
    version: bigint;
    indexingStatus: IndexingStatus;
    projectId: Id;
    sizeBytes: bigint;
    pageCount: bigint;
    uploadedAt: Timestamp;
}
export interface CaseFileInput {
    blob: ExternalBlob;
    mimeType: string;
    extractedText?: string;
    filename: string;
    projectId: Id;
    sizeBytes: bigint;
    pageCount: bigint;
}
export interface Cell {
    value: Value;
    name: string;
}
export interface CitationCheck {
    status: CitationStatus;
    rawText: string;
    location: CitationLocation;
}
export interface CitationCheckResult {
    citations: Array<CitationCheck>;
}
export interface CitationLocation {
    offset: bigint;
    sectionId: Id;
}
export type CitationStatus = {
    __kind__: "malformed";
    malformed: null;
} | {
    __kind__: "unverified";
    unverified: null;
} | {
    __kind__: "verifiedInLibrary";
    verifiedInLibrary: CitedPassage;
};
export interface CitedPassage {
    filename: string;
    passage: Passage;
}
export interface ConversationSummary {
    id: bigint;
    title: string;
    updatedAtNs: bigint;
    messageCount: bigint;
}
export interface Credentials {
    expiresAt: string;
    baseUrl: string;
    apiKey: string;
}
export interface Draft {
    id: Id;
    title: string;
    createdAt: Timestamp;
    draftType: DraftType;
    projectId: Id;
    sections: Array<DraftSection>;
    autosavedAt: Timestamp;
    versions: Array<DraftVersion>;
}
export interface DraftContent {
    title: string;
    sections: Array<DraftSection>;
}
export interface DraftInput {
    title: string;
    draftType: DraftType;
    projectId: Id;
}
export interface DraftSection {
    id: Id;
    body: string;
    heading: string;
}
export interface DraftVersion {
    version: bigint;
    savedAt: Timestamp;
    sections: Array<DraftSection>;
}
export type Error_ = {
    __kind__: "FrontendOriginsNotConfigured";
    FrontendOriginsNotConfigured: null;
} | {
    __kind__: "MixedSsoSources";
    MixedSsoSources: {
        otherKeys: Array<string>;
        ssoKeys: Array<string>;
    };
} | {
    __kind__: "Stale";
    Stale: {
        ageNs: bigint;
    };
} | {
    __kind__: "MalformedCandid";
    MalformedCandid: null;
} | {
    __kind__: "AmbiguousAttribute";
    AmbiguousAttribute: {
        field: string;
        sources: Array<string>;
    };
} | {
    __kind__: "NoAttributes";
    NoAttributes: null;
} | {
    __kind__: "UnknownNonce";
    UnknownNonce: null;
} | {
    __kind__: "UntrustedSsoSource";
    UntrustedSsoSource: {
        domain: string;
    };
} | {
    __kind__: "MissingField";
    MissingField: string;
} | {
    __kind__: "FrontendOriginMismatch";
    FrontendOriginMismatch: {
        got: string;
        expected: Array<string>;
    };
};
export interface ExportOptions {
    caption: string;
    disclaimer: string;
}
export interface ExportedDocument {
    filename: string;
    bytes: Uint8Array;
}
export type GroundedAnswer = {
    __kind__: "answered";
    answered: {
        passages: Array<CitedPassage>;
        answer: string;
    };
} | {
    __kind__: "notFoundInLibrary";
    notFoundInLibrary: null;
};
export interface GroundingResult {
    ungrounded: Array<UngroundedSentence>;
}
export type Id = bigint;
export type IndexingStatus = {
    __kind__: "pending";
    pending: null;
} | {
    __kind__: "indexing";
    indexing: null;
} | {
    __kind__: "indexed";
    indexed: null;
} | {
    __kind__: "failed";
    failed: {
        reason: string;
    };
};
export interface KeyStatus {
    last4?: string;
    configured: boolean;
}
export type KeyValidation = {
    __kind__: "valid";
    valid: null;
} | {
    __kind__: "invalid";
    invalid: {
        reason: string;
    };
};
export interface MessagePage {
    total: bigint;
    messages: Array<StoredMessage>;
    summary?: Summary;
}
export type PageNumber = bigint;
export type ParagraphNumber = bigint;
export interface Passage {
    id: Id;
    page: PageNumber;
    text: string;
    fileId: Id;
    paragraph: ParagraphNumber;
}
export interface PassagePage {
    total: bigint;
    passages: Array<Passage>;
}
export interface Project {
    id: Id;
    name: string;
    createdAt: Timestamp;
    fileCount: bigint;
    indexingStatus: IndexingStatus;
    caption: string;
    lastActivityAt: Timestamp;
}
export interface ProjectInput {
    name: string;
    caption: string;
}
export interface Result {
    hasMore: boolean;
    rows: Array<Array<Cell>>;
}
export type Result__1 = {
    __kind__: "ok";
    ok: null;
} | {
    __kind__: "err";
    err: Error_;
};
export interface RetrievalRequest {
    question: string;
    scope: RetrievalScope;
}
export type RetrievalResult = {
    __kind__: "found";
    found: {
        passages: Array<CitedPassage>;
    };
} | {
    __kind__: "notFoundInLibrary";
    notFoundInLibrary: null;
};
export type RetrievalScope = {
    __kind__: "library";
    library: null;
} | {
    __kind__: "project";
    project: Id;
};
export interface StoredMessage {
    content: string;
    role: Variant_user_assistant;
    createdAtNs: bigint;
}
export interface Summary {
    content: string;
    createdAtNs: bigint;
    coversCount: bigint;
}
export type Timestamp = bigint;
export interface UngroundedSentence {
    sentence: string;
    sectionId: Id;
}
export type Value = {
    __kind__: "int";
    int: bigint;
} | {
    __kind__: "nat";
    nat: bigint;
} | {
    __kind__: "float";
    float: number;
} | {
    __kind__: "bool";
    bool: boolean;
} | {
    __kind__: "null";
    null: null;
} | {
    __kind__: "text";
    text: string;
};
export enum DraftType {
    memorandum = "memorandum",
    noticeOfExhaustion = "noticeOfExhaustion",
    petition = "petition",
    motion = "motion",
    reply = "reply"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export enum Variant_user_assistant {
    user = "user",
    assistant = "assistant"
}
export interface backendInterface {
    answerFromLibrary(request: RetrievalRequest): Promise<GroundedAnswer>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    autosaveDraft(id: Id, content: DraftContent): Promise<Draft>;
    checkDraftCitations(draftId: Id): Promise<CitationCheckResult>;
    checkDraftGrounding(draftId: Id): Promise<GroundingResult>;
    confirmAttestation(): Promise<Attestation>;
    createDraft(input: DraftInput): Promise<Draft>;
    createProject(input: ProjectInput): Promise<Project>;
    deleteCaseFile(fileId: Id): Promise<void>;
    deleteConversation(id: bigint): Promise<void>;
    deleteDraft(id: Id): Promise<void>;
    deleteProject(id: Id): Promise<void>;
    execute(qJson: string): Promise<Result>;
    exportDraftDocx(draftId: Id, options: ExportOptions): Promise<ExportedDocument>;
    getApiDoc(): Promise<string>;
    getAttestation(): Promise<Attestation>;
    getCallerUserRole(): Promise<UserRole>;
    getConversationPage(id: bigint, start: bigint): Promise<MessagePage>;
    getDraft(id: Id): Promise<Draft>;
    getFilePassages(fileId: Id, start: bigint): Promise<PassagePage>;
    getInferenceCredentials(): Promise<Credentials>;
    getModelKeyStatus(): Promise<KeyStatus>;
    isCallerAdmin(): Promise<boolean>;
    isInferenceConfigured(): Promise<boolean>;
    listCaseFiles(projectId: Id): Promise<Array<CaseFile>>;
    listConversations(): Promise<Array<ConversationSummary>>;
    listDrafts(projectId: Id): Promise<Array<Draft>>;
    listProjects(): Promise<Array<Project>>;
    probeEphemeralMint(): Promise<{
        expiresAt: string;
        last4: string;
    }>;
    recordExchange(conversationId: bigint | null, userContent: string, assistantContent: string): Promise<bigint>;
    registerCaseFile(input: CaseFileInput): Promise<CaseFile>;
    removeModelKey(): Promise<void>;
    renameProject(id: Id, input: ProjectInput): Promise<Project>;
    restoreDraftVersion(id: Id, version: bigint): Promise<Draft>;
    retrievePassages(request: RetrievalRequest): Promise<RetrievalResult>;
    retryFileIndexing(fileId: Id): Promise<CaseFile>;
    saveModelKey(key: string): Promise<KeyValidation>;
    schema(): Promise<string>;
    setConversationSummary(id: bigint, coversCount: bigint, content: string): Promise<void>;
}
