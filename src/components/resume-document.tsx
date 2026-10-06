import type { CSSProperties } from "react";
import type { Resume, ResumeSection } from "@/lib/types";
import {
  dateRange,
  isEducation,
  isExperience,
  isProject,
  isSimple,
  isSkillGroup,
} from "@/lib/resume-utils";
import { contactRows, safeHref } from "@/lib/header";

interface Variant {
  serif?: boolean;
  twoColumn?: boolean;
  sidebarTint?: boolean;
  nameSize: number;
  nameCaps?: boolean;
  headingCaps?: boolean;
  headingRule?: "none" | "line" | "bar" | "block";
  headerAlign?: "left" | "center";
  accentName?: boolean;
  /** put the side column on the right instead of the left */
  sidebarRight?: boolean;
  /** section kinds placed in the side column (defaults to SIDEBAR_KINDS) */
  sidebarKinds?: string[];
}

const VARIANTS: Record<string, Variant> = {
  atlas: { nameSize: 22, headingCaps: true, headingRule: "line" },
  meridian: { nameSize: 26, headingRule: "bar", accentName: true },
  quartz: { nameSize: 20, headingCaps: true, headingRule: "none", headerAlign: "center" },
  harbor: { nameSize: 24, headingCaps: true, headingRule: "line", serif: false },
  summit: { nameSize: 32, nameCaps: true, headingRule: "line", headerAlign: "center" },
  prism: { nameSize: 26, headingRule: "block", twoColumn: true, sidebarTint: true, accentName: true },
  lyceum: { nameSize: 24, serif: true, headingCaps: true, headingRule: "line", headerAlign: "center" },
  circuit: { nameSize: 22, headingRule: "bar", headingCaps: true },
  campus: { nameSize: 23, headingRule: "line" },
  ledger: { nameSize: 24, twoColumn: true, headingCaps: true, headingRule: "line" },
  classic: { nameSize: 20, headingCaps: true, headingRule: "line" },
  duo: {
    nameSize: 24,
    twoColumn: true,
    sidebarRight: true,
    headingCaps: true,
    headingRule: "bar",
    accentName: true,
    sidebarKinds: ["skills", "education", "achievements", "awards", "certifications", "languages", "interests", "courses"],
  },
  elegant: { nameSize: 26, serif: true, twoColumn: true, sidebarRight: true, sidebarTint: true, headingRule: "line", headerAlign: "center" },
};

const SIDEBAR_KINDS = new Set(["skills", "languages", "certifications", "interests", "courses"]);

export function ResumeDocument({ resume, scale = 1 }: { resume: Resume; scale?: number }) {
  const d = resume.design;
  const v = (VARIANTS[d.template] ?? VARIANTS["atlas"]) as Variant;
  const accent = d.accent;

  const pageStyle: CSSProperties = {
    fontFamily: v.serif ? "Georgia, 'Times New Roman', serif" : d.fontFamily,
    fontSize: `${d.fontSize}pt`,
    lineHeight: d.lineHeight,
    padding: `${d.margin}mm`,
    transform: scale === 1 ? undefined : `scale(${scale})`,
    transformOrigin: "top left",
  };

  const visible = resume.sections.filter((s) => s.visible);
  const side = new Set(v.sidebarKinds ?? SIDEBAR_KINDS);
  const sidebar = v.twoColumn ? visible.filter((s) => side.has(s.kind)) : [];
  const main = v.twoColumn ? visible.filter((s) => !side.has(s.kind)) : visible;

  return (
    <div
      className={`doc-page ${d.pageSize === "Letter" ? "letter" : ""}`}
      style={pageStyle}
      data-resume-page
    >
      <Header resume={resume} v={v} accent={accent} />
      {v.twoColumn ? (
        <div className={`mt-4 flex gap-5 ${v.sidebarRight ? "flex-row-reverse" : ""}`}>
          <div
            className="w-[34%] shrink-0"
            style={
              v.sidebarTint
                ? { background: `${accent}10`, padding: "10px", borderRadius: 6 }
                : v.sidebarRight
                  ? { borderLeft: `1px solid ${accent}33`, paddingLeft: 14 }
                  : { borderRight: `1px solid ${accent}33`, paddingRight: 14 }
            }
          >
            {sidebar.map((s) => (
              <Section key={s.id} section={s} v={v} accent={accent} gap={d.sectionSpacing} compact />
            ))}
          </div>
          <div className="min-w-0 flex-1">
            {main.map((s) => (
              <Section key={s.id} section={s} v={v} accent={accent} gap={d.sectionSpacing} />
            ))}
          </div>
        </div>
      ) : (
        <div className="mt-3">
          {main.map((s) => (
            <Section key={s.id} section={s} v={v} accent={accent} gap={d.sectionSpacing} />
          ))}
        </div>
      )}
    </div>
  );
}

