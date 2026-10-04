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
  HeaderContactItem,
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
import { CONTACT_PRESETS, getContacts, headerFromProfile, makeContact } from "@/lib/header";

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
  const [saveState, setSaveState] = useState<"saved" | "saving">("saved");
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const markSaving = useCallback(() => {
    setSaveState("saving");
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => setSaveState("saved"), 500);
  }, []);

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
      markSaving();
    },
    [id, markSaving],
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
        saveState={saveState}
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
  saveState,
}: {
  saveState: "saved" | "saving";
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
        aria-label="Resume name"
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
        <span
          className={`text-[11px] font-medium ${saveState === "saving" ? "text-warning" : "text-success"}`}
          aria-live="polite"
        >
          {saveState === "saving" ? "Saving…" : "Saved"}
        </span>
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
  const set = (k: "fullName" | "headline", v: string) =>
    commit((r) => ({ ...r, header: { ...r.header, [k]: v } }), false);
  const contacts = getContacts(resume.header);
  const setContacts = (fn: (list: HeaderContactItem[]) => HeaderContactItem[], record = false) =>
    commit((r) => ({ ...r, header: { ...r.header, contacts: fn(getContacts(r.header)) } }), record);
  const patchContact = (id: string, patch: Partial<HeaderContactItem>, record = false) =>
    setContacts((list) => list.map((c) => (c.id === id ? { ...c, ...patch } : c)), record);
  const moveContact = (id: string, dir: -1 | 1) =>
    setContacts((list) => {
      const i = list.findIndex((c) => c.id === id);
      const item = list[i];
      if (!item) return list;
      // swap with the nearest neighbour on the same row
      let j = i + dir;
      while (j >= 0 && j < list.length && list[j]?.row !== item.row) j += dir;
      if (j < 0 || j >= list.length) return list;
      const next = [...list];
      [next[i], next[j]] = [next[j]!, next[i]!];
      return next;
    }, true);
  const [preset, setPreset] = useState("custom-link");
  const maxRow = Math.max(3, ...contacts.map((c) => c.row + 1));

  return (
    <GlassCard soft className="p-3">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Header
        </p>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => commit((r) => ({ ...r, header: headerFromProfile(profile) }))}
        >
          Pull from profile
        </Button>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <div>
          <Label>Full name</Label>
          <Input
            className="glass-input mt-1 h-9"
            value={resume.header.fullName}
            aria-invalid={!!headerError("fullName", resume.header.fullName)}
            onChange={(e) => set("fullName", e.target.value)}
          />
          {headerError("fullName", resume.header.fullName) ? (
            <p className="mt-0.5 text-[11px] text-destructive">{headerError("fullName", resume.header.fullName)}</p>
          ) : null}
        </div>
        <div>
          <Label>Professional title</Label>
          <Input
            className="glass-input mt-1 h-9"
            value={resume.header.headline}
            onChange={(e) => set("headline", e.target.value)}
          />
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <Label>Contact details &amp; links</Label>
        <span className="text-[10px] text-muted-foreground">Text · link (optional) · row</span>
      </div>
      {contacts.length === 0 ? (
        <p className="mt-1 rounded-lg border border-dashed border-border p-2 text-center text-[11px] text-muted-foreground">
          No contact details yet — add email, phone or a link below.
        </p>
      ) : null}
      <div className="mt-1 space-y-1.5">
        {contacts.map((c) => {
          const err = headerError(c.type, c.value);
          const preset = CONTACT_PRESETS.find((p) => p.type === c.type);
          const isLink = !!c.url || !!preset?.link;
          return (
            <div key={c.id} className={`rounded-lg bg-card/60 p-1.5 ${c.visible ? "" : "opacity-55"}`}>
              <div className="flex items-center gap-1">
                <Input
                  className="glass-input h-7 w-24 shrink-0 px-2 text-[11px] font-semibold"
                  placeholder="Label"
                  aria-label="Field label"
                  value={c.label}
                  onChange={(e) => patchContact(c.id, { label: e.target.value })}
                />
                <Input
                  className="glass-input h-7 min-w-0 flex-1 px-2 text-xs"
                  placeholder="Shown on resume"
                  aria-label={`${c.label || "Field"} text`}
                  value={c.value}
                  onChange={(e) => patchContact(c.id, { value: e.target.value })}
                />
                <select
                  aria-label={`${c.label || "Field"} row`}
                  className="h-7 rounded-md border border-input bg-card px-1 text-[11px]"
                  value={c.row}
                  onChange={(e) => patchContact(c.id, { row: Number(e.target.value) }, true)}
                >
                  {Array.from({ length: maxRow }, (_, i) => i + 1).map((n) => (
                    <option key={n} value={n}>
                      Row {n}
                    </option>
                  ))}
                </select>
                <Button size="sm" variant="ghost" className="size-7 p-0" title="Move up" onClick={() => moveContact(c.id, -1)}>
                  <ArrowUp className="size-3" />
                </Button>
                <Button size="sm" variant="ghost" className="size-7 p-0" title="Move down" onClick={() => moveContact(c.id, 1)}>
                  <ArrowDown className="size-3" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="size-7 p-0"
                  title={c.visible ? `Hide ${c.label}` : `Show ${c.label}`}
                  onClick={() => patchContact(c.id, { visible: !c.visible }, true)}
                >
                  {c.visible ? <Eye className="size-3" /> : <EyeOff className="size-3" />}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="size-7 p-0"
                  title={`Delete ${c.label}`}
                  onClick={() => setContacts((list) => list.filter((x) => x.id !== c.id), true)}
                >
                  <Trash2 className="size-3" />
                </Button>
              </div>
              {isLink ? (
                <Input
                  className="glass-input mt-1 h-7 px-2 text-[11px]"
                  placeholder="Link URL (optional), e.g. https://leetcode.com/username"
                  aria-label={`${c.label || "Field"} URL`}
                  value={c.url ?? ""}
                  onChange={(e) => patchContact(c.id, { url: e.target.value || undefined })}
                />
              ) : null}
              {err ? <p className="mt-0.5 text-[11px] text-destructive">{err}</p> : null}
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex items-center gap-1.5">
        <select
          aria-label="Field type to add"
          className="h-8 flex-1 rounded-md border border-input bg-card px-2 text-xs"
          value={preset}
          onChange={(e) => setPreset(e.target.value)}
        >
          {CONTACT_PRESETS.map((p) => (
            <option key={p.type} value={p.type}>
              {p.label}
            </option>
          ))}
        </select>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setContacts((list) => [...list, makeContact(preset)], true)}
        >
          <Plus className="size-3.5" /> Add field
        </Button>
      </div>
      <div className="mt-3 flex items-center gap-3">
        {resume.header.photo ? (
          <img src={resume.header.photo} alt="Profile" className="size-12 rounded-full object-cover" />
        ) : null}
        <label className="cursor-pointer text-xs font-medium text-primary">
          {resume.header.photo ? "Change photo" : "Add profile photo"}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              if (file.size > 1_500_000) {
                toast.error("Please choose an image under 1.5 MB.");
                return;
              }
              const reader = new FileReader();
              reader.onload = () => {
                commit((r) => ({
                  ...r,
                  header: { ...r.header, photo: String(reader.result) },
                  design: { ...r.design, showPhoto: true },
                }));
              };
              reader.readAsDataURL(file);
            }}
          />
        </label>
        {resume.header.photo ? (
          <button
            type="button"
            className="text-xs text-muted-foreground hover:text-destructive"
            onClick={() => commit((r) => ({ ...r, header: { ...r.header, photo: undefined } }))}
          >
            Remove
          </button>
        ) : null}
        <span className="text-[11px] text-muted-foreground">Photos can confuse ATS parsers.</span>
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
      [list[index], list[to]] = [list[to]!, list[index]!];
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
          {section.items.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border p-3 text-center text-xs text-muted-foreground">
              {EMPTY_HINT[section.kind] ?? "Nothing added yet — add your first entry."}
            </p>
          ) : null}
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
              onDuplicate={() =>
                patch((s) => {
                  const list = [...(s.items ?? [])];
                  list.splice(i + 1, 0, { ...structuredClone(item), id: uid() });
                  return { ...s, items: list };
                }, true)
              }
              onMove={(dir) =>
                patch((s) => {
                  const list = [...(s.items ?? [])];
                  const to = i + dir;
                  if (to < 0 || to >= list.length) return s;
                  [list[i], list[to]] = [list[to]!, list[i]!];
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
  onDuplicate,
}: {
  item: ExperienceItem | EducationItem | ProjectItem | SimpleItem | SkillGroup;
  resume: Resume;
  onChange: (next: ExperienceItem | EducationItem | ProjectItem | SimpleItem | SkillGroup) => void;
  onRemove: () => void;
  onDuplicate: () => void;
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
      <Button size="sm" variant="ghost" onClick={onDuplicate} title="Duplicate entry">
        <Copy className="size-3.5" />
      </Button>
      <Button size="sm" variant="ghost" onClick={onRemove} title="Delete entry">
        <Trash2 className="size-3.5" />
      </Button>
    </div>
  );

  if (isSkillGroup(item)) {
    return (
      <div className="rounded-xl bg-card/60 p-2.5">
        <div className="grid gap-2 sm:grid-cols-2">
          <Input
            className="glass-input h-8"
            placeholder="Category"
            value={item.label}
            onChange={(e) => onChange({ ...item, label: e.target.value })}
          />
          <Input
            className="glass-input h-8"
            placeholder="Proficiency (e.g. Advanced)"
            value={item.proficiency ?? ""}
            onChange={(e) => onChange({ ...item, proficiency: e.target.value })}
          />
        </div>
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
          <Input className="glass-input h-8" placeholder={item.current ? "Present" : "End"} disabled={item.current} value={item.current ? "" : item.end ?? ""} onChange={(e) => onChange({ ...item, end: e.target.value })} />
          <Input className="glass-input h-8" placeholder="Location" value={item.location ?? ""} onChange={(e) => onChange({ ...item, location: e.target.value })} />
          <label className="flex items-center gap-2 text-xs">
            <Switch checked={!!item.current} onCheckedChange={(v) => onChange({ ...item, current: v })} />
            Current position
          </label>
        </div>
        <DateWarning start={item.start} end={item.current ? undefined : item.end} />
        <Textarea className="glass-input mt-2 min-h-12 text-sm" placeholder="Short description (optional)" value={item.description ?? ""} onChange={(e) => onChange({ ...item, description: e.target.value })} />
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
          <Input className="glass-input h-8" placeholder="Field of study" value={item.field ?? ""} onChange={(e) => onChange({ ...item, field: e.target.value })} />
          <Input className="glass-input h-8" placeholder="Location" value={item.location ?? ""} onChange={(e) => onChange({ ...item, location: e.target.value })} />
        </div>
        <DateWarning start={item.start} end={item.end} />
        <Textarea className="glass-input mt-2 min-h-12 text-sm" placeholder="Description, honours, GPA (optional)" value={item.description ?? item.details ?? ""} onChange={(e) => onChange({ ...item, description: e.target.value, details: undefined })} />
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
          <Input className="glass-input h-8" placeholder="URL" value={item.url ?? ""} onChange={(e) => onChange({ ...item, url: e.target.value })} />
          <Input className="glass-input h-8" placeholder="Technologies (comma separated)" value={(item.technologies ?? []).join(", ")} onChange={(e) => onChange({ ...item, technologies: e.target.value.split(",").map((t) => t.trimStart()) })} />
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
        <Input className="glass-input mt-2 h-8" placeholder="Description (optional)" value={item.description ?? ""} onChange={(e) => onChange({ ...item, description: e.target.value })} />
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
            onClick={() => run(instruction ?? "")}
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
            onClick={() => run(instruction ?? "")}
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
        onValueChange={([v]) => onChange(v ?? value)}
      />
    </div>
  );
}

const EMPTY_HINT: Partial<Record<SectionKind, string>> = {
  experience: "No experience added yet — add your first position.",
  education: "No education added yet — add your first school or course of study.",
  skills: "No skills yet — add a category such as “Languages & tools”.",
  projects: "No projects yet — add something you built or led.",
  certifications: "No certifications yet.",
  languages: "No languages yet.",
  achievements: "No achievements yet.",
};

function headerError(key: string, value: string): string | null {
  const v = value.trim();
  if (key === "fullName" && !v) return "Your name is required.";
  if (key === "email" && v && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return "This doesn't look like an email address.";
  if (key === "phone" && v && !/^[+()\dxX\s.-]{6,}$/.test(v)) return "Use digits, spaces, +, - or brackets.";
  return null;
}

function parseLooseDate(v?: string): number | null {
  if (!v?.trim()) return null;
  const m = v.trim().match(/(\d{4})(?:[-/.](\d{1,2}))?/);
  if (m) return Number(m[1]) * 12 + (m[2] ? Number(m[2]) - 1 : 0);
  const t = Date.parse(v);
  return Number.isNaN(t) ? null : new Date(t).getFullYear() * 12 + new Date(t).getMonth();
}

function DateWarning({ start, end }: { start?: string | undefined; end?: string | undefined }) {
  const a = parseLooseDate(start);
  const b = parseLooseDate(end);
  if (start?.trim() && a === null)
    return <p className="mt-1 text-[11px] text-destructive">Start date not recognised — try “2021-03” or “Mar 2021”.</p>;
  if (end?.trim() && b === null && !/present|now|current/i.test(end))
    return <p className="mt-1 text-[11px] text-destructive">End date not recognised — try “2023-06” or “Present”.</p>;
  if (a !== null && b !== null && b < a)
    return <p className="mt-1 text-[11px] text-destructive">End date is before the start date.</p>;
  return null;
}
