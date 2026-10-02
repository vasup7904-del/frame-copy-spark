import { Link, useNavigate } from "@tanstack/react-router";
import { Copy, FileText, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/glass";
import { TEMPLATES } from "@/lib/defaults";
import { deleteResume, duplicateResume, renameResume } from "@/lib/resume-actions";
import type { Resume } from "@/lib/types";

export function ResumeCard({ resume }: { resume: Resume }) {
  const navigate = useNavigate();
  const template = TEMPLATES.find((t) => t.id === resume.design.template)?.name ?? resume.design.template;

  return (
    <GlassCard soft className="flex flex-col p-4">
      <div className="flex items-start gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-secondary text-primary">
          <FileText className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{resume.name}</p>
          <p className="text-[11px] text-muted-foreground">
            Modified {new Date(resume.updatedAt).toLocaleString()}
          </p>
          <p className="mt-1 inline-block rounded-md bg-secondary px-2 py-0.5 text-[11px] font-medium text-secondary-foreground">
            {template}
          </p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-1.5">
        <Button size="sm" asChild>
          <Link to="/builder/$id" params={{ id: resume.id }}>
            Open
          </Link>
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            const c = duplicateResume(resume.id);
            if (c) {
              toast.success("Duplicated");
              navigate({ to: "/builder/$id", params: { id: c.id } });
            }
          }}
        >
          <Copy className="size-3.5" /> Duplicate
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            const name = window.prompt("Rename resume", resume.name);
            if (name !== null) renameResume(resume.id, name);
          }}
        >
          <Pencil className="size-3.5" /> Rename
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            if (window.confirm(`Delete "${resume.name}"? This cannot be undone.`)) {
              deleteResume(resume.id);
              toast.success("Deleted");
            }
          }}
        >
          <Trash2 className="size-3.5" /> Delete
        </Button>
      </div>
    </GlassCard>
  );
}
