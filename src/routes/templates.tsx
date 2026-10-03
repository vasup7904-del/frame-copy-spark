import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GlassCard, PageHeader, EmptyState } from "@/components/glass";
import { ResumeDocument } from "@/components/resume-document";
import { TEMPLATES, blankResume } from "@/lib/defaults";
import { setData, useAppData } from "@/lib/store";

export const Route = createFileRoute("/templates")({
  head: () => ({
    meta: [
      { title: "Resume templates — ResumeForge" },
      {
        name: "description",
        content: "Ten original resume templates, from strict ATS layouts to creative two-column designs.",
      },
      { property: "og:title", content: "Resume templates — ResumeForge" },
      { property: "og:description", content: "Ten original templates — all free, all unlocked." },
    ],
  }),
  component: TemplatesPage,
});

function TemplatesPage() {
  const data = useAppData();
  const navigate = useNavigate();
  const [targetId, setTargetId] = useState<string>(data.resumes[0]?.id ?? "");
  const [filter, setFilter] = useState("All");

  const categories = ["All", ...new Set(TEMPLATES.map((t) => t.category))];
  const shown = TEMPLATES.filter((t) => filter === "All" || t.category === filter);
  const sample = data.resumes.find((r) => r.id === targetId) ?? data.resumes[0];

  const apply = (templateId: string) => {
    if (!sample) {
      const resume = blankResume("New resume");
      resume.design.template = templateId;
      setData((d) => ({ ...d, resumes: [resume, ...d.resumes] }));
      navigate({ to: "/builder/$id", params: { id: resume.id } });
      return;
    }
    setData((d) => ({
      ...d,
      resumes: d.resumes.map((r) =>
        r.id === sample.id
          ? { ...r, design: { ...r.design, template: templateId }, updatedAt: Date.now() }
          : r,
      ),
    }));
    toast.success("Template applied — your content is unchanged.");
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Templates"
        subtitle="Every template reads the same structured content, so switching never loses anything."
      />

      <GlassCard soft className="flex flex-wrap items-center gap-3 p-3">
        <div className="flex flex-wrap gap-1.5">
          {categories.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setFilter(c)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                filter === c ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
        {data.resumes.length ? (
          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Preview &amp; apply to</span>
            <Select value={targetId} onValueChange={setTargetId}>
              <SelectTrigger className="glass-input h-9 w-52">
                <SelectValue placeholder="Pick a resume" />
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
        ) : null}
      </GlassCard>

      {!sample ? (
        <EmptyState
          title="No resume yet"
          body="Pick any template below and we'll start a new resume with it."
        />
      ) : null}

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {shown.map((t) => (
          <GlassCard key={t.id} className="overflow-hidden p-3">
            <div className="h-64 overflow-hidden rounded-xl bg-muted/50 p-2">
              <div className="origin-top" style={{ transform: "scale(0.33)", width: "303%" }}>
                <ResumeDocument
                  resume={
                    sample
                      ? { ...sample, design: { ...sample.design, template: t.id } }
                      : (() => {
                          const b = blankResume();
                          b.design.template = t.id;
                          b.header.fullName = "Your Name";
                          return b;
                        })()
                  }
                  scale={1}
                />
              </div>
            </div>
            <div className="mt-3 flex items-start justify-between gap-2">
              <div>
                <p className="font-display text-sm font-semibold">{t.name}</p>
                <p className="text-xs text-muted-foreground">{t.description}</p>
              </div>
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                  t.atsSafe ? "bg-success/15 text-success" : "bg-warning/15 text-warning"
                }`}
              >
                {t.atsSafe ? "ATS-friendly" : "Visual"}
              </span>
            </div>
            <Button className="mt-3 w-full" size="sm" onClick={() => apply(t.id)}>
              Use {t.name}
            </Button>
          </GlassCard>
        ))}
      </div>

      <p className="text-xs text-muted-foreground">
        ATS-friendly layouts stay single column with standard headings and no graphics. Visual layouts
        look stronger to a human reader but can confuse some parsers — use them when you know a person
        reads first.
      </p>
    </div>
  );
}
