import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Copy,
  Download,
  Eye,
  EyeOff,
  Languages,
  Plus,
  Printer,
  Redo2,
  Sparkles,
  Trash2,
  Undo2,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GlassCard, Label } from "@/components/glass";
import { ResumeDocument } from "@/components/resume-document";
import { AiSuggestion } from "@/components/ai-suggestion";
import { setData, useAppData } from "@/lib/store";
import { FONT_OPTIONS, SECTION_LABELS, TEMPLATES, newSection, uid } from "@/lib/defaults";
import type {
  EducationItem,
  ExperienceItem,
  ProjectItem,
  Resume,
  ResumeSection,
  SectionKind,
  SimpleItem,
  SkillGroup,
} from "@/lib/types";
import {
  isEducation,
  isExperience,
  isProject,
  isSimple,
  isSkillGroup,
  downloadFile,
  resumeToText,
} from "@/lib/resume-utils";
import { useAI } from "@/lib/use-ai";

export const Route = createFileRoute("/builder/$id")({
  head: () => ({
    meta: [
      { title: "Edit resume — ResumeForge" },
      { name: "description", content: "Edit your resume with a live A4 preview and AI writing help." },
      { property: "og:title", content: "Edit resume — ResumeForge" },
      { property: "og:description", content: "Live A4 preview, ten templates and AI writing help." },
    ],
  }),
  component: Editor,
});

const ADDABLE: SectionKind[] = [
  "summary",
  "experience",
  "education",
  "skills",
  "projects",
  "certifications",
  "achievements",
  "awards",
  "languages",
  "volunteer",
  "publications",
  "courses",
  "organizations",
  "interests",
  "references",
  "custom",
];

