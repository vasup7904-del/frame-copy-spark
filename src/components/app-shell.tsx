import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutGrid,
  FilePenLine,
  LayoutTemplate,
  Gauge,
  Target,
  Mail,
  KanbanSquare,
  Mic,
  Linkedin,
  UserRound,
  FolderOpen,
  Settings as SettingsIcon,
} from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useAppData } from "@/lib/store";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutGrid },
  { to: "/builder", label: "Resume Builder", icon: FilePenLine },
  { to: "/templates", label: "Templates", icon: LayoutTemplate },
  { to: "/analyzer", label: "Analyzer / ATS", icon: Gauge },
  { to: "/tailoring", label: "Job Tailoring", icon: Target },
  { to: "/cover-letters", label: "Cover Letters", icon: Mail },
  { to: "/tracker", label: "Job Tracker", icon: KanbanSquare },
  { to: "/interview", label: "Interview Prep", icon: Mic },
  { to: "/linkedin", label: "LinkedIn Coach", icon: Linkedin },
  { to: "/profile", label: "Career Profile", icon: UserRound },
  { to: "/library", label: "Library", icon: FolderOpen },
  { to: "/settings", label: "Settings", icon: SettingsIcon },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const data = useAppData();
  const name = data.settings.displayName || data.profile.fullName || "Your workspace";
  const initials =
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase())
      .join("") || "RF";

  return (
    <div className="app-canvas relative min-h-screen w-full overflow-hidden text-foreground">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-20 -top-24 size-[420px] rounded-full bg-primary/30 blur-[70px]" />
        <div className="absolute -right-32 top-40 size-[380px] rounded-full bg-teal/25 blur-[70px]" />
        <div className="absolute -bottom-28 left-1/3 size-[300px] rounded-full bg-chart-5/20 blur-[70px]" />
      </div>

      <div className="relative z-10 flex h-screen">
        <aside className="glass no-print m-3 mr-0 flex w-60 shrink-0 flex-col rounded-3xl p-4">
          <Link to="/" className="flex items-center gap-2.5 px-2 py-2">
            <div className="gradient-brand font-display grid size-9 place-items-center rounded-xl text-lg font-bold text-primary-foreground">
              R
            </div>
            <div>
              <p className="font-display text-[15px] font-bold leading-none">ResumeForge</p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">Career workspace</p>
            </div>
          </Link>

          <nav className="mt-5 flex-1 space-y-1 overflow-y-auto pr-1">
            <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
              Workspace
            </p>
            {NAV.map(({ to, label, icon: Icon }) => {
              const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
              return (
                <Link
                  key={to}
                  to={to}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors",
                    active
                      ? "bg-card/70 font-semibold text-primary shadow-sm"
                      : "text-muted-foreground hover:bg-card/40 hover:text-foreground",
                  )}
                >
                  <Icon className="size-4 shrink-0" />
                  {label}
                </Link>
              );
            })}
          </nav>

          <div className="glass-soft mt-3 rounded-2xl p-3">
            <div className="flex items-center gap-2.5">
              <div className="grid size-9 shrink-0 place-items-center rounded-full bg-secondary text-xs font-semibold text-secondary-foreground">
                {initials}
              </div>
              <div className="min-w-0">
                <p className="truncate text-[13px] font-semibold leading-none">{name}</p>
                <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                  {data.profile.headline || "Personal account"}
                </p>
              </div>
            </div>
          </div>
        </aside>

        <main className="min-w-0 flex-1 p-3">
          <div className="glass print-root h-full overflow-y-auto rounded-3xl p-5">{children}</div>
        </main>
      </div>
    </div>
  );
}
