import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  FilePenLine,
  Gauge,
  Target,
  Mail,
  Plus,
  Mic,
  FileText,
  Briefcase,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassCard, PageHeader, StatTile, EmptyState } from "@/components/glass";
import { useAppData, setData } from "@/lib/store";
import { blankResume } from "@/lib/defaults";
import type { ApplicationStatus } from "@/lib/types";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — ResumeForge" },
      {
        name: "description",
        content: "Your resumes, applications, interviews and ATS health at a glance.",
      },
      { property: "og:title", content: "Dashboard — ResumeForge" },
      {
        property: "og:description",
        content: "Your resumes, applications, interviews and ATS health at a glance.",
      },
    ],
  }),
  component: Dashboard,
});

const PIPELINE: ApplicationStatus[] = ["Applied", "Interview", "Offer", "Rejected"];

function Dashboard() {
  const data = useAppData();
  const navigate = useNavigate();

  const createResume = () => {
    const r = blankResume(`Resume ${data.resumes.length + 1}`);
    r.header = {
      fullName: data.profile.fullName,
      headline: data.profile.headline,
      email: data.profile.email,
      phone: data.profile.phone,
      location: data.profile.location,
      website: data.profile.website,
      linkedin: data.profile.linkedin,
      github: data.profile.github,
    };
    setData((d) => ({ ...d, resumes: [r, ...d.resumes] }));
    navigate({ to: "/builder/$id", params: { id: r.id } });
  };

  const interviews = data.applications.filter(
    (a) => a.status === "Interview" || a.status === "Technical Interview" || a.status === "Final Round",
  );
  const scored = data.resumes.filter((r) => typeof r.lastScore === "number");
  const avgScore = scored.length
    ? Math.round(scored.reduce((a, r) => a + (r.lastScore ?? 0), 0) / scored.length)
    : null;

  const recentResumes = [...data.resumes].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 5);
  const recentApps = [...data.applications].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 5);

  const firstName = (data.settings.displayName || data.profile.fullName || "").split(" ")[0];

  return (
    <div className="space-y-5">
      <PageHeader
        title={firstName ? `Welcome back, ${firstName}` : "Your career workspace"}
        subtitle="Everything here is yours, unlimited, and stored on this device."
        actions={
          <Button onClick={createResume}>
            <Plus className="size-4" /> New resume
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatTile label="Resumes" value={data.resumes.length} hint="Unlimited" />
        <StatTile label="Cover letters" value={data.coverLetters.length} hint="Unlimited" />
        <StatTile
          label="Applications"
          value={data.applications.length}
          hint={`${data.applications.filter((a) => a.status !== "Rejected" && a.status !== "Withdrawn").length} active`}
        />
        <StatTile label="Interviews" value={interviews.length} hint="Scheduled or in progress" />
        <StatTile
          label="Avg ATS score"
          value={avgScore === null ? "—" : `${avgScore}`}
          hint={avgScore === null ? "Run a check to see this" : "Across checked resumes"}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <GlassCard soft className="p-4 lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-[15px] font-semibold">Recently edited resumes</h2>
            <Link to="/builder" className="text-xs font-medium text-primary hover:underline">
              View all
            </Link>
          </div>
          {recentResumes.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No resumes yet. Create your first one to get started.
            </p>
          ) : (
            <ul className="divide-y divide-border/60">
              {recentResumes.map((r) => (
                <li key={r.id}>
                  <Link
                    to="/builder/$id"
                    params={{ id: r.id }}
                    className="flex items-center gap-3 py-2.5"
                  >
                    <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-secondary text-secondary-foreground">
                      <FileText className="size-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{r.name}</span>
                      <span className="block text-[11px] text-muted-foreground">
                        Edited {new Date(r.updatedAt).toLocaleDateString()} ·{" "}
                        {r.lastScore ? `ATS ${r.lastScore}` : "Not checked"}
                      </span>
                    </span>
                    <span className="rounded-md bg-secondary px-2 py-1 text-[11px] font-medium text-secondary-foreground">
                      {r.design.template}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </GlassCard>

        <GlassCard soft className="p-4">
          <h2 className="font-display mb-3 text-[15px] font-semibold">Quick actions</h2>
          <div className="space-y-2">
            <QuickAction icon={FilePenLine} label="Create resume" onClick={createResume} />
            <QuickAction icon={Gauge} label="Analyze resume" to="/analyzer" />
            <QuickAction icon={Target} label="Tailor to a job" to="/tailoring" />
            <QuickAction icon={Mail} label="Create cover letter" to="/cover-letters" />
            <QuickAction icon={Briefcase} label="Add job application" to="/tracker" />
            <QuickAction icon={Mic} label="Practice interview" to="/interview" />
          </div>
        </GlassCard>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Job tracker
          </h2>
          <Link to="/tracker" className="text-xs font-medium text-primary hover:underline">
            Open tracker
          </Link>
        </div>
        {data.applications.length === 0 ? (
          <EmptyState
            title="No applications yet"
            body="Track every role you apply to, from saved to offer, with the resume and cover letter you used."
            action={
              <Button asChild variant="outline">
                <Link to="/tracker">Add an application</Link>
              </Button>
            }
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {PIPELINE.map((status) => (
              <GlassCard soft key={status} className="p-3">
                <p className="text-[12px] font-semibold text-muted-foreground">{status}</p>
                <div className="mt-2 space-y-2">
                  {data.applications
                    .filter((a) => a.status === status)
                    .slice(0, 3)
                    .map((a) => (
                      <div key={a.id} className="rounded-xl bg-card/70 p-2.5">
                        <p className="text-[13px] font-semibold">{a.company}</p>
                        <p className="text-[11px] text-muted-foreground">{a.title}</p>
                      </div>
                    ))}
                  {data.applications.filter((a) => a.status === status).length === 0 ? (
                    <p className="py-2 text-[11px] text-muted-foreground">Nothing here yet</p>
                  ) : null}
                </div>
              </GlassCard>
            ))}
          </div>
        )}
      </div>

      {recentApps.length > 0 ? (
        <GlassCard soft className="p-4">
          <h2 className="font-display mb-2 text-[15px] font-semibold">Recent applications</h2>
          <ul className="divide-y divide-border/60">
            {recentApps.map((a) => (
              <li key={a.id} className="flex items-center gap-3 py-2 text-sm">
                <span className="min-w-0 flex-1 truncate font-medium">
                  {a.title} — {a.company}
                </span>
                <span className="text-[11px] text-muted-foreground">{a.status}</span>
              </li>
            ))}
          </ul>
        </GlassCard>
      ) : null}
    </div>
  );
}

function QuickAction({
  icon: Icon,
  label,
  to,
  onClick,
}: {
  icon: typeof FilePenLine;
  label: string;
  to?: string;
  onClick?: () => void;
}) {
  const inner = (
    <>
      <span className="grid size-7 shrink-0 place-items-center rounded-md bg-secondary text-primary">
        <Icon className="size-3.5" />
      </span>
      <span className="text-[13px] font-medium">{label}</span>
    </>
  );
  const cls =
    "flex w-full items-center gap-3 rounded-lg bg-card/70 px-3 py-2.5 text-left transition-transform hover:-translate-y-0.5";
  if (to)
    return (
      <Link to={to} className={cls}>
        {inner}
      </Link>
    );
  return (
    <button type="button" onClick={onClick} className={cls}>
      {inner}
    </button>
  );
}
