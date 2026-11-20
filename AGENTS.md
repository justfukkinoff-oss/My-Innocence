# Project Guidance

## User Preferences

- U.S.-only audience
- Pro se litigants focused on 28 U.S.C. §2254 federal habeas corpus
- Bring your own model key: the user supplies their own provider key
- Serious document-first legal workspace with long-form reading comfort and a restrained professional palette

## Accepted Requirements

- U.S.-only pro se §2254 habeas corpus focus
- Project library for case file uploads with automatic indexing and legal-grade retrieval
- DOCX export of drafts
- Legal document drafting
- Citation verification and grounding
- BYOK model key supplied by the user

## Verified Commands

- **typecheck**: `pnpm typecheck`
- **fix**: `pnpm fix`
- **build**: `pnpm build`

## Learnings

- The project began as the Caffeine chat template: src/backend/main.mo with lib/inference.mo and lib/history.mo, and a single src/frontend/src/components/ChatView.tsx chat surface with no router.
- Backend verified commands: mops build, mops check --fix, pnpm bindgen. Frontend verified commands: pnpm typecheck, pnpm check, pnpm fix, pnpm build.
- The backend is a single src/backend/main.mo composition root that includes per-feature mixins from src/backend/mixins and per-domain logic from src/backend/lib; shared storage types live in src/backend/types to avoid lib-to-lib import cycles.
- Motoko module bodies reject non-static top-level lets; wrap constant Text or array builders in funcs and call them at the use site.
- caffeineai-object-storage must be added with mops add before importing mo:caffeineai-object-storage/Mixin; uploads use ExternalBlob.fromBytes(bytes, mime, name).withUploadProgress(cb).
- OQL per-user Map<Principal, Map<Id, R>> entities use OQL.Entity.newScoped with a flat owner+id row record and .ownedBy("owner").scopedPerUser().
- ChatApi does not re-export Config/defaultConfig; import mo:caffeineai-inference-client/Config directly for a BYOK bearer config.
- The frontend uses TanStack Router with routes in src/frontend/src/router.tsx and the shell in src/frontend/src/components/Layout.tsx; shared hooks live in src/frontend/src/hooks/useQueries.ts.
- The template Button has no asChild; use the ButtonLink wrapper over TanStack Link for router-styled buttons.
- Shared ui/input.tsx Input and Textarea are plain function components without forwardRef, so use a native element when a cursor ref is needed.
- Biome requires htmlFor on Label wrappers, native <dialog>/<output> instead of role attributes, and motion-safe guards or a global prefers-reduced-motion rule for animations.
- GATE_EXEMPT paths in App.tsx must also be excluded from the confirmed-user redirect or the decline screen bounces back.
