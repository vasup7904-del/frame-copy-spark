import { createFileRoute } from "@tanstack/react-router";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { GlassCard, PageHeader, Label } from "@/components/glass";
import { setData, useAppData } from "@/lib/store";
import { uid } from "@/lib/defaults";
import type { CareerProfile, SimpleItem } from "@/lib/types";
import { toast } from "sonner";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Career Profile — ResumeForge" },
      {
        name: "description",
        content: "Your master career profile: experience, education, skills and everything reusable.",
      },
      { property: "og:title", content: "Career Profile — ResumeForge" },
      {
        property: "og:description",
        content: "Enter your career information once and reuse it across every resume.",
      },
    ],
  }),
  component: ProfilePage,
});

function update(fn: (p: CareerProfile) => CareerProfile) {
  setData((d) => ({ ...d, profile: fn(d.profile) }));
}

const SIMPLE_SECTIONS: { key: keyof CareerProfile; label: string }[] = [
  { key: "certifications", label: "Certifications" },
  { key: "achievements", label: "Achievements" },
  { key: "awards", label: "Awards" },
  { key: "languages", label: "Languages" },
  { key: "volunteer", label: "Volunteer experience" },
  { key: "publications", label: "Publications" },
  { key: "courses", label: "Courses" },
  { key: "organizations", label: "Organizations" },
];

