import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Copy, Plus, Trash2, Upload } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { EmptyState, GlassCard, PageHeader, Label } from "@/components/glass";
import { ResumeCard } from "@/components/resume-card";
import { blankResume, newSection, uid } from "@/lib/defaults";
import { setData, useAppData } from "@/lib/store";
import { createResume } from "@/lib/resume-actions";
import { legacyToContacts } from "@/lib/header";
import { useAI } from "@/lib/use-ai";

export const Route = createFileRoute("/builder/")({
  head: () => ({
    meta: [
      { title: "Resume Builder — ResumeForge" },
      { name: "description", content: "All your resumes and versions in one place." },
      { property: "og:title", content: "Resume Builder — ResumeForge" },
      { property: "og:description", content: "Create, duplicate and version unlimited resumes." },
    ],
  }),
  component: ResumeList,
});

function ResumeList() {
  const data = useAppData();
  const navigate = useNavigate();

  const create = () => {
    const r = createResume();
    navigate({ to: "/builder/$id", params: { id: r.id } });
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Resumes"
        subtitle="Unlimited resumes and versions. Nothing is locked."
        actions={
          <>
            <ImportDialog />
            <Button onClick={create}>
              <Plus className="size-4" /> New resume
            </Button>
          </>
        }
      />

      {data.resumes.length === 0 ? (
        <EmptyState
          title="No resumes yet"
          body="Start from a blank resume, or import an existing one by pasting its text."
          action={<Button onClick={create}>Create your first resume</Button>}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...data.resumes]
            .sort((a, b) => b.updatedAt - a.updatedAt)
            .map((r) => (
              <ResumeCard key={r.id} resume={r} />
            ))}
        </div>
      )}
    </div>
  );
}

interface Parsed {
  fullName?: string;
  headline?: string;
  email?: string;
  phone?: string;
  location?: string;
  summary?: string;
  experience?: { role?: string; company?: string; start?: string; end?: string; bullets?: string[] }[];
  education?: { degree?: string; school?: string; start?: string; end?: string }[];
  skills?: string[];
}

function ImportDialog() {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [parsed, setParsed] = useState<Parsed | null>(null);
  const { askJson, loading } = useAI();
  const navigate = useNavigate();

  const extract = async () => {
    const result = await askJson<Parsed>(
      `Extract structured resume data from the text below. Only use information that literally appears in it. Use empty strings for anything absent.\nReturn JSON of the shape {"fullName":"","headline":"","email":"","phone":"","location":"","summary":"","experience":[{"role":"","company":"","start":"","end":"","bullets":[""]}],"education":[{"degree":"","school":"","start":"","end":""}],"skills":[""]}\n\nRESUME TEXT:\n${text.slice(0, 12000)}`,
      "You extract structured data from resumes. You never invent information.",
    );
    if (result) setParsed(result);
  };

  const save = () => {
    if (!parsed) return;
    const r = blankResume(parsed.fullName ? `${parsed.fullName} — imported` : "Imported resume");
    r.header = {
      fullName: parsed.fullName ?? "",
      headline: parsed.headline ?? "",
      contacts: legacyToContacts({
        email: parsed.email,
        phone: parsed.phone,
        location: parsed.location,
      }),
    };
    const summary = newSection("summary");
    summary.text = parsed.summary ?? "";
    const exp = newSection("experience");
    exp.items = (parsed.experience ?? []).map((e) => ({
      id: uid(),
      role: e.role ?? "",
      company: e.company ?? "",
      start: e.start ?? "",
      end: e.end ?? "",
      bullets: e.bullets ?? [],
    }));
    const edu = newSection("education");
    edu.items = (parsed.education ?? []).map((e) => ({
      id: uid(),
      degree: e.degree ?? "",
      school: e.school ?? "",
      start: e.start ?? "",
      end: e.end ?? "",
    }));
    const skills = newSection("skills");
    skills.items = [{ id: uid(), label: "Skills", items: parsed.skills ?? [] }];
    r.sections = [summary, exp, edu, skills];
    setData((d) => ({ ...d, resumes: [r, ...d.resumes] }));
    setOpen(false);
    setParsed(null);
    setText("");
    navigate({ to: "/builder/$id", params: { id: r.id } });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload className="size-4" /> Import
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import an existing resume</DialogTitle>
          <DialogDescription>
            Paste the text of your PDF, DOCX or TXT resume. You will see the extracted result before
            anything is saved, and you can correct it afterwards in the editor.
          </DialogDescription>
        </DialogHeader>
        <Textarea
          className="glass-input min-h-48"
          placeholder="Paste your resume text here…"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <div className="flex gap-2">
          <Button onClick={extract} disabled={loading || text.trim().length < 40}>
            {loading ? "Reading…" : "Extract content"}
          </Button>
          <label className="inline-flex">
            <input
              type="file"
              accept=".txt,.md,.csv"
              className="hidden"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (f) setText(await f.text());
              }}
            />
            <span className="inline-flex cursor-pointer items-center rounded-md border border-input px-3 py-2 text-sm">
              Load .txt file
            </span>
          </label>
        </div>

        {parsed ? (
          <div className="space-y-2 rounded-xl bg-card/70 p-3 text-sm">
            <p className="font-semibold">Extracted preview</p>
            <div className="grid gap-2 sm:grid-cols-2">
              <div>
                <Label>Name</Label>
                <Input
                  className="glass-input mt-1"
                  value={parsed.fullName ?? ""}
                  onChange={(e) => setParsed({ ...parsed, fullName: e.target.value })}
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  className="glass-input mt-1"
                  value={parsed.email ?? ""}
                  onChange={(e) => setParsed({ ...parsed, email: e.target.value })}
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              {parsed.experience?.length ?? 0} roles · {parsed.education?.length ?? 0} education
              entries · {parsed.skills?.length ?? 0} skills
            </p>
          </div>
        ) : null}

        <DialogFooter>
          <Button onClick={save} disabled={!parsed}>
            Save as resume
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
