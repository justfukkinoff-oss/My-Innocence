import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { LoadingState } from "@/components/ui/states";
import { useAttestation } from "@/hooks/useQueries";
import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import { Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";

const GATE_EXEMPT = new Set(["/attestation", "/not-eligible"]);

/** Signed-in shell: attestation gate, then the routed workspace. */
function Workspace() {
  const attestation = useAttestation();
  const navigate = useNavigate();
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });
  const exempt = GATE_EXEMPT.has(pathname);
  const declined = pathname === "/not-eligible";

  const confirmed = attestation.data?.confirmed === true;

  useEffect(() => {
    if (attestation.data === undefined || attestation.data === null) return;
    if (!confirmed && !exempt) {
      void navigate({ to: "/attestation", replace: true });
    }
    if (confirmed && (pathname === "/attestation" || declined)) {
      void navigate({ to: "/projects", replace: true });
    }
  }, [attestation.data, confirmed, exempt, declined, pathname, navigate]);

  if (attestation.isPending) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background">
        <LoadingState label="Opening your workspace…" />
      </div>
    );
  }

  if (attestation.isError) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-background px-6 text-center">
        <p className="font-display text-xl font-semibold text-foreground">
          Could not open your workspace
        </p>
        <p className="max-w-sm text-sm text-muted-foreground">
          The workspace could not confirm your eligibility status. Retry to
          continue.
        </p>
        <Button
          variant="primary"
          onClick={() => void attestation.refetch()}
          data-ocid="workspace.retry_button"
        >
          Retry
        </Button>
      </div>
    );
  }

  if (!confirmed && !exempt) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background">
        <LoadingState label="Checking eligibility…" />
      </div>
    );
  }

  return (
    <Layout>
      <Outlet />
    </Layout>
  );
}

export default function App() {
  const { isAuthenticated, isInitializing } = useInternetIdentity();

  if (isInitializing) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background">
        <LoadingState label="Loading Docket…" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-background px-6 text-center">
        <div className="max-w-md">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Docket · §2254 workspace
          </p>
          <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight text-foreground">
            Your case file, read closely.
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Sign in with Internet Identity to open your private workspace for
            case files, grounded research, and drafting.
          </p>
        </div>
        <SignInPrompt />
      </div>
    );
  }

  return <Workspace />;
}

function SignInPrompt() {
  const { login, isLoggingIn, isLoginError } = useInternetIdentity();
  return (
    <div className="flex flex-col items-center gap-2">
      <Button
        variant="primary"
        size="lg"
        onClick={() => login()}
        disabled={isLoggingIn}
        data-ocid="auth.sign_in_button"
      >
        {isLoggingIn
          ? "Opening Internet Identity…"
          : "Sign in with Internet Identity"}
      </Button>
      {isLoginError && (
        <p role="alert" className="text-xs text-destructive">
          Sign-in did not complete. Try again.
        </p>
      )}
    </div>
  );
}
