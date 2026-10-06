import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Check, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { GlassCard, PageHeader } from "@/components/glass";
import { ResumeDocument } from "@/components/resume-document";
import { TEMPLATES, blankResume } from "@/lib/defaults";
import { sampleResume } from "@/lib/sample-resume";
import { setData, useAppData } from "@/lib/store";
import type { Resume } from "@/lib/types";

export const Route = createFileRoute("/templates")({
  head: () => ({
    meta: [
      { title: "Resume templates — ResumeForge" },
      {
        name: "description",
        content: "Original resume templates, from strict ATS layouts to refined two-column designs, with live previews.",
      },
      { property: "og:title", content: "Resume templates — ResumeForge" },
      { property: "og:description", content: "Browse live previews of every template — all free, all unlocked." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: TemplatesPage,
});

const CATEGORIES = ["All", "ATS", "Modern", "Minimal", "Professional", "Executive", "Creative", "Academic", "Technical", "Student", "Two-column"];
const PAGE_PX = 794; // 210mm at 96dpi

/** Renders the real ResumeDocument scaled to fit its container width. */
function FitPreview({ resume, className }: { resume: Resume; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.3);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => e && setScale(e.contentRect.width / PAGE_PX));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return (
    <div ref={ref} className={`pointer-events-none relative overflow-hidden ${className ?? ""}`} aria-hidden>
      <div style={{ width: PAGE_PX }}>
        <ResumeDocument resume={resume} scale={scale} />
      </div>
    </div>
  );
}

function TemplatesPage() {
  const data = useAppData();
  const navigate = useNavigate();
  const [targetId, setTargetId] = useState<string>(data.resumes[0]?.id ?? "");
  const [filter, setFilter] = useState("All");
  const [source, setSource] = useState<"sample" | "mine">("sample");
  const [previewId, setPreviewId] = useState<string | null>(null);

  const target = data.resumes.find((r) => r.id === targetId) ?? data.resumes[0];
  const shown = TEMPLATES.filter((t) => filter === "All" || t.categories.includes(filter));
  const previewOf = (templateId: string): Resume =>
    source === "mine" && target
      ? { ...target, design: { ...target.design, template: templateId } }
      : sampleResume(templateId);

  const apply = (templateId: string) => {
    if (!target) {
      const resume = blankResume("New resume");
      resume.design.template = templateId;
      setData((d) => ({ ...d, resumes: [resume, ...d.resumes] }));
      navigate({ to: "/builder/$id", params: { id: resume.id } });
      return;
    }
    // presentation only — content is never touched
    setData((d) => ({
      ...d,
      resumes: d.resumes.map((r) =>
        r.id === target.id ? { ...r, design: { ...r.design, template: templateId }, updatedAt: Date.now() } : r,
      ),
    }));
    setPreviewId(null);
    toast.success(`${TEMPLATES.find((t) => t.id === templateId)?.name} applied to "${target.name}" — content unchanged.`, {
      action: { label: "Open", onClick: () => navigate({ to: "/builder/$id", params: { id: target.id } }) },
    });
  };

  const previewTpl = TEMPLATES.find((t) => t.id === previewId);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Templates"
        subtitle="Every template reads the same structured content, so switching never loses anything."
      />

      <GlassCard soft className="space-y-3 p-3">
        <div className="flex flex-wrap gap-1.5">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setFilter(c)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                filter === c ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-accent"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-3 border-t border-border/60 pt-3">
          <div className="flex rounded-full bg-secondary p-0.5 text-xs">
            {(["sample", "mine"] as const).map((s) => (
              <button
                key={s}
                type="button"
                disabled={s === "mine" && !target}
                onClick={() => setSource(s)}
                className={`rounded-full px-3 py-1 font-medium transition disabled:opacity-40 ${
                  source === s ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
                }`}
              >
                {s === "sample" ? "Sample content" : "My resume"}
              </button>
            ))}
          </div>
          {data.resumes.length ? (
            <div className="ml-auto flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Apply to</span>
              <Select value={target?.id ?? ""} onValueChange={setTargetId}>
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
          ) : (
            <span className="ml-auto text-xs text-muted-foreground">Using a template starts a new resume.</span>
          )}
        </div>
      </GlassCard>

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {shown.map((t) => {
          const current = target?.design.template === t.id;
          return (
            <GlassCard key={t.id} className="group flex flex-col overflow-hidden p-3">
              <button
                type="button"
                onClick={() => setPreviewId(t.id)}
                className="relative block overflow-hidden rounded-xl bg-muted/50 p-3 text-left"
                aria-label={`Preview ${t.name}`}
              >
                <FitPreview
                  resume={previewOf(t.id)}
                  className="aspect-[210/297] rounded-sm shadow-md transition-transform duration-300 group-hover:-translate-y-1"
                />
                <span className="absolute inset-x-0 bottom-3 mx-auto flex w-fit items-center gap-1 rounded-full bg-card/95 px-3 py-1 text-xs font-medium opacity-0 shadow transition group-hover:opacity-100">
                  <Eye className="size-3.5" /> Preview
                </span>
              </button>
              <div className="mt-3 flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-display text-base font-semibold">{t.name}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{t.description}</p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                    t.atsSafe ? "bg-success/15 text-success" : "bg-warning/15 text-warning"
                  }`}
                >
                  {t.atsSafe ? "✓ ATS-friendly" : "Visual"}
                </span>
              </div>
              <div className="mt-2 flex flex-wrap gap-1">
                {t.categories.map((c) => (
                  <span key={c} className="rounded-full bg-secondary px-2 py-0.5 text-[10px] text-secondary-foreground">
                    {c}
                  </span>
                ))}
              </div>
              <div className="mt-auto flex gap-2 pt-3">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => setPreviewId(t.id)}>
                  Preview
                </Button>
                <Button size="sm" className="flex-1" disabled={current} onClick={() => apply(t.id)}>
                  {current ? (
                    <>
                      <Check className="size-3.5" /> In use
                    </>
                  ) : (
                    "Use template"
                  )}
                </Button>
              </div>
            </GlassCard>
          );
        })}
      </div>

      <p className="text-xs text-muted-foreground">
        ATS-friendly layouts stay single column with standard headings and no graphics. Visual layouts
        look stronger to a human reader but can confuse some parsers — use them when you know a person
        reads first. No layout can guarantee how a specific ATS will read your resume.
      </p>

      <Dialog open={!!previewTpl} onOpenChange={(o) => !o && setPreviewId(null)}>
        <DialogContent className="max-h-[92vh] max-w-3xl overflow-hidden p-0">
          {previewTpl ? (
            <>
              <DialogHeader className="flex-row items-center justify-between gap-3 border-b border-border p-4 pr-12">
                <div>
                  <DialogTitle className="font-display">{previewTpl.name}</DialogTitle>
                  <p className="text-xs text-muted-foreground">
                    {previewTpl.atsSafe ? "ATS-friendly" : "Visual layout"} · {source === "mine" && target ? target.name : "Sample content"}
                  </p>
                </div>
                <Button size="sm" disabled={target?.design.template === previewTpl.id} onClick={() => apply(previewTpl.id)}>
                  {target ? `Use for "${target.name}"` : "Use template"}
                </Button>
              </DialogHeader>
              <div className="max-h-[calc(92vh-80px)] overflow-y-auto bg-muted/40 p-5">
                <FitPreview resume={previewOf(previewTpl.id)} className="mx-auto max-w-[640px] shadow-lg" />
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