function ProfilePage() {
  const profile = useAppData().profile;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Career profile"
        subtitle="Enter everything once here. Every resume can pull from this master record."
        actions={<Button variant="outline" onClick={() => toast.success("Saved")}>Saved automatically</Button>}
      />

      <GlassCard soft className="p-4">
        <h2 className="font-display mb-3 text-[15px] font-semibold">Personal information</h2>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          <Field label="Full name" value={profile.fullName} onChange={(v) => update((p) => ({ ...p, fullName: v }))} />
          <Field label="Professional headline" value={profile.headline} onChange={(v) => update((p) => ({ ...p, headline: v }))} />
          <Field label="Email" value={profile.email} onChange={(v) => update((p) => ({ ...p, email: v }))} />
          <Field label="Phone" value={profile.phone} onChange={(v) => update((p) => ({ ...p, phone: v }))} />
          <Field label="Location" value={profile.location} onChange={(v) => update((p) => ({ ...p, location: v }))} />
          <Field label="Portfolio / website" value={profile.website} onChange={(v) => update((p) => ({ ...p, website: v }))} />
          <Field label="LinkedIn" value={profile.linkedin} onChange={(v) => update((p) => ({ ...p, linkedin: v }))} />
          <Field label="GitHub" value={profile.github} onChange={(v) => update((p) => ({ ...p, github: v }))} />
          <Field
            label="Interests (comma separated)"
            value={profile.interests.join(", ")}
            onChange={(v) =>
              update((p) => ({ ...p, interests: v.split(",").map((s) => s.trim()).filter(Boolean) }))
            }
          />
        </div>
        <div className="mt-3">
          <Label>Professional summary</Label>
          <Textarea
            className="glass-input mt-1 min-h-24"
            value={profile.summary}
            onChange={(e) => update((p) => ({ ...p, summary: e.target.value }))}
          />
        </div>
      </GlassCard>

      <GlassCard soft className="p-4">
        <SectionHead
          title="Work experience"
          onAdd={() =>
            update((p) => ({
              ...p,
              experience: [
                ...p.experience,
                { id: uid(), role: "", company: "", location: "", start: "", end: "", bullets: [""] },
              ],
            }))
          }
        />
        <div className="space-y-3">
          {profile.experience.map((x, i) => (
            <div key={x.id} className="rounded-xl bg-card/60 p-3">
              <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-4">
                <Field label="Role" value={x.role} onChange={(v) => update((p) => { const e = [...p.experience]; e[i] = { ...x, role: v }; return { ...p, experience: e }; })} />
                <Field label="Company" value={x.company} onChange={(v) => update((p) => { const e = [...p.experience]; e[i] = { ...x, company: v }; return { ...p, experience: e }; })} />
                <Field label="Start" value={x.start ?? ""} onChange={(v) => update((p) => { const e = [...p.experience]; e[i] = { ...x, start: v }; return { ...p, experience: e }; })} />
                <Field label="End" value={x.end ?? ""} onChange={(v) => update((p) => { const e = [...p.experience]; e[i] = { ...x, end: v }; return { ...p, experience: e }; })} />
              </div>
              <div className="mt-2">
                <Label>Bullet points (one per line)</Label>
                <Textarea
                  className="glass-input mt-1 min-h-20"
                  value={x.bullets.join("\n")}
                  onChange={(e) =>
                    update((p) => {
                      const list = [...p.experience];
                      list[i] = { ...x, bullets: e.target.value.split("\n") };
                      return { ...p, experience: list };
                    })
                  }
                />
              </div>
              <div className="mt-2 flex justify-end">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => update((p) => ({ ...p, experience: p.experience.filter((e) => e.id !== x.id) }))}
                >
                  <Trash2 className="size-3.5" /> Remove
                </Button>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>

      <GlassCard soft className="p-4">
        <SectionHead
          title="Education"
          onAdd={() =>
            update((p) => ({
              ...p,
              education: [...p.education, { id: uid(), degree: "", school: "", start: "", end: "" }],
            }))
          }
        />
        <div className="space-y-3">
          {profile.education.map((x, i) => (
            <div key={x.id} className="rounded-xl bg-card/60 p-3">
              <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-4">
                <Field label="Degree" value={x.degree} onChange={(v) => update((p) => { const e = [...p.education]; e[i] = { ...x, degree: v }; return { ...p, education: e }; })} />
                <Field label="School" value={x.school} onChange={(v) => update((p) => { const e = [...p.education]; e[i] = { ...x, school: v }; return { ...p, education: e }; })} />
                <Field label="Start" value={x.start ?? ""} onChange={(v) => update((p) => { const e = [...p.education]; e[i] = { ...x, start: v }; return { ...p, education: e }; })} />
                <Field label="End" value={x.end ?? ""} onChange={(v) => update((p) => { const e = [...p.education]; e[i] = { ...x, end: v }; return { ...p, education: e }; })} />
              </div>
              <div className="mt-2 flex justify-end">
                <Button size="sm" variant="ghost" onClick={() => update((p) => ({ ...p, education: p.education.filter((e) => e.id !== x.id) }))}>
                  <Trash2 className="size-3.5" /> Remove
                </Button>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>

      <GlassCard soft className="p-4">
        <SectionHead
          title="Skill groups"
          onAdd={() => update((p) => ({ ...p, skills: [...p.skills, { id: uid(), label: "Technical skills", items: [] }] }))}
        />
        <div className="space-y-2">
          {profile.skills.map((g, i) => (
            <div key={g.id} className="grid gap-2 rounded-xl bg-card/60 p-3 md:grid-cols-[200px_1fr_auto]">
              <Field label="Group" value={g.label} onChange={(v) => update((p) => { const s = [...p.skills]; s[i] = { ...g, label: v }; return { ...p, skills: s }; })} />
              <Field
                label="Skills (comma separated)"
                value={g.items.join(", ")}
                onChange={(v) =>
                  update((p) => {
                    const s = [...p.skills];
                    s[i] = { ...g, items: v.split(",").map((x) => x.trim()).filter(Boolean) };
                    return { ...p, skills: s };
                  })
                }
              />
              <div className="flex items-end">
                <Button size="sm" variant="ghost" onClick={() => update((p) => ({ ...p, skills: p.skills.filter((s) => s.id !== g.id) }))}>
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>

      <GlassCard soft className="p-4">
        <SectionHead
          title="Projects"
          onAdd={() => update((p) => ({ ...p, projects: [...p.projects, { id: uid(), name: "", bullets: [""] }] }))}
        />
        <div className="space-y-3">
          {profile.projects.map((x, i) => (
            <div key={x.id} className="rounded-xl bg-card/60 p-3">
              <div className="grid gap-2 md:grid-cols-3">
                <Field label="Name" value={x.name} onChange={(v) => update((p) => { const l = [...p.projects]; l[i] = { ...x, name: v }; return { ...p, projects: l }; })} />
                <Field label="Role" value={x.role ?? ""} onChange={(v) => update((p) => { const l = [...p.projects]; l[i] = { ...x, role: v }; return { ...p, projects: l }; })} />
                <Field label="Link" value={x.url ?? ""} onChange={(v) => update((p) => { const l = [...p.projects]; l[i] = { ...x, url: v }; return { ...p, projects: l }; })} />
              </div>
              <Textarea
                className="glass-input mt-2 min-h-16"
                placeholder="Bullet points, one per line"
                value={x.bullets.join("\n")}
                onChange={(e) =>
                  update((p) => {
                    const l = [...p.projects];
                    l[i] = { ...x, bullets: e.target.value.split("\n") };
                    return { ...p, projects: l };
                  })
                }
              />
              <div className="mt-2 flex justify-end">
                <Button size="sm" variant="ghost" onClick={() => update((p) => ({ ...p, projects: p.projects.filter((e) => e.id !== x.id) }))}>
                  <Trash2 className="size-3.5" /> Remove
                </Button>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>

      {SIMPLE_SECTIONS.map(({ key, label }) => {
        const list = profile[key] as SimpleItem[];
        return (
          <GlassCard soft key={key as string} className="p-4">
            <SectionHead
              title={label}
              onAdd={() =>
                update((p) => ({ ...p, [key]: [...(p[key] as SimpleItem[]), { id: uid(), title: "" }] }) as CareerProfile)
              }
            />
            <div className="space-y-2">
              {list.map((x, i) => (
                <div key={x.id} className="grid gap-2 rounded-xl bg-card/60 p-3 md:grid-cols-[1fr_1fr_140px_auto]">
                  <Field label="Title" value={x.title} onChange={(v) => update((p) => { const l = [...(p[key] as SimpleItem[])]; l[i] = { ...x, title: v }; return { ...p, [key]: l } as CareerProfile; })} />
                  <Field label="Detail" value={x.subtitle ?? ""} onChange={(v) => update((p) => { const l = [...(p[key] as SimpleItem[])]; l[i] = { ...x, subtitle: v }; return { ...p, [key]: l } as CareerProfile; })} />
                  <Field label="Date" value={x.date ?? ""} onChange={(v) => update((p) => { const l = [...(p[key] as SimpleItem[])]; l[i] = { ...x, date: v }; return { ...p, [key]: l } as CareerProfile; })} />
                  <div className="flex items-end">
                    <Button size="sm" variant="ghost" onClick={() => update((p) => ({ ...p, [key]: (p[key] as SimpleItem[]).filter((e) => e.id !== x.id) }) as CareerProfile)}>
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
              {list.length === 0 ? <p className="text-sm text-muted-foreground">Nothing added yet.</p> : null}
            </div>
          </GlassCard>
        );
      })}
    </div>
  );
}

function SectionHead({ title, onAdd }: { title: string; onAdd: () => void }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="font-display text-[15px] font-semibold">{title}</h2>
      <Button size="sm" variant="outline" onClick={onAdd}>
        <Plus className="size-3.5" /> Add
      </Button>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <Input className="glass-input mt-1" value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
