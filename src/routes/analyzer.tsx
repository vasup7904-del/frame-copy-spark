import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Sparkles, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState, GlassCard, Label, Meter, PageHeader, ScorePie } from "@/components/glass";
import { analyzeResume, type CheckResult, type Category } from "@/lib/ats";
import { setData, useAppData } from "@/lib/store";
import { resumeToText } from "@/lib/resume-utils";
import { useAI } from "@/lib/use-ai";

export const Route = createFileRoute("/analyzer")({
  head: () => ({
    meta: [
      { title: "Resume analyzer & ATS checker — ResumeForge" },
      {
        name: "description",
        content: "Run 25+ checks on your resume covering ATS parsing, structure, content and readability.",
      },
      { property: "og:title", content: "Resume analyzer & ATS checker — ResumeForge" },
      {
        property: "og:description",
        content: "Scores plus what's wrong, why it matters and how to fix it.",
      },
    ],
  }),
  component: AnalyzerPage,
});

const CATEGORIES: Category[] = ["ATS", "Formatting", "Structure", "Content", "Keywords", "Readability"];

function AnalyzerPage() {
  const data = useAppData();
  const [resumeId, setResumeId] = useState(data.resumes[0]?.id ?? "");
  const [jd, setJd] = useState("");
  const [review, setReview] = useState<string | null>(null);
  const { ask, loading } = useAI();

  const resume = data.resumes.find((r) => r.id === resumeId) ?? data.resumes[0];
  const report = useMemo(
    () => (resume ? analyzeResume(resume, jd.trim() || undefined) : null),
    [resume, jd],
  );

  if (!resume || !report) {
    return (
      <div className="space-y-5">
        <PageHeader title="Resume analyzer" subtitle="Deep checks for ATS parsing and writing quality." />
        <EmptyState title="No resume to analyze yet" description="Create a resume first, then come back." />
      </div>
    );
  }

  const runReview = async () => {
    const text = await ask(
      `Review this resume as an experienced recruiter. Point out the three strongest things and the three weakest things, and give concrete rewrites only where the existing content supports them. Never invent experience, employers or numbers.${
        jd.trim() ? `\n\nTarget job description:\n${jd.slice(0, 4000)}` : ""
      }\n\nResume:\n${resumeToText(resume).slice(0, 6000)}`,
    );
    if (text) setReview(text);
  };

  const saveScore = () => {
    setData((d) => ({
      ...d,
      resumes: d.resumes.map((r) => (r.id === resume.id ? { ...r, lastScore: report.scores.overall } : r)),
    }));
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Resume analyzer & ATS checker"
        subtitle="25+ checks across parsing, structure, writing and keywords."
      />

      <GlassCard soft className="grid gap-3 p-4 md:grid-cols-[260px_1fr]">
        <div>
          <Label>Resume</Label>
          <Select value={resume.id} onValueChange={setResumeId}>
            <SelectTrigger className="glass-input mt-1 h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {data.resumes.map((r) => (
                <SelectItem key={r.id} value={r.id}>
                  {r.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Job description (optional — enables keyword matching)</Label>
          <Textarea
            className="glass-input mt-1 min-h-24"
            placeholder="Paste the job posting here…"
            value={jd}
            onChange={(e) => setJd(e.target.value)}
          />
        </div>
      </GlassCard>

      <GlassCard className="grid gap-6 p-5 md:grid-cols-[auto_1fr]">
        <div className="flex flex-col items-center justify-center">
          <ScorePie value={report.scores.overall} />
          <p className="mt-2 text-xs text-muted-foreground">Overall</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Meter label="ATS compatibility" value={report.scores.ats} />
          <Meter label="Content" value={report.scores.content} />
          <Meter label="Formatting" value={report.scores.formatting} />
          <Meter label="Keywords" value={report.scores.keyword} />
          <Meter label="Readability" value={report.scores.readability} />
        </div>
      </GlassCard>

      <p className="text-xs text-muted-foreground">
        These scores describe how clearly your resume reads and parses. No score can predict or
        guarantee that a particular applicant tracking system or employer will accept your application.
      </p>

      {jd.trim() ? (
        <GlassCard soft className="p-4">
          <p className="text-sm font-semibold">Keyword match</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {report.matched.map((k) => (
              <span key={k} className="rounded-full bg-success/15 px-2 py-0.5 text-[11px] text-success">
                {k}
              </span>
            ))}
            {report.missing.map((k) => (
              <span key={k} className="rounded-full bg-destructive/10 px-2 py-0.5 text-[11px] text-destructive">
                {k}
              </span>
            ))}
          </div>
        </GlassCard>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={saveScore}>
          Save score to this resume
        </Button>
        <Button onClick={runReview} disabled={loading}>
          <Sparkles className="size-4" /> {loading ? "Reviewing…" : "AI recruiter review"}
        </Button>
      </div>

      {review ? (
        <GlassCard className="whitespace-pre-wrap p-4 text-sm leading-relaxed">{review}</GlassCard>
      ) : null}

      <div className="space-y-4">
        {CATEGORIES.map((cat) => {
          const checks = report.checks.filter((c) => c.category === cat);
          if (!checks.length) return null;
          return (
            <div key={cat}>
              <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                {cat}
              </h3>
              <div className="mt-2 space-y-2">
                {checks.map((c) => (
                  <CheckRow key={c.id} check={c} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CheckRow({ check }: { check: CheckResult }) {
  const Icon = check.severity === "pass" ? CheckCircle2 : check.severity === "warn" ? AlertTriangle : XCircle;
  const tone =
    check.severity === "pass" ? "text-success" : check.severity === "warn" ? "text-warning" : "text-destructive";
  return (
    <GlassCard soft className="flex gap-3 p-3">
      <Icon className={`mt-0.5 size-4 shrink-0 ${tone}`} />
      <div className="min-w-0">
        <p className="text-sm font-medium">{check.label}</p>
        {check.severity !== "pass" ? (
          <dl className="mt-1 space-y-0.5 text-xs text-muted-foreground">
            <div>
              <span className="font-semibold text-foreground">What: </span>
              {check.what}
            </div>
            <div>
              <span className="font-semibold text-foreground">Why: </span>
              {check.why}
            </div>
            <div>
              <span className="font-semibold text-foreground">How: </span>
              {check.how}
            </div>
          </dl>
        ) : (
          <p className="mt-0.5 text-xs text-muted-foreground">{check.what}</p>
        )}
      </div>
    </GlassCard>
  );
}
