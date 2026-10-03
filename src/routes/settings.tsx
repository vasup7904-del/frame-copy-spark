import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GlassCard, Label, PageHeader } from "@/components/glass";
import { TEMPLATES } from "@/lib/defaults";
import { clearAll, exportJson, setData, useAppData } from "@/lib/store";
import { downloadFile } from "@/lib/resume-utils";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — ResumeForge" },
      { name: "description", content: "Defaults for new resumes and local data backup." },
      { property: "og:title", content: "Settings — ResumeForge" },
      { property: "og:description", content: "Defaults for new resumes and local data backup." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { settings } = useAppData();
  const set = <K extends keyof typeof settings>(k: K, v: (typeof settings)[K]) =>
    setData((d) => ({ ...d, settings: { ...d.settings, [k]: v } }));

  return (
    <div className="space-y-5">
      <PageHeader title="Settings" subtitle="Your data is stored only in this browser." />
      <GlassCard soft className="grid max-w-xl gap-4 p-4">
        <div>
          <Label>Display name</Label>
          <Input
            className="glass-input mt-1"
            value={settings.displayName}
            onChange={(e) => set("displayName", e.target.value)}
          />
        </div>
        <div>
          <Label>Default template for new resumes</Label>
          <Select value={settings.defaultTemplate} onValueChange={(v) => set("defaultTemplate", v)}>
            <SelectTrigger className="glass-input mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TEMPLATES.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Default page size</Label>
          <Select
            value={settings.defaultPageSize}
            onValueChange={(v) => set("defaultPageSize", v as "A4" | "Letter")}
          >
            <SelectTrigger className="glass-input mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="A4">A4</SelectItem>
              <SelectItem value="Letter">US Letter</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() => downloadFile("resumeforge-backup.json", exportJson(), "application/json")}
          >
            Download backup
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              if (window.confirm("Delete all ResumeForge data in this browser?")) {
                clearAll();
                toast.success("All data cleared");
              }
            }}
          >
            Clear all data
          </Button>
        </div>
      </GlassCard>
    </div>
  );
}