function Header({ resume, v, accent }: { resume: Resume; v: Variant; accent: string }) {
  const h = resume.header;
  const rows = contactRows(h);
  return (
    <header style={{ textAlign: v.headerAlign ?? "left", position: "relative" }}>
      {resume.design.showPhoto && h.photo ? (
        <img
          src={h.photo}
          alt=""
          style={{
            width: 64,
            height: 64,
            borderRadius: "50%",
            objectFit: "cover",
            float: v.headerAlign === "center" ? "none" : "right",
            margin: v.headerAlign === "center" ? "0 auto 6px" : "0 0 4px 10px",
            display: "block",
          }}
        />
      ) : null}
      <div
        style={{
          fontSize: `${v.nameSize}pt`,
          fontWeight: 700,
          letterSpacing: v.nameCaps ? "0.12em" : "-0.01em",
          textTransform: v.nameCaps ? "uppercase" : "none",
          color: v.accentName ? accent : "#10151f",
          lineHeight: 1.1,
        }}
      >
        {h.fullName || "Your Name"}
      </div>
      {h.headline ? (
        <div style={{ marginTop: 2, fontSize: "1.05em", color: "#414b5c" }}>{h.headline}</div>
      ) : null}
      {rows.map((row, ri) => (
        <div
          key={ri}
          style={{
            marginTop: ri === 0 ? 5 : 1,
            fontSize: "0.86em",
            color: "#4a5568",
            display: "flex",
            flexWrap: "wrap",
            columnGap: 0,
            rowGap: 2,
            justifyContent: v.headerAlign === "center" ? "center" : "flex-start",
          }}
        >
          {row.map((c, i) => {
            const href = safeHref(c.url);
            return (
              <span key={c.id}>
                {i > 0 ? <span style={{ whiteSpace: "pre", color: "#9aa3b2" }}>{"  |  "}</span> : null}
                {href ? (
                  <a href={href} target="_blank" rel="noopener noreferrer" style={{ color: "inherit", textDecoration: "none" }}>
                    {c.value}
                  </a>
                ) : (
                  c.value
                )}
              </span>
            );
          })}
        </div>
      ))}
      <div style={{ marginTop: 8, height: 2, background: accent, opacity: 0.85 }} />
    </header>
  );
}

function Heading({
  title,
  v,
  accent,
}: {
  title: string;
  v: Variant;
  accent: string;
}) {
  const base: CSSProperties = {
    fontSize: "1.02em",
    fontWeight: 700,
    textTransform: v.headingCaps ? "uppercase" : "none",
    letterSpacing: v.headingCaps ? "0.08em" : "0",
    marginBottom: 4,
    color: "#10151f",
  };
  if (v.headingRule === "bar")
    return (
      <div style={{ ...base, borderLeft: `3px solid ${accent}`, paddingLeft: 7 }}>{title}</div>
    );
  if (v.headingRule === "block")
    return (
      <div
        style={{
          ...base,
          background: accent,
          color: "#fff",
          padding: "2px 7px",
          borderRadius: 3,
        }}
      >
        {title}
      </div>
    );
  if (v.headingRule === "line")
    return (
      <div style={{ ...base, borderBottom: `1px solid ${accent}66`, paddingBottom: 2 }}>
        {title}
      </div>
    );
  return <div style={{ ...base, color: accent }}>{title}</div>;
}

