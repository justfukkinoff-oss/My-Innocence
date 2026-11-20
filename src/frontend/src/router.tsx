import {
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import App from "./App";
import AssistantPage from "./pages/AssistantPage";
import AttestationPage from "./pages/AttestationPage";
import CitationCheckPage from "./pages/CitationCheckPage";
import DraftEditorPage from "./pages/DraftEditorPage";
import DraftsPage from "./pages/DraftsPage";
import NotEligiblePage from "./pages/NotEligiblePage";
import NotFoundPage from "./pages/NotFoundPage";
import ProjectDetailPage from "./pages/ProjectDetailPage";
import ProjectsPage from "./pages/ProjectsPage";
import ResearchPage from "./pages/ResearchPage";
import SettingsPage from "./pages/SettingsPage";

const rootRoute = createRootRoute({
  component: App,
  notFoundComponent: NotFoundPage,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: ProjectsPage,
});

const projectsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/projects",
  component: ProjectsPage,
});

const projectDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/projects/$projectId",
  component: ProjectDetailPage,
});

const researchRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/research",
  component: ResearchPage,
});

const draftsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/drafts",
  component: DraftsPage,
});

const draftEditorRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/drafts/$draftId",
  component: DraftEditorPage,
});

const citationCheckRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/citation-check",
  component: CitationCheckPage,
});

const assistantRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/assistant",
  component: AssistantPage,
});

const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/settings",
  component: SettingsPage,
});

const attestationRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/attestation",
  component: AttestationPage,
});

const notEligibleRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/not-eligible",
  component: NotEligiblePage,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  projectsRoute,
  projectDetailRoute,
  researchRoute,
  draftsRoute,
  draftEditorRoute,
  citationCheckRoute,
  assistantRoute,
  settingsRoute,
  attestationRoute,
  notEligibleRoute,
]);

export const router = createRouter({
  routeTree,
  defaultPreload: "intent",
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
