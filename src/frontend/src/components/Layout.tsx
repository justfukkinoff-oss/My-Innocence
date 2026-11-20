import { Button } from "@/components/ui/button";
import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import { Link } from "@tanstack/react-router";
import {
  BookOpenCheck,
  FileSearch,
  FolderOpen,
  LogOut,
  Menu,
  MessagesSquare,
  PenLine,
  Scale,
  Settings,
  ShieldCheck,
  X,
} from "lucide-react";
import { type ReactNode, useEffect, useState } from "react";

interface NavItem {
  to: string;
  label: string;
  icon: typeof FolderOpen;
  ocid: string;
}

const NAV_ITEMS: NavItem[] = [
  {
    to: "/projects",
    label: "Projects",
    icon: FolderOpen,
    ocid: "nav.projects",
  },
  {
    to: "/research",
    label: "Research",
    icon: FileSearch,
    ocid: "nav.research",
  },
  { to: "/drafts", label: "Drafts", icon: PenLine, ocid: "nav.drafts" },
  {
    to: "/citation-check",
    label: "Citation Check",
    icon: BookOpenCheck,
    ocid: "nav.citation_check",
  },
  {
    to: "/assistant",
    label: "Assistant",
    icon: MessagesSquare,
    ocid: "nav.assistant",
  },
  { to: "/settings", label: "Settings", icon: Settings, ocid: "nav.settings" },
];

const DISCLAIMER =
  "Docket is a document workspace, not a law firm. Nothing here is legal advice, and no attorney-client relationship is created.";

function Wordmark() {
  return (
    <Link
      to="/projects"
      data-ocid="nav.wordmark_link"
      className="group flex items-center gap-2.5 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
    >
      <span className="flex size-8 items-center justify-center rounded-md border border-primary/25 bg-primary/10 text-primary">
        <Scale aria-hidden="true" className="size-4" />
      </span>
      <span className="flex flex-col leading-none">
        <span className="font-display text-xl font-semibold tracking-tight text-foreground">
          Docket
        </span>
        <span className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          §2254 workspace
        </span>
      </span>
    </Link>
  );
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav aria-label="Workspace" className="flex flex-col gap-0.5">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        return (
          <Link
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            data-ocid={item.ocid}
            activeProps={{
              className:
                "bg-sidebar-accent text-foreground font-semibold before:opacity-100",
            }}
            inactiveProps={{ className: "text-sidebar-foreground/80" }}
            className="relative flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-smooth before:absolute before:inset-y-1.5 before:left-0 before:w-0.5 before:rounded-full before:bg-primary before:opacity-0 hover:bg-sidebar-accent/70 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
          >
            <Icon aria-hidden="true" className="size-4 shrink-0" />
            <span className="truncate">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function DisclaimerStrip({ className }: { className?: string }) {
  return (
    <p
      data-ocid="disclaimer.strip"
      className={`flex items-start gap-2 text-xs leading-relaxed text-muted-foreground ${className ?? ""}`}
    >
      <ShieldCheck
        aria-hidden="true"
        className="mt-0.5 size-3.5 shrink-0 text-accent"
      />
      <span>{DISCLAIMER}</span>
    </p>
  );
}

interface LayoutProps {
  children: ReactNode;
  /** Optional right-hand panel for the three-column workbench. */
  aside?: ReactNode;
}

/** The persistent workspace shell: header, sidebar, content, footer. */
export function Layout({ children, aside }: LayoutProps) {
  const { clear } = useInternetIdentity();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!mobileOpen) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setMobileOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [mobileOpen]);

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-card">
        <div className="flex h-14 items-center gap-3 px-4 sm:px-6">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label="Open navigation"
            data-ocid="nav.menu_button"
            className="flex size-9 items-center justify-center rounded-md text-muted-foreground transition-smooth hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:hidden"
          >
            <Menu aria-hidden="true" className="size-5" />
          </button>
          <Wordmark />
          <div className="ml-auto flex items-center gap-2">
            <Link
              to="/attestation"
              data-ocid="nav.attestation_link"
              className="hidden items-center gap-1.5 rounded-full border border-border bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground transition-smooth hover:border-input hover:text-foreground sm:inline-flex"
            >
              <ShieldCheck aria-hidden="true" className="size-3.5" />
              U.S. · pro se
            </Link>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => clear()}
              data-ocid="nav.sign_out_button"
              aria-label="Sign out"
            >
              <LogOut aria-hidden="true" className="size-4" />
              <span className="hidden sm:inline">Sign out</span>
            </Button>
          </div>
        </div>
        <div className="border-t border-border/70 bg-muted/40 px-4 py-1.5 sm:px-6">
          <DisclaimerStrip />
        </div>
      </header>

      <div className="flex flex-1">
        <aside className="hidden w-60 shrink-0 border-r border-border bg-sidebar lg:block">
          <div className="sticky top-[6.25rem] flex max-h-[calc(100dvh-6.25rem)] flex-col gap-6 overflow-y-auto scrollbar-thin p-3">
            <NavLinks />
            <div className="mt-auto rounded-md border border-sidebar-border bg-card/60 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Reading mode
              </p>
              <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                Long-form columns cap at 68 characters for comfortable statute
                and record reading.
              </p>
            </div>
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          <div className="mx-auto w-full max-w-[92rem] px-4 py-6 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-6 xl:flex-row">
              <div className="min-w-0 flex-1">{children}</div>
              {aside && <div className="w-full shrink-0 xl:w-80">{aside}</div>}
            </div>
          </div>
        </main>
      </div>

      <footer className="border-t border-border bg-muted/40">
        <div className="mx-auto flex w-full max-w-[92rem] flex-col gap-2 px-4 py-4 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <DisclaimerStrip />
          <p className="shrink-0">
            © {new Date().getFullYear()}. Built with love using{" "}
            <a
              href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
              target="_blank"
              rel="noreferrer"
              className="underline underline-offset-2 transition-smooth hover:text-foreground"
            >
              caffeine.ai
            </a>
          </p>
        </div>
      </footer>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close navigation"
            onClick={() => setMobileOpen(false)}
            className="absolute inset-0 bg-foreground/30 backdrop-blur-[1px] animate-fade-in"
          />
          <dialog
            open
            aria-modal="true"
            aria-label="Workspace navigation"
            data-ocid="nav.mobile_sheet"
            className="relative z-10 m-0 flex h-full w-72 max-w-[85vw] flex-col border-r border-border bg-sidebar p-4 shadow-elevated animate-slide-in-right"
          >
            <div className="mb-6 flex items-center justify-between">
              <Wordmark />
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                aria-label="Close navigation"
                data-ocid="nav.close_button"
                className="flex size-9 items-center justify-center rounded-md text-muted-foreground transition-smooth hover:bg-sidebar-accent hover:text-foreground"
              >
                <X aria-hidden="true" className="size-5" />
              </button>
            </div>
            <NavLinks onNavigate={() => setMobileOpen(false)} />
            <div className="mt-auto pt-6">
              <DisclaimerStrip />
            </div>
          </dialog>
        </div>
      )}
    </div>
  );
}
