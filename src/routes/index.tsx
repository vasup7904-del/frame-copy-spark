import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { FilePenLine, Gauge, Target, Mail, Plus, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassCard, PageHeader, StatTile, EmptyState } from "@/components/glass";
import { ResumeCard } from "@/components/resume-card";
import { useAppData } from "@/lib/store";
import { createResume } from "@/lib/resume-actions";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — ResumeForge" },
      { name: "description", content: "Your saved resumes and career documents at a glance." },
      { property: "og:title", content: "Dashboard — ResumeForge" },
      { property: "og:description", content: "Your saved resumes and career documents at a glance." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const data = useAppData();
  const navigate = useNavigate();

  const onCreate = () => {
    const r = createResume();
    navigate({ to: "/builder/$id", params: { id: r.id } });
  };

  const resumes = [...data.resumes].sort((a, b) => b.updatedAt - a.updatedAt);
  const firstName = (data.settings.displayName || data.profile.fullName || "").split(" ")[0];

  return (
    <div className="space-y-5">
      <PageHeader
        title={firstName ? `Welcome back, ${firstName}` : "Your career workspace"}
        subtitle="Everything here is yours, unlimited, and stored on this device."
        actions={
          <Button onClick={onCreate}>
            <Plus className="size-4" /> Create resume
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatTile label="Resumes" value={data.resumes.length} hint="Unlimited" />
        <StatTile label="Cover letters" value={data.coverLetters.length} hint="Unlimited" />
        <StatTile
          label="Career profile"
          value={data.profile.experience.length}
          hint="Positions stored"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <h2 className="font-display mb-3 text-[15px] font-semibold">Your resumes</h2>
          {resumes.length === 0 ? (
            <EmptyState
              title="No resumes yet"
              body="Create your first resume — it starts from your career profile and saves automatically."
              action={
                <Button onClick={onCreate}>
                  <Plus className="size-4" /> Create resume
                </Button>
              }
            />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {resumes.map((r) => (
                <ResumeCard key={r.id} resume={r} />
              ))}
            </div>
          )}
        </div>

        <GlassCard soft className="h-fit p-4">
          <h2 className="font-display mb-3 text-[15px] font-semibold">Quick actions</h2>
          <div className="space-y-2">
            <QuickAction icon={FilePenLine} label="Create resume" onClick={onCreate} />
            <QuickAction icon={UserRound} label="Edit career profile" to="/profile" />
            <QuickAction icon={Gauge} label="Analyze resume" to="/analyzer" />
            <QuickAction icon={Target} label="Tailor to a job" to="/tailoring" />
            <QuickAction icon={Mail} label="Cover letters" to="/cover-letters" />
          </div>
        </GlassCard>
      </div>
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
  to?: "/profile" | "/analyzer" | "/tailoring" | "/cover-letters";
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
