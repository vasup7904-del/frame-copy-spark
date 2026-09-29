import type {
  EducationItem,
  ExperienceItem,
  ProjectItem,
  Resume,
  ResumeSection,
  SimpleItem,
  SkillGroup,
} from "./types";

export const isExperience = (i: unknown): i is ExperienceItem =>
  !!i && typeof i === "object" && "company" in (i as object);
export const isEducation = (i: unknown): i is EducationItem =>
  !!i && typeof i === "object" && "school" in (i as object);
export const isProject = (i: unknown): i is ProjectItem =>
  !!i && typeof i === "object" && "name" in (i as object);
export const isSkillGroup = (i: unknown): i is SkillGroup =>
  !!i && typeof i === "object" && "items" in (i as object) && Array.isArray((i as SkillGroup).items);
export const isSimple = (i: unknown): i is SimpleItem =>
  !!i && typeof i === "object" && "title" in (i as object);

export function dateRange(start?: string, end?: string, current?: boolean) {
  const e = current ? "Present" : end;
  if (!start && !e) return "";
  return [start, e].filter(Boolean).join(" – ");
}

export function sectionToText(s: ResumeSection): string {
  const parts: string[] = [s.title];
  if (s.text) parts.push(s.text);
  if (s.bullets?.length) parts.push(s.bullets.join(" "));
  for (const item of s.items ?? []) {
    if (isExperience(item)) {
      parts.push(
        [item.role, item.company, item.location, dateRange(item.start, item.end, item.current)]
          .filter(Boolean)
          .join(" "),
      );
      parts.push(item.bullets.join(" "));
    } else if (isEducation(item)) {
      parts.push([item.degree, item.school, item.location, item.details].filter(Boolean).join(" "));
    } else if (isSkillGroup(item)) {
      parts.push(`${item.label}: ${item.items.join(", ")}`);
    } else if (isProject(item)) {
      parts.push([item.name, item.role, item.description].filter(Boolean).join(" "));
      parts.push(item.bullets.join(" "));
    } else if (isSimple(item)) {
      parts.push([item.title, item.subtitle, item.date, item.description].filter(Boolean).join(" "));
    }
  }
  return parts.filter(Boolean).join("\n");
}

export function resumeToText(r: Resume): string {
  const h = r.header;
  const head = [h.fullName, h.headline, h.email, h.phone, h.location, h.website, h.linkedin, h.github]
    .filter(Boolean)
    .join(" | ");
  return [head, ...r.sections.filter((s) => s.visible).map(sectionToText)].join("\n\n");
}

export function allBullets(r: Resume): string[] {
  const out: string[] = [];
  for (const s of r.sections) {
    if (!s.visible) continue;
    for (const item of s.items ?? []) {
      if (isExperience(item) || isProject(item)) out.push(...item.bullets);
    }
    if (s.bullets) out.push(...s.bullets);
  }
  return out.filter((b) => b.trim().length > 0);
}

export function wordCount(text: string) {
  return text.split(/\s+/).filter(Boolean).length;
}

export function estimatePages(r: Resume) {
  const words = wordCount(resumeToText(r));
  return Math.max(1, Math.ceil(words / 520));
}

const STOP = new Set(
  `a an and the or of to in for with on at by from as is are be been was were will would can could should you your our we they this that those these it its their his her not have has had do does did but if then than so such into over under more most other into per via using use used etc including include includes across within about up down out off all any each few many much some only own same too very just also may might must shall who whom which what when where why how`.split(
    /\s+/,
  ),
);

export function keywords(text: string, limit = 60): string[] {
  const counts = new Map<string, number>();
  for (const raw of text.toLowerCase().match(/[a-z][a-z+#.\-/]{1,}/g) ?? []) {
    const w = raw.replace(/[.\-/]+$/, "");
    if (w.length < 3 || STOP.has(w)) continue;
    counts.set(w, (counts.get(w) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([w]) => w);
}

export function downloadFile(name: string, content: string, type = "text/plain") {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}