function Section({
  section,
  v,
  accent,
  gap,
  compact,
}: {
  section: ResumeSection;
  v: Variant;
  accent: string;
  gap: number;
  compact?: boolean;
}) {
  const hasContent =
    !!section.text?.trim() || (section.items?.length ?? 0) > 0 || (section.bullets?.length ?? 0) > 0;
  if (!hasContent) return null;

  return (
    <section style={{ marginTop: gap }}>
      <Heading title={section.title} v={v} accent={accent} />
      {section.text ? (
        <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{section.text}</p>
      ) : null}
      {section.bullets?.length ? (
        <p style={{ margin: 0 }}>{section.bullets.join(" · ")}</p>
      ) : null}

      {(section.items ?? []).map((item) => {
        if (isSkillGroup(item)) {
          return (
            <div key={item.id} style={{ marginTop: 3 }}>
              {compact ? (
                <>
                  <div style={{ fontWeight: 600 }}>
                    {item.label}
                    {item.proficiency ? <span style={{ fontWeight: 400, color: "#5b6478" }}> · {item.proficiency}</span> : null}
                  </div>
                  <div style={{ color: "#3b4557" }}>{item.items.join(", ")}</div>
                </>
              ) : (
                <div>
                  <span style={{ fontWeight: 600 }}>{item.label}: </span>
                  <span>{item.items.join(", ")}</span>
                  {item.proficiency ? <span style={{ color: "#5b6478" }}> ({item.proficiency})</span> : null}
                </div>
              )}
            </div>
          );
        }
        if (isExperience(item)) {
          return (
            <div key={item.id} className="doc-entry" style={{ marginTop: 6 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                <span style={{ fontWeight: 700 }}>{item.role || "Role"}</span>
                <span style={{ color: "#5b6478", whiteSpace: "nowrap", fontSize: "0.9em" }}>
                  {dateRange(item.start, item.end, item.current)}
                </span>
              </div>
              <div style={{ color: "#41506a", fontSize: "0.94em" }}>
                {[item.company, item.location].filter(Boolean).join(" · ")}
              </div>
              {item.description ? <div style={{ fontSize: "0.95em", marginTop: 2 }}>{item.description}</div> : null}
              {item.bullets.filter(Boolean).length ? (
                <ul style={{ margin: "3px 0 0", paddingLeft: 16 }}>
                  {item.bullets.filter(Boolean).map((b, i) => (
                    <li key={i} style={{ marginTop: 1 }}>
                      {b}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          );
        }
        if (isEducation(item)) {
          return (
            <div key={item.id} className="doc-entry" style={{ marginTop: 6 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                <span style={{ fontWeight: 700 }}>
                  {[item.degree || "Qualification", item.field].filter(Boolean).join(", ")}
                </span>
                <span style={{ whiteSpace: "nowrap", fontSize: "0.9em", color: "#5b6478" }}>
                  {dateRange(item.start, item.end)}
                </span>
              </div>
              <div style={{ color: "#41506a", fontSize: "0.94em" }}>
                {[item.school, item.location].filter(Boolean).join(" · ")}
              </div>
              {item.details ? <div style={{ fontSize: "0.94em" }}>{item.details}</div> : null}
              {item.description ? <div style={{ fontSize: "0.94em" }}>{item.description}</div> : null}
            </div>
          );
        }
        if (isProject(item)) {
          return (
            <div key={item.id} className="doc-entry" style={{ marginTop: 6 }}>
              <div style={{ fontWeight: 700 }}>
                {item.name}
                {item.role ? ` — ${item.role}` : ""}
              </div>
              {item.url ? <div style={{ fontSize: "0.88em", color: "#41506a" }}>{item.url}</div> : null}
              {item.description ? <div style={{ fontSize: "0.95em" }}>{item.description}</div> : null}
              {item.technologies?.length ? (
                <div style={{ fontSize: "0.9em", color: "#41506a" }}>
                  <span style={{ fontWeight: 600 }}>Technologies: </span>
                  {item.technologies.join(", ")}
                </div>
              ) : null}
              {item.bullets.filter(Boolean).length ? (
                <ul style={{ margin: "3px 0 0", paddingLeft: 16 }}>
                  {item.bullets.filter(Boolean).map((b, i) => (
                    <li key={i}>{b}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          );
        }
        if (isSimple(item)) {
          return (
            <div key={item.id} style={{ marginTop: 4 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                <span style={{ fontWeight: 600 }}>{item.title}</span>
                {item.date ? (
                  <span style={{ fontSize: "0.9em", whiteSpace: "nowrap" }}>{item.date}</span>
                ) : null}
              </div>
              {item.subtitle ? <div style={{ fontSize: "0.94em", color: "#41506a" }}>{item.subtitle}</div> : null}
              {item.description ? <div style={{ fontSize: "0.94em" }}>{item.description}</div> : null}
            </div>
          );
        }
        return null;
      })}
    </section>
  );
}