function Editor() {
  const { id } = useParams({ from: "/builder/$id" });
  const data = useAppData();
  const resume = data.resumes.find((r) => r.id === id);
  const [zoom, setZoom] = useState(0.72);
  const history = useRef<{ past: Resume[]; future: Resume[] }>({ past: [], future: [] });
  const [, force] = useState(0);

  const commit = useCallback(
    (fn: (r: Resume) => Resume, record = true) => {
      setData((d) => {
        const current = d.resumes.find((r) => r.id === id);
        if (!current) return d;
        if (record) {
          history.current.past.push(structuredClone(current));
          if (history.current.past.length > 60) history.current.past.shift();
          history.current.future = [];
        }
        const next = { ...fn(current), updatedAt: Date.now() };
        return { ...d, resumes: d.resumes.map((r) => (r.id === id ? next : r)) };
      });
    },
    [id],
  );

  const undo = () => {
    const prev = history.current.past.pop();
    if (!prev) return;
    setData((d) => {
      const current = d.resumes.find((r) => r.id === id);
      if (current) history.current.future.push(structuredClone(current));
      return { ...d, resumes: d.resumes.map((r) => (r.id === id ? prev : r)) };
    });
    force((n) => n + 1);
  };

  const redo = () => {
    const next = history.current.future.pop();
    if (!next) return;
    setData((d) => {
      const current = d.resumes.find((r) => r.id === id);
      if (current) history.current.past.push(structuredClone(current));
      return { ...d, resumes: d.resumes.map((r) => (r.id === id ? next : r)) };
    });
    force((n) => n + 1);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (!resume) {
    return (
      <div className="py-20 text-center">
        <p className="font-display text-lg font-semibold">This resume no longer exists.</p>
        <Button className="mt-4" asChild>
          <Link to="/builder">Back to resumes</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <Toolbar
        resume={resume}
        commit={commit}
        undo={undo}
        redo={redo}
        zoom={zoom}
        setZoom={setZoom}
      />

      <div className="mt-4 grid min-h-0 flex-1 gap-4 lg:grid-cols-[minmax(0,420px)_1fr]">
        <div className="no-print min-h-0 overflow-y-auto pr-1">
          <Tabs defaultValue="content">
            <TabsList className="glass-soft">
              <TabsTrigger value="content">Content</TabsTrigger>
              <TabsTrigger value="design">Design</TabsTrigger>
            </TabsList>

            <TabsContent value="content" className="space-y-3">
              <HeaderEditor resume={resume} commit={commit} />
              {resume.sections.map((section, index) => (
                <SectionEditor
                  key={section.id}
                  section={section}
                  index={index}
                  total={resume.sections.length}
                  resume={resume}
                  commit={commit}
                />
              ))}
              <AddSection commit={commit} />
            </TabsContent>

            <TabsContent value="design">
              <DesignPanel resume={resume} commit={commit} />
            </TabsContent>
          </Tabs>
        </div>

        <div className="min-h-0 overflow-auto rounded-2xl bg-muted/40 p-4">
          <div className="flex justify-center">
            <div style={{ width: `calc(210mm * ${zoom})` }}>
              <ResumeDocument resume={resume} scale={zoom} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Toolbar({
  resume,
  commit,
  undo,
  redo,
  zoom,
  setZoom,
}: {
  resume: Resume;
  commit: (fn: (r: Resume) => Resume, record?: boolean) => void;
  undo: () => void;
  redo: () => void;
  zoom: number;
  setZoom: (n: number) => void;
}) {
  const { ask, loading } = useAI();
  const [language, setLanguage] = useState("Spanish");

  const translate = async () => {
    const text = await ask(
      `Translate this resume into ${language}. Keep every section heading, date, person name, company name, product name and URL exactly as written — translate only the descriptive language. Return the translated resume as plain text using the same structure.\n\n${resumeToText(resume)}`,
      { system: "You are a professional resume translator." },
    );
    if (!text) return;
    setData((d) => ({
      ...d,
      notes: [
        {
          id: uid(),
          title: `${resume.name} — ${language}`,
          kind: "other",
          body: text,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
        ...d.notes,
      ],
    }));
    toast.success(`Translation saved to your library (${language})`);
  };

  return (
    <div className="no-print flex flex-wrap items-center gap-2">
      <Input
        className="glass-input h-9 w-56"
        value={resume.name}
        onChange={(e) => commit((r) => ({ ...r, name: e.target.value }), false)}
      />
      <Button size="sm" variant="ghost" onClick={undo} title="Undo">
        <Undo2 className="size-4" />
      </Button>
      <Button size="sm" variant="ghost" onClick={redo} title="Redo">
        <Redo2 className="size-4" />
      </Button>
      <Button size="sm" variant="ghost" onClick={() => setZoom(Math.max(0.4, zoom - 0.08))}>
        <ZoomOut className="size-4" />
      </Button>
      <span className="text-xs text-muted-foreground">{Math.round(zoom * 100)}%</span>
      <Button size="sm" variant="ghost" onClick={() => setZoom(Math.min(1.3, zoom + 0.08))}>
        <ZoomIn className="size-4" />
      </Button>

      <span className="ml-auto flex flex-wrap items-center gap-2">
        <span className="text-[11px] text-muted-foreground">Saved automatically</span>
        <Select value={language} onValueChange={setLanguage}>
          <SelectTrigger className="glass-input h-9 w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {["Spanish", "French", "German", "Portuguese", "Dutch", "Italian", "Hindi", "Japanese"].map(
              (l) => (
                <SelectItem key={l} value={l}>
                  {l}
                </SelectItem>
              ),
            )}
          </SelectContent>
        </Select>
        <Button size="sm" variant="outline" onClick={translate} disabled={loading}>
          <Languages className="size-4" /> Translate
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => downloadFile(`${resume.name}.txt`, resumeToText(resume))}
        >
          <Download className="size-4" /> TXT
        </Button>
        <Button size="sm" onClick={() => window.print()}>
          <Printer className="size-4" /> Export PDF
        </Button>
      </span>
    </div>
  );
}

function HeaderEditor({
  resume,
  commit,
}: {
  resume: Resume;
  commit: (fn: (r: Resume) => Resume, record?: boolean) => void;
}) {
  const profile = useAppData().profile;
  const set = (k: keyof Resume["header"], v: string) =>
    commit((r) => ({ ...r, header: { ...r.header, [k]: v } }), false);

  return (
    <GlassCard soft className="p-3">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Header
        </p>
        <Button
          size="sm"
          variant="ghost"
          onClick={() =>
            commit((r) => ({
              ...r,
              header: {
                fullName: profile.fullName,
                headline: profile.headline,
                email: profile.email,
                phone: profile.phone,
                location: profile.location,
                website: profile.website,
                linkedin: profile.linkedin,
                github: profile.github,
              },
            }))
          }
        >
          Pull from profile
        </Button>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {(
          [
            ["fullName", "Full name"],
            ["headline", "Headline"],
            ["email", "Email"],
            ["phone", "Phone"],
            ["location", "Location"],
            ["website", "Website"],
            ["linkedin", "LinkedIn"],
            ["github", "GitHub"],
          ] as const
        ).map(([key, label]) => (
          <div key={key}>
            <Label>{label}</Label>
            <Input
              className="glass-input mt-1 h-9"
              value={resume.header[key]}
              onChange={(e) => set(key, e.target.value)}
            />
          </div>
        ))}
      </div>
    </GlassCard>
  );
}

function AddSection({ commit }: { commit: (fn: (r: Resume) => Resume) => void }) {
  const [kind, setKind] = useState<SectionKind>("certifications");
  return (
    <GlassCard soft className="flex items-end gap-2 p-3">
      <div className="flex-1">
        <Label>Add a section</Label>
        <Select value={kind} onValueChange={(v) => setKind(v as SectionKind)}>
          <SelectTrigger className="glass-input mt-1 h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ADDABLE.map((k) => (
              <SelectItem key={k} value={k}>
                {SECTION_LABELS[k]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button
        onClick={() =>
          commit((r) => ({
            ...r,
            sections: [
              ...r.sections,
              newSection(kind, kind === "custom" ? "New section" : undefined),
            ],
          }))
        }
      >
        <Plus className="size-4" /> Add
      </Button>
    </GlassCard>
  );
}

function SectionEditor({
  section,
  index,
  total,
  resume,
  commit,
}: {
  section: ResumeSection;
  index: number;
  total: number;
  resume: Resume;
  commit: (fn: (r: Resume) => Resume, record?: boolean) => void;
}) {
  const profile = useAppData().profile;
  const patch = (fn: (s: ResumeSection) => ResumeSection, record = false) =>
    commit(
      (r) => ({ ...r, sections: r.sections.map((s) => (s.id === section.id ? fn(s) : s)) }),
      record,
    );

  const move = (dir: -1 | 1) =>
    commit((r) => {
      const list = [...r.sections];
      const to = index + dir;
      if (to < 0 || to >= list.length) return r;
      [list[index], list[to]] = [list[to], list[index]];
      return { ...r, sections: list };
    });

  const addItem = () => {
    const kind = section.kind;
    let item: ExperienceItem | EducationItem | ProjectItem | SimpleItem | SkillGroup;
    if (kind === "experience" || kind === "volunteer")
      item = { id: uid(), role: "", company: "", start: "", end: "", bullets: [""] };
    else if (kind === "education") item = { id: uid(), degree: "", school: "", start: "", end: "" };
    else if (kind === "skills") item = { id: uid(), label: "Skills", items: [] };
    else if (kind === "projects") item = { id: uid(), name: "", bullets: [""] };
    else item = { id: uid(), title: "" };
    patch((s) => ({ ...s, items: [...(s.items ?? []), item] }), true);
  };

  const pullFromProfile = () => {
    const map: Partial<Record<SectionKind, unknown[]>> = {
      experience: profile.experience,
      education: profile.education,
      skills: profile.skills,
      projects: profile.projects,
      certifications: profile.certifications,
      achievements: profile.achievements,
      awards: profile.awards,
      languages: profile.languages,
      volunteer: profile.volunteer,
      publications: profile.publications,
      courses: profile.courses,
      organizations: profile.organizations,
    };
    if (section.kind === "summary") {
      patch((s) => ({ ...s, text: profile.summary }), true);
      toast.success("Summary pulled from profile");
      return;
    }
    const src = map[section.kind];
    if (!src || src.length === 0) {
      toast.error("Nothing in your career profile for this section yet.");
      return;
    }
    patch((s) => ({ ...s, items: structuredClone(src) as ResumeSection["items"] }), true);
    toast.success("Pulled from career profile");
  };

  const supportsProfile = section.kind !== "references" && section.kind !== "custom" && section.kind !== "interests";

  return (
    <GlassCard soft className="p-3">
      <div className="flex items-center gap-1.5">
        <Input
          className="glass-input h-8 flex-1 text-sm font-semibold"
          value={section.title}
          onChange={(e) => patch((s) => ({ ...s, title: e.target.value }))}
        />
        <Button size="sm" variant="ghost" onClick={() => move(-1)} disabled={index === 0}>
          <ArrowUp className="size-3.5" />
        </Button>
        <Button size="sm" variant="ghost" onClick={() => move(1)} disabled={index === total - 1}>
          <ArrowDown className="size-3.5" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => patch((s) => ({ ...s, visible: !s.visible }), true)}
          title={section.visible ? "Hide section" : "Show section"}
        >
          {section.visible ? <Eye className="size-3.5" /> : <EyeOff className="size-3.5" />}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() =>
            commit((r) => ({
              ...r,
              sections: [
                ...r.sections.slice(0, index + 1),
                { ...structuredClone(section), id: uid(), title: `${section.title} (copy)` },
                ...r.sections.slice(index + 1),
              ],
            }))
          }
        >
          <Copy className="size-3.5" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => commit((r) => ({ ...r, sections: r.sections.filter((s) => s.id !== section.id) }))}
        >
          <Trash2 className="size-3.5" />
        </Button>
      </div>

      {!section.visible ? (
        <p className="mt-2 text-[11px] text-muted-foreground">Hidden from the preview and export.</p>
      ) : null}

      {section.text !== undefined ? (
        <div className="mt-2">
          <Textarea
            className="glass-input min-h-24"
            placeholder={section.kind === "summary" ? "Two or three lines about your positioning…" : "Text"}
            value={section.text}
            onChange={(e) => patch((s) => ({ ...s, text: e.target.value }))}
          />
          <AiTextTools
            text={section.text}
            context={resume}
            onApply={(v) => patch((s) => ({ ...s, text: v }), true)}
            kind={section.kind === "summary" ? "summary" : "text"}
          />
        </div>
      ) : null}

      {section.bullets ? (
        <Textarea
          className="glass-input mt-2 min-h-16"
          placeholder="Comma or line separated entries"
          value={section.bullets.join("\n")}
          onChange={(e) => patch((s) => ({ ...s, bullets: e.target.value.split("\n") }))}
        />
      ) : null}

      {section.items ? (
        <div className="mt-2 space-y-2">
          {section.items.map((item, i) => (
            <ItemEditor
              key={item.id}
              item={item}
              resume={resume}
              onChange={(next) =>
                patch((s) => {
                  const list = [...(s.items ?? [])];
                  list[i] = next;
                  return { ...s, items: list };
                })
              }
              onRemove={() =>
                patch((s) => ({ ...s, items: (s.items ?? []).filter((x) => x.id !== item.id) }), true)
              }
              onMove={(dir) =>
                patch((s) => {
                  const list = [...(s.items ?? [])];
                  const to = i + dir;
                  if (to < 0 || to >= list.length) return s;
                  [list[i], list[to]] = [list[to], list[i]];
                  return { ...s, items: list };
                }, true)
              }
            />
          ))}
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={addItem}>
              <Plus className="size-3.5" /> Add entry
            </Button>
            {supportsProfile ? (
              <Button size="sm" variant="ghost" onClick={pullFromProfile}>
                Pull from profile
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}
    </GlassCard>
  );
}

function ItemEditor({
  item,
  resume,
  onChange,
  onRemove,
  onMove,
}: {
  item: ExperienceItem | EducationItem | ProjectItem | SimpleItem | SkillGroup;
  resume: Resume;
  onChange: (next: ExperienceItem | EducationItem | ProjectItem | SimpleItem | SkillGroup) => void;
  onRemove: () => void;
  onMove: (dir: -1 | 1) => void;
}) {
  const controls = (
    <div className="flex justify-end gap-1">
      <Button size="sm" variant="ghost" onClick={() => onMove(-1)}>
        <ArrowUp className="size-3.5" />
      </Button>
      <Button size="sm" variant="ghost" onClick={() => onMove(1)}>
        <ArrowDown className="size-3.5" />
      </Button>
      <Button size="sm" variant="ghost" onClick={onRemove}>
        <Trash2 className="size-3.5" />
      </Button>
    </div>
  );

  if (isSkillGroup(item)) {
    return (
      <div className="rounded-xl bg-card/60 p-2.5">
        <Input
          className="glass-input h-8"
          value={item.label}
          onChange={(e) => onChange({ ...item, label: e.target.value })}
        />
        <Textarea
          className="glass-input mt-2 min-h-14"
          placeholder="Comma separated skills"
          value={item.items.join(", ")}
          onChange={(e) =>
            onChange({ ...item, items: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })
          }
        />
        <SkillSuggestions resume={resume} onAdd={(skills) => onChange({ ...item, items: [...new Set([...item.items, ...skills])] })} />
        {controls}
      </div>
    );
  }

  if (isExperience(item)) {
    return (
      <div className="rounded-xl bg-card/60 p-2.5">
        <div className="grid gap-2 sm:grid-cols-2">
          <Input className="glass-input h-8" placeholder="Role" value={item.role} onChange={(e) => onChange({ ...item, role: e.target.value })} />
          <Input className="glass-input h-8" placeholder="Company" value={item.company} onChange={(e) => onChange({ ...item, company: e.target.value })} />
          <Input className="glass-input h-8" placeholder="Start" value={item.start ?? ""} onChange={(e) => onChange({ ...item, start: e.target.value })} />
          <Input className="glass-input h-8" placeholder="End" value={item.end ?? ""} onChange={(e) => onChange({ ...item, end: e.target.value })} />
        </div>
        <div className="mt-2 space-y-2">
          {item.bullets.map((b, i) => (
            <BulletEditor
              key={i}
              value={b}
              resume={resume}
              role={item.role}
              company={item.company}
              onChange={(v) => {
                const bullets = [...item.bullets];
                bullets[i] = v;
                onChange({ ...item, bullets });
              }}
              onRemove={() => onChange({ ...item, bullets: item.bullets.filter((_, x) => x !== i) })}
            />
          ))}
          <Button size="sm" variant="ghost" onClick={() => onChange({ ...item, bullets: [...item.bullets, ""] })}>
            <Plus className="size-3.5" /> Add bullet
          </Button>
        </div>
        {controls}
      </div>
    );
  }

  if (isEducation(item)) {
    return (
      <div className="rounded-xl bg-card/60 p-2.5">
        <div className="grid gap-2 sm:grid-cols-2">
          <Input className="glass-input h-8" placeholder="Degree" value={item.degree} onChange={(e) => onChange({ ...item, degree: e.target.value })} />
          <Input className="glass-input h-8" placeholder="School" value={item.school} onChange={(e) => onChange({ ...item, school: e.target.value })} />
          <Input className="glass-input h-8" placeholder="Start" value={item.start ?? ""} onChange={(e) => onChange({ ...item, start: e.target.value })} />
          <Input className="glass-input h-8" placeholder="End" value={item.end ?? ""} onChange={(e) => onChange({ ...item, end: e.target.value })} />
        </div>
        <Input className="glass-input mt-2 h-8" placeholder="Details" value={item.details ?? ""} onChange={(e) => onChange({ ...item, details: e.target.value })} />
        {controls}
      </div>
    );
  }

  if (isProject(item)) {
    return (
      <div className="rounded-xl bg-card/60 p-2.5">
        <div className="grid gap-2 sm:grid-cols-2">
          <Input className="glass-input h-8" placeholder="Project" value={item.name} onChange={(e) => onChange({ ...item, name: e.target.value })} />
          <Input className="glass-input h-8" placeholder="Role" value={item.role ?? ""} onChange={(e) => onChange({ ...item, role: e.target.value })} />
        </div>
        <Textarea className="glass-input mt-2 min-h-14" placeholder="Description" value={item.description ?? ""} onChange={(e) => onChange({ ...item, description: e.target.value })} />
        <div className="mt-2 space-y-2">
          {item.bullets.map((b, i) => (
            <BulletEditor
              key={i}
              value={b}
              resume={resume}
              role={item.role ?? ""}
              company={item.name}
              onChange={(v) => {
                const bullets = [...item.bullets];
                bullets[i] = v;
                onChange({ ...item, bullets });
              }}
              onRemove={() => onChange({ ...item, bullets: item.bullets.filter((_, x) => x !== i) })}
            />
          ))}
          <Button size="sm" variant="ghost" onClick={() => onChange({ ...item, bullets: [...item.bullets, ""] })}>
            <Plus className="size-3.5" /> Add bullet
          </Button>
        </div>
        {controls}
      </div>
    );
  }

  if (isSimple(item)) {
    return (
      <div className="rounded-xl bg-card/60 p-2.5">
        <div className="grid gap-2 sm:grid-cols-3">
          <Input className="glass-input h-8" placeholder="Title" value={item.title} onChange={(e) => onChange({ ...item, title: e.target.value })} />
          <Input className="glass-input h-8" placeholder="Detail" value={item.subtitle ?? ""} onChange={(e) => onChange({ ...item, subtitle: e.target.value })} />
          <Input className="glass-input h-8" placeholder="Date" value={item.date ?? ""} onChange={(e) => onChange({ ...item, date: e.target.value })} />
        </div>
        {controls}
      </div>
    );
  }

  return null;
}

const BULLET_TOOLS = [
  ["Improve", "Improve this bullet point while keeping every fact identical."],
  ["Concise", "Make this bullet point more concise without losing any fact."],
  ["Professional", "Make this bullet point sound more professional."],
  ["Action verbs", "Rewrite this bullet point so it starts with a strong action verb."],
  ["Quantify", "Rewrite this bullet so measurable impact is highlighted. If no number exists in the text, insert a clearly marked placeholder like [ADD METRIC] rather than inventing one."],
  ["Grammar", "Fix grammar and spelling in this bullet point. Change nothing else."],
  ["Humanize", "Rewrite this bullet in natural human phrasing, avoiding buzzwords and AI cliches."],
] as const;

function BulletEditor({
  value,
  resume,
  role,
  company,
  onChange,
  onRemove,
}: {
  value: string;
  resume: Resume;
  role: string;
  company: string;
  onChange: (v: string) => void;
  onRemove: () => void;
}) {
  const { ask, loading } = useAI();
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [lastPrompt, setLastPrompt] = useState("");

  const run = async (instruction: string) => {
    setLastPrompt(instruction);
    const text = await ask(
      `${instruction}\n\nContext: the person's role was "${role}" at "${company}".\nBullet: ${value}\n\nReturn only the rewritten bullet point.`,
      { system: "You rewrite resume bullet points. You never invent facts." },
    );
    if (text) setSuggestion(text.replace(/^[-•]\s*/, ""));
  };

  return (
    <div>
      <div className="flex gap-1.5">
        <Textarea
          className="glass-input min-h-14 flex-1 text-sm"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <Button size="sm" variant="ghost" onClick={onRemove}>
          <Trash2 className="size-3.5" />
        </Button>
      </div>
      <div className="mt-1 flex flex-wrap gap-1">
        {BULLET_TOOLS.map(([label, instruction]) => (
          <button
            key={label}
            type="button"
            disabled={loading || !value.trim()}
            onClick={() => run(instruction)}
            className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-secondary-foreground hover:bg-primary/10 hover:text-primary disabled:opacity-50"
          >
            {label}
          </button>
        ))}
      </div>
      {suggestion ? (
        <AiSuggestion
          original={value}
          suggestion={suggestion}
          loading={loading}
          onAccept={() => {
            onChange(suggestion);
            setSuggestion(null);
          }}
          onReject={() => setSuggestion(null)}
          onRegenerate={() => run(lastPrompt)}
        />
      ) : null}
      {!value.trim() ? (
        <button
          type="button"
          disabled={loading}
          onClick={async () => {
            const text = await ask(
              `Draft one resume bullet point for the role "${role}" at "${company}". Base it only on this resume's existing content; where a specific detail or number is unknown, use a clearly marked placeholder in square brackets.\n\nResume:\n${resumeToText(resume).slice(0, 3000)}`,
              { system: "You draft resume bullet points without inventing facts." },
            );
            if (text) setSuggestion(text.replace(/^[-•]\s*/, ""));
          }}
          className="mt-1 inline-flex items-center gap-1 text-[11px] font-medium text-primary"
        >
          <Sparkles className="size-3" /> Generate a bullet
        </button>
      ) : null}
    </div>
  );
}

function SkillSuggestions({ resume, onAdd }: { resume: Resume; onAdd: (s: string[]) => void }) {
  const { askJson, loading } = useAI();
  const [suggested, setSuggested] = useState<string[]>([]);
  return (
    <div className="mt-2">
      <button
        type="button"
        disabled={loading}
        onClick={async () => {
          const res = await askJson<{ skills: string[] }>(
            `Based only on the experience and projects in this resume, list up to 10 skills the person has clearly demonstrated. Do not invent skills they have not evidenced. Return {"skills":["..."]}.\n\n${resumeToText(resume).slice(0, 4000)}`,
          );
          if (res?.skills) setSuggested(res.skills);
        }}
        className="inline-flex items-center gap-1 text-[11px] font-medium text-primary"
      >
        <Sparkles className="size-3" /> Suggest skills from my experience
      </button>
      {suggested.length ? (
        <div className="mt-2 flex flex-wrap gap-1">
          {suggested.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => {
                onAdd([s]);
                setSuggested((list) => list.filter((x) => x !== s));
              }}
              className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] text-primary"
            >
              + {s}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function AiTextTools({
  text,
  context,
  onApply,
  kind,
}: {
  text: string;
  context: Resume;
  onApply: (v: string) => void;
  kind: "summary" | "text";
}) {
  const { ask, loading } = useAI();
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [last, setLast] = useState("");

  const run = async (instruction: string) => {
    setLast(instruction);
    const res = await ask(
      `${instruction}\n\nCurrent text: ${text || "(empty)"}\n\nThe person's resume:\n${resumeToText(context).slice(0, 4000)}\n\nReturn only the new text.`,
      { system: "You write resume summaries and headlines without inventing facts." },
    );
    if (res) setSuggestion(res);
  };

  const tools =
    kind === "summary"
      ? [
          ["Generate summary", "Write a three-sentence professional summary using only facts present in the resume."],
          ["Improve", "Improve this summary while keeping every fact identical."],
          ["Concise", "Make this summary shorter and sharper."],
          ["Remove repetition", "Remove repeated ideas and phrasing from this summary."],
        ]
      : [
          ["Improve", "Improve this text while keeping every fact identical."],
          ["Grammar", "Fix grammar and spelling only."],
          ["Concise", "Make this text shorter."],
        ];

  return (
    <div>
      <div className="mt-1 flex flex-wrap gap-1">
        {tools.map(([label, instruction]) => (
          <button
            key={label}
            type="button"
            disabled={loading}
            onClick={() => run(instruction)}
            className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-secondary-foreground hover:bg-primary/10 hover:text-primary disabled:opacity-50"
          >
            {label}
          </button>
        ))}
      </div>
      {suggestion ? (
        <AiSuggestion
          original={text}
          suggestion={suggestion}
          loading={loading}
          onAccept={() => {
            onApply(suggestion);
            setSuggestion(null);
          }}
          onReject={() => setSuggestion(null)}
          onRegenerate={() => run(last)}
        />
      ) : null}
    </div>
  );
}

function DesignPanel({
  resume,
  commit,
}: {
  resume: Resume;
  commit: (fn: (r: Resume) => Resume, record?: boolean) => void;
}) {
  const d = resume.design;
  const set = <K extends keyof Resume["design"]>(k: K, v: Resume["design"][K]) =>
    commit((r) => ({ ...r, design: { ...r.design, [k]: v } }), false);
  const template = useMemo(() => TEMPLATES.find((t) => t.id === d.template), [d.template]);

  return (
    <GlassCard soft className="space-y-4 p-3">
      <div>
        <Label>Template</Label>
        <Select value={d.template} onValueChange={(v) => set("template", v)}>
          <SelectTrigger className="glass-input mt-1 h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TEMPLATES.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {t.name} — {t.category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {template ? (
          <p className="mt-1 text-[11px] text-muted-foreground">
            {template.description}{" "}
            {template.atsSafe ? "ATS-friendly formatting." : "Visual formatting — less parser-safe."}
          </p>
        ) : null}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label>Font</Label>
          <Select value={d.fontFamily} onValueChange={(v) => set("fontFamily", v)}>
            <SelectTrigger className="glass-input mt-1 h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FONT_OPTIONS.map((f) => (
                <SelectItem key={f.id} value={f.id}>
                  {f.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Page size</Label>
          <Select value={d.pageSize} onValueChange={(v) => set("pageSize", v as "A4" | "Letter")}>
            <SelectTrigger className="glass-input mt-1 h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="A4">A4</SelectItem>
              <SelectItem value="Letter">US Letter</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Heading style</Label>
          <Select value={d.headingStyle} onValueChange={(v) => set("headingStyle", v as never)}>
            <SelectTrigger className="glass-input mt-1 h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="bar">Accent bar</SelectItem>
              <SelectItem value="underline">Underline</SelectItem>
              <SelectItem value="plain">Plain</SelectItem>
              <SelectItem value="caps">Caps</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Accent colour</Label>
          <input
            type="color"
            className="mt-1 h-9 w-full rounded-md border border-input bg-card"
            value={d.accent}
            onChange={(e) => set("accent", e.target.value)}
          />
        </div>
      </div>

      <SliderRow label={`Font size — ${d.fontSize}pt`} value={d.fontSize} min={8} max={14} step={0.5} onChange={(v) => set("fontSize", v)} />
      <SliderRow label={`Line spacing — ${d.lineHeight}`} value={d.lineHeight} min={1} max={2} step={0.05} onChange={(v) => set("lineHeight", v)} />
      <SliderRow label={`Page margin — ${d.margin}mm`} value={d.margin} min={6} max={28} step={1} onChange={(v) => set("margin", v)} />
      <SliderRow label={`Section spacing — ${d.sectionSpacing}px`} value={d.sectionSpacing} min={4} max={30} step={1} onChange={(v) => set("sectionSpacing", v)} />

      <div className="flex items-center justify-between rounded-lg bg-card/60 p-2.5">
        <div>
          <p className="text-sm font-medium">Photo placeholder</p>
          <p className="text-[11px] text-muted-foreground">Off is safer for applicant tracking systems.</p>
        </div>
        <Switch checked={d.showPhoto} onCheckedChange={(v) => set("showPhoto", v)} />
      </div>
    </GlassCard>
  );
}

function SliderRow({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <Slider
        className="mt-2"
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={([v]) => onChange(v)}
      />
    </div>
  );
}
