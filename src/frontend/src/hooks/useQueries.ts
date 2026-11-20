import {
  type CaseFileInput,
  type DraftContent,
  type DraftInput,
  type ExportOptions,
  type Id,
  type ProjectInput,
  type RetrievalRequest,
  createActor,
} from "@/backend";
import { useActor } from "@caffeineai/core-infrastructure";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

/** Query keys, kept in one place so mutations invalidate exactly what they touch. */
export const queryKeys = {
  projects: ["projects"] as const,
  project: (id: Id) => ["project", id.toString()] as const,
  caseFiles: (projectId: Id) => ["caseFiles", projectId.toString()] as const,
  passages: (fileId: Id) => ["passages", fileId.toString()] as const,
  drafts: (projectId: Id) => ["drafts", projectId.toString()] as const,
  draft: (id: Id) => ["draft", id.toString()] as const,
  modelKey: ["modelKey"] as const,
  attestation: ["attestation"] as const,
};

const READY = { staleTime: 15_000 } as const;

/* ------------------------------------------------------------------ */
/* Projects                                                            */
/* ------------------------------------------------------------------ */

export function useProjects() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: queryKeys.projects,
    queryFn: async () => {
      if (!actor) return [];
      return actor.listProjects();
    },
    enabled: !!actor && !isFetching,
    ...READY,
  });
}

export function useProject(id: Id | null) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: queryKeys.project(id ?? 0n),
    queryFn: async () => {
      if (!actor || id === null) return null;
      const projects = await actor.listProjects();
      return projects.find((project) => project.id === id) ?? null;
    },
    enabled: !!actor && !isFetching && id !== null,
    ...READY,
  });
}

export function useCreateProject() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: ProjectInput) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.createProject(input);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.projects });
    },
  });
}

export function useRenameProject() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id: Id; input: ProjectInput }) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.renameProject(id, input);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.projects });
    },
  });
}

export function useDeleteProject() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: Id) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.deleteProject(id);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.projects });
    },
  });
}

/* ------------------------------------------------------------------ */
/* Case files and passages                                             */
/* ------------------------------------------------------------------ */

export function useCaseFiles(projectId: Id | null) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: queryKeys.caseFiles(projectId ?? 0n),
    queryFn: async () => {
      if (!actor || projectId === null) return [];
      return actor.listCaseFiles(projectId);
    },
    enabled: !!actor && !isFetching && projectId !== null,
    ...READY,
  });
}

export function useRegisterCaseFile() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CaseFileInput) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.registerCaseFile(input);
    },
    onSuccess: (file) => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.caseFiles(file.projectId),
      });
      void queryClient.invalidateQueries({ queryKey: queryKeys.projects });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.project(file.projectId),
      });
    },
  });
}

export function useDeleteCaseFile() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (fileId: Id) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.deleteCaseFile(fileId);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["caseFiles"] });
      void queryClient.invalidateQueries({ queryKey: queryKeys.projects });
    },
  });
}

export function useRetryFileIndexing() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (fileId: Id) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.retryFileIndexing(fileId);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["caseFiles"] });
    },
  });
}

export function useFilePassages(fileId: Id | null) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: queryKeys.passages(fileId ?? 0n),
    queryFn: async () => {
      if (!actor || fileId === null) return null;
      return actor.getFilePassages(fileId, 0n);
    },
    enabled: !!actor && !isFetching && fileId !== null,
    ...READY,
  });
}

/* ------------------------------------------------------------------ */
/* Retrieval                                                           */
/* ------------------------------------------------------------------ */

export function useRetrievePassages() {
  const { actor } = useActor(createActor);
  return useMutation({
    mutationFn: async (request: RetrievalRequest) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.retrievePassages(request);
    },
  });
}

export function useAnswerFromLibrary() {
  const { actor } = useActor(createActor);
  return useMutation({
    mutationFn: async (request: RetrievalRequest) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.answerFromLibrary(request);
    },
  });
}

/* ------------------------------------------------------------------ */
/* Drafts                                                              */
/* ------------------------------------------------------------------ */

export function useDrafts(projectId: Id | null) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: queryKeys.drafts(projectId ?? 0n),
    queryFn: async () => {
      if (!actor || projectId === null) return [];
      return actor.listDrafts(projectId);
    },
    enabled: !!actor && !isFetching && projectId !== null,
    ...READY,
  });
}

export function useDraft(id: Id | null) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: queryKeys.draft(id ?? 0n),
    queryFn: async () => {
      if (!actor || id === null) return null;
      return actor.getDraft(id);
    },
    enabled: !!actor && !isFetching && id !== null,
    ...READY,
  });
}

export function useCreateDraft() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: DraftInput) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.createDraft(input);
    },
    onSuccess: (draft) => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.drafts(draft.projectId),
      });
    },
  });
}

export function useAutosaveDraft() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, content }: { id: Id; content: DraftContent }) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.autosaveDraft(id, content);
    },
    onSuccess: (draft) => {
      queryClient.setQueryData(queryKeys.draft(draft.id), draft);
      void queryClient.invalidateQueries({
        queryKey: queryKeys.drafts(draft.projectId),
      });
    },
  });
}

export function useRestoreDraftVersion() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, version }: { id: Id; version: bigint }) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.restoreDraftVersion(id, version);
    },
    onSuccess: (draft) => {
      queryClient.setQueryData(queryKeys.draft(draft.id), draft);
    },
  });
}

export function useDeleteDraft() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: Id) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.deleteDraft(id);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["drafts"] });
    },
  });
}

/* ------------------------------------------------------------------ */
/* Citation checks and export                                          */
/* ------------------------------------------------------------------ */

export function useCheckDraftCitations() {
  const { actor } = useActor(createActor);
  return useMutation({
    mutationFn: async (draftId: Id) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.checkDraftCitations(draftId);
    },
  });
}

export function useCheckDraftGrounding() {
  const { actor } = useActor(createActor);
  return useMutation({
    mutationFn: async (draftId: Id) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.checkDraftGrounding(draftId);
    },
  });
}

export function useExportDraftDocx() {
  const { actor } = useActor(createActor);
  return useMutation({
    mutationFn: async ({
      draftId,
      options,
    }: {
      draftId: Id;
      options: ExportOptions;
    }) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.exportDraftDocx(draftId, options);
    },
  });
}

/* ------------------------------------------------------------------ */
/* Model key and attestation                                           */
/* ------------------------------------------------------------------ */

export function useModelKeyStatus() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: queryKeys.modelKey,
    queryFn: async () => {
      if (!actor) return { configured: false } as const;
      return actor.getModelKeyStatus();
    },
    enabled: !!actor && !isFetching,
    ...READY,
  });
}

export function useSaveModelKey() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (key: string) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.saveModelKey(key);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.modelKey });
    },
  });
}

export function useRemoveModelKey() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.removeModelKey();
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.modelKey });
    },
  });
}

export function useAttestation() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: queryKeys.attestation,
    queryFn: async () => {
      if (!actor) return null;
      return actor.getAttestation();
    },
    enabled: !!actor && !isFetching,
    staleTime: Number.POSITIVE_INFINITY,
  });
}

export function useConfirmAttestation() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.confirmAttestation();
    },
    onSuccess: (attestation) => {
      queryClient.setQueryData(queryKeys.attestation, attestation);
    },
  });
}
