import type { CareerProfile, HeaderContactItem, ResumeHeader } from "./types";

const newId = () => `c${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

/** Presets offered by the "Add field" control. `custom` lets the user name anything. */
export const CONTACT_PRESETS: { type: string; label: string; link: boolean; row: number }[] = [
  { type: "email", label: "Email", link: false, row: 1 },
  { type: "phone", label: "Phone", link: false, row: 1 },
  { type: "location", label: "Location", link: false, row: 1 },
  { type: "website", label: "Website", link: true, row: 2 },
  { type: "portfolio", label: "Portfolio", link: true, row: 2 },
  { type: "linkedin", label: "LinkedIn", link: true, row: 2 },
  { type: "github", label: "GitHub", link: true, row: 2 },
  { type: "leetcode", label: "LeetCode", link: true, row: 2 },
  { type: "kaggle", label: "Kaggle", link: true, row: 2 },
  { type: "twitter", label: "X / Twitter", link: true, row: 2 },
  { type: "behance", label: "Behance", link: true, row: 2 },
  { type: "dribbble", label: "Dribbble", link: true, row: 2 },
  { type: "custom-link", label: "Custom link", link: true, row: 2 },
  { type: "custom", label: "Custom text", link: false, row: 1 },
];

export function makeContact(
  type: string,
  value = "",
  url?: string,
  overrides: Partial<HeaderContactItem> = {},
): HeaderContactItem {
  const preset = CONTACT_PRESETS.find((p) => p.type === type);
  const item: HeaderContactItem = {
    id: newId(),
    type,
    label: preset && !type.startsWith("custom") ? preset.label : "",
    value,
    visible: true,
    row: preset?.row ?? 1,
    ...overrides,
  };
  if (url) item.url = url;
  return item;
}

/** Turn "github.com/me" into "https://github.com/me"; leave full URLs alone. */
export function toUrl(value: string): string {
  const v = value.trim();
  if (!v) return "";
  if (/^(https?:|mailto:|tel:)/i.test(v)) return v;
  return `https://${v.replace(/^\/+/, "")}`;
}

/** Only http(s), mailto and tel links are rendered as anchors. */
export function safeHref(url?: string): string | null {
  if (!url?.trim()) return null;
  const u = toUrl(url);
  return /^(https?:\/\/|mailto:|tel:)/i.test(u) ? u : null;
}

type LegacyFields = {
  email?: unknown;
  phone?: unknown;
  location?: unknown;
  website?: unknown;
  linkedin?: unknown;
  github?: unknown;
};

const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");

/** Build contact items from the old fixed fields (also used for the profile). */
export function legacyToContacts(src: LegacyFields): HeaderContactItem[] {
  const out: HeaderContactItem[] = [];
  const email = str(src.email);
  const phone = str(src.phone);
  const location = str(src.location);
  const website = str(src.website);
  const linkedin = str(src.linkedin);
  const github = str(src.github);
  if (email) out.push(makeContact("email", email));
  if (phone) out.push(makeContact("phone", phone));
  if (location) out.push(makeContact("location", location));
  if (website) out.push(makeContact("portfolio", website, toUrl(website)));
  if (linkedin) out.push(makeContact("linkedin", linkedin, toUrl(linkedin)));
  if (github) out.push(makeContact("github", github, toUrl(github)));
  return out;
}

function sanitizeItem(raw: unknown): HeaderContactItem | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const item: HeaderContactItem = {
    id: str(r["id"]) || newId(),
    type: str(r["type"]) || "custom",
    label: typeof r["label"] === "string" ? r["label"] : "",
    value: typeof r["value"] === "string" ? r["value"] : "",
    visible: r["visible"] !== false,
    row: typeof r["row"] === "number" && r["row"] >= 1 ? Math.floor(r["row"]) : 1,
  };
  if (typeof r["url"] === "string" && r["url"].trim()) item.url = r["url"];
  return item;
}

/** Contact items for a header, migrating old fixed-field headers on the fly. */
export function getContacts(header: Partial<ResumeHeader> | undefined | null): HeaderContactItem[] {
  if (!header) return [];
  if (Array.isArray(header.contacts)) {
    return header.contacts.map(sanitizeItem).filter((x): x is HeaderContactItem => !!x);
  }
  return legacyToContacts(header as LegacyFields);
}

/** Normalise any stored header (old or new format) into the current shape. */
export function normalizeHeader(raw: unknown): ResumeHeader {
  const h = (raw && typeof raw === "object" ? raw : {}) as Partial<ResumeHeader>;
  const out: ResumeHeader = {
    fullName: str(h.fullName) ? String(h.fullName) : "",
    headline: typeof h.headline === "string" ? h.headline : "",
    contacts: getContacts(h),
  };
  if (typeof h.photo === "string" && h.photo) out.photo = h.photo;
  return out;
}

export function headerFromProfile(p: CareerProfile): ResumeHeader {
  const h: ResumeHeader = {
    fullName: p.fullName,
    headline: p.headline,
    contacts: legacyToContacts(p),
  };
  if (p.photo) h.photo = p.photo;
  return h;
}

/** Visible, non-empty items grouped by row (rows renumbered in order). */
export function contactRows(header: ResumeHeader): HeaderContactItem[][] {
  const visible = getContacts(header).filter((c) => c.visible && c.value.trim());
  const rows = [...new Set(visible.map((c) => c.row))].sort((a, b) => a - b);
  return rows.map((row) => visible.filter((c) => c.row === row));
}

/** First visible value of a given type (used by the analyzer). */
export function contactValue(header: ResumeHeader, type: string): string {
  return getContacts(header).find((c) => c.type === type && c.visible && c.value.trim())?.value.trim() ?? "";
}

/** Plain-text header lines for TXT export and AI prompts. */
export function contactText(header: ResumeHeader): string[] {
  return contactRows(header).map((row) =>
    row
      .map((c) => {
        const href = safeHref(c.url);
        const shown = c.value.trim();
        return href && !shown.includes(href.replace(/^https?:\/\//, "")) ? `${shown}: ${href.replace(/^mailto:|^tel:/, "")}` : shown;
      })
      .join(" | "),
  );
}
