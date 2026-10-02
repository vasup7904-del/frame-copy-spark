import { blankResume, uid } from "./defaults";
import { getData, setData } from "./store";
import type { Resume } from "./types";

/** Create a new structured resume, prefilled from the career profile header. */
export function createResume(): Resume {
  const d = getData();
  const p = d.profile;
  const r = blankResume(`Resume ${d.resumes.length + 1}`);
  r.design.template = d.settings.defaultTemplate || r.design.template;
  r.design.pageSize = d.settings.defaultPageSize || r.design.pageSize;
  r.header = {
    fullName: p.fullName,
    headline: p.headline,
    email: p.email,
    phone: p.phone,
    location: p.location,
    website: p.website,
    linkedin: p.linkedin,
    github: p.github,
    photo: p.photo,
  };
  setData((s) => ({ ...s, resumes: [r, ...s.resumes] }));
  return r;
}

/** Deep copy with fresh ids so editing the copy never touches the original. */
export function duplicateResume(id: string): Resume | null {
  const src = getData().resumes.find((r) => r.id === id);
  if (!src) return null;
  const copy: Resume = structuredClone(src);
  const now = Date.now();
  copy.id = uid();
  copy.name = `${src.name} (copy)`;
  copy.parentId = src.id;
  copy.createdAt = now;
  copy.updatedAt = now;
  copy.sections = copy.sections.map((s) => ({
    ...s,
    id: uid(),
    items: s.items?.map((i) => ({ ...i, id: uid() })),
  }));
  setData((s) => ({ ...s, resumes: [copy, ...s.resumes] }));
  return copy;
}

export function renameResume(id: string, name: string) {
  const clean = name.trim();
  if (!clean) return;
  setData((s) => ({
    ...s,
    resumes: s.resumes.map((r) => (r.id === id ? { ...r, name: clean, updatedAt: Date.now() } : r)),
  }));
}

export function deleteResume(id: string) {
  setData((s) => ({ ...s, resumes: s.resumes.filter((r) => r.id !== id) }));
}
