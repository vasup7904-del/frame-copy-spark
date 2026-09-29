import { TEMPLATES } from "./defaults";
import {
  allBullets,
  isEducation,
  isExperience,
  isSkillGroup,
  keywords,
  resumeToText,
  wordCount,
} from "./resume-utils";
import type { Resume } from "./types";

export type Severity = "pass" | "warn" | "fail";
export type Category = "ATS" | "Formatting" | "Content" | "Keywords" | "Readability" | "Structure";

export interface CheckResult {
  id: string;
  label: string;
  category: Category;
  severity: Severity;
  what: string;
  why: string;
  how: string;
}

export interface AtsReport {
  checks: CheckResult[];
  scores: {
    overall: number;
    ats: number;
    content: number;
    formatting: number;
    keyword: number;
    readability: number;
  };
  matched: string[];
  missing: string[];
}

const ACTION_VERBS = `led built shipped launched designed created developed implemented improved increased reduced cut drove owned managed delivered automated migrated scaled optimized architected mentored coordinated negotiated launched analyzed streamlined established founded refactored resolved standardized`.split(
  /\s+/,
);

const WEAK = [
  "responsible for",
  "worked on",
  "helped with",
  "duties included",
  "tasked with",
  "assisted in",
  "various tasks",
];

const STANDARD_HEADINGS = [
  "professional summary",
  "summary",
  "work experience",
  "experience",
  "education",
  "skills",
  "projects",
  "certifications",
];

export function analyzeResume(resume: Resume, jobDescription?: string): AtsReport {
  const text = resumeToText(resume);
  const lower = text.toLowerCase();
  const bullets = allBullets(resume);
  const words = wordCount(text);
  const checks: CheckResult[] = [];

  const add = (
    id: string,
    label: string,
    category: Category,
    ok: boolean | "warn",
    what: string,
    why: string,
    how: string,
  ) =>
    checks.push({
      id,
      label,
      category,
      severity: ok === true ? "pass" : ok === "warn" ? "warn" : "fail",
      what,
      why,
      how,
    });

  const visible = resume.sections.filter((s) => s.visible);
  const kinds = new Set(visible.map((s) => s.kind));
  const experience = visible.flatMap((s) => (s.items ?? []).filter(isExperience));
  const education = visible.flatMap((s) => (s.items ?? []).filter(isEducation));
  const skillGroups = visible.flatMap((s) => (s.items ?? []).filter(isSkillGroup));
  const skillList = skillGroups.flatMap((g) => g.items);
  const template = TEMPLATES.find((t) => t.id === resume.design.template);

  // --- Contact information
  add("name", "Name present", "ATS", !!resume.header.fullName.trim(),
    "The resume header has no full name.", "Parsers use the header to identify the candidate.", "Add your full name in the resume header.");
  add("email", "Email address", "ATS", /\S+@\S+\.\S+/.test(resume.header.email),
    "No valid email address found.", "Recruiters and systems need a reachable email.", "Add a professional email in the header.");
  add("phone", "Phone number", "ATS", /\d{6,}/.test(resume.header.phone.replace(/\D/g, "")),
    "No phone number found.", "Many employers phone-screen before emailing.", "Add a phone number with country code.");
  add("location", "Location", "Content", !!resume.header.location.trim() ? true : "warn",
    "No city or region listed.", "Location filters are common in applicant tracking systems.", "Add at least a city and country.");
  add("links", "Professional links", "Content",
    !!(resume.header.linkedin || resume.header.website || resume.header.github) ? true : "warn",
    "No LinkedIn, portfolio or GitHub link.", "Links let reviewers verify your work.", "Add one or more profile links.");

  // --- Structure
  add("summary", "Summary section", "Structure", kinds.has("summary") ? true : "warn",
    "No professional summary section.", "A summary frames your positioning in three lines.", "Add a short summary near the top.");
  add("experience", "Experience section", "Structure", kinds.has("experience") && experience.length > 0,
    "No work experience entries.", "Experience is the primary screening signal.", "Add at least one role with dates and bullets.");
  add("education", "Education section", "Structure", kinds.has("education") && education.length > 0 ? true : "warn",
    "No education entries.", "Many roles filter on education fields.", "Add your highest qualification.");
  add("skills", "Skills section", "Structure", skillList.length >= 5,
    `Only ${skillList.length} skills listed.`, "Skill keywords drive most automated matching.", "List at least 8–12 relevant skills.");
  add("headings", "Standard headings", "ATS",
    visible.every((s) => s.kind === "custom" ? true : STANDARD_HEADINGS.includes(s.title.toLowerCase()) || s.kind !== "custom"),
    "Some section headings are non-standard.", "Parsers map standard headings to fields.", "Use conventional names such as 'Work Experience'.");
  add("order", "Section ordering", "Structure",
    visible[0]?.kind === "summary" || visible[0]?.kind === "experience" ? true : "warn",
    "The first section is neither a summary nor experience.", "Reviewers scan the top third of page one.", "Move summary or experience to the top.");

  // --- Formatting
  add("columns", "Single-column layout", "Formatting", template?.columns === 1 ? true : "warn",
    "This template uses two columns.", "Some parsers read multi-column text out of order.", "Switch to a single-column template for ATS submissions.");
  add("graphics", "No graphics or icons", "ATS", !resume.design.showPhoto,
    "A photo is enabled on the resume.", "Images are ignored or break parsing in many systems.", "Turn the photo off for ATS submissions.");
  add("tables", "No tables used", "Formatting", true,
    "No table layouts detected.", "Tables scramble reading order in parsers.", "Keep content in plain paragraphs and lists.");
  add("font", "ATS-safe font", "Formatting",
    /Inter|Arial|Georgia|Times|Helvetica|Calibri/i.test(resume.design.fontFamily),
    "The selected font is unusual for document parsing.", "Uncommon fonts can embed badly in PDFs.", "Choose Inter, Arial, Georgia or Times New Roman.");
  add("fontsize", "Readable font size", "Formatting", resume.design.fontSize >= 9.5 && resume.design.fontSize <= 12,
    `Font size is ${resume.design.fontSize}pt.`, "Too small is unreadable; too large wastes the page.", "Keep body text between 10 and 12pt.");
  add("margins", "Adequate margins", "Formatting", resume.design.margin >= 10,
    "Margins are very tight.", "Content can be clipped when printed.", "Use margins of at least 12mm.");
  add("linespacing", "Line spacing", "Formatting", resume.design.lineHeight >= 1.2 && resume.design.lineHeight <= 1.8,
    "Line spacing is outside a comfortable range.", "Cramped or loose text hurts scanning.", "Use line spacing between 1.2 and 1.6.");
  add("format", "Export format", "ATS", true,
    "Export produces a text-selectable PDF.", "Image-only PDFs cannot be parsed at all.", "Always export via the built-in PDF export.");

  // --- Content quality
  add("bullets", "Bullets present", "Content", bullets.length >= 5,
    `Only ${bullets.length} bullet points across the resume.`, "Bullets carry your evidence.", "Add 3–5 bullets per recent role.");
  const longBullets = bullets.filter((b) => wordCount(b) > 34).length;
  add("bulletlength", "Bullet length", "Readability", longBullets === 0 ? true : "warn",
    `${longBullets} bullets are longer than 34 words.`, "Long bullets get skimmed and skipped.", "Split long bullets into two focused lines.");
  const verbStart = bullets.filter((b) => ACTION_VERBS.includes(b.trim().split(/\s+/)[0]?.toLowerCase() ?? "")).length;
  add("actionverbs", "Action verbs", "Content",
    bullets.length === 0 ? false : verbStart / bullets.length >= 0.6 ? true : "warn",
    `${verbStart} of ${bullets.length} bullets start with a strong verb.`, "Verb-first bullets read as ownership, not duties.", "Start each bullet with a verb such as Led, Built, Reduced.");
  const quantified = bullets.filter((b) => /\d/.test(b)).length;
  add("quantification", "Quantified impact", "Content",
    bullets.length === 0 ? false : quantified / bullets.length >= 0.4 ? true : "warn",
    `${quantified} of ${bullets.length} bullets contain a number.`, "Numbers make impact verifiable.", "Add scale, percentage, money or time saved where you know it.");
  const weakFound = WEAK.filter((w) => lower.includes(w));
  add("weakphrases", "No filler phrasing", "Content", weakFound.length === 0,
    weakFound.length ? `Found filler phrasing: ${weakFound.join(", ")}.` : "No filler phrasing found.",
    "Phrases like 'responsible for' describe duties, not results.", "Rewrite as an action plus an outcome.");
  const firstPerson = /\b(i|me|my|myself)\b/i.test(lower);
  add("tone", "Professional tone", "Content", !firstPerson,
    firstPerson ? "First-person pronouns found." : "Tone reads professional.",
    "Resumes conventionally omit 'I' and 'my'.", "Drop pronouns and start with the verb.");
  const dupes = new Set<string>();
  const seen = new Set<string>();
  bullets.forEach((b) => {
    const k = b.toLowerCase().slice(0, 40);
    if (seen.has(k)) dupes.add(k);
    seen.add(k);
  });
  add("repetition", "No repeated bullets", "Content", dupes.size === 0,
    dupes.size ? `${dupes.size} bullets repeat almost identically.` : "No repeated bullets.",
    "Repetition wastes limited space.", "Merge duplicates or vary the evidence.");

  // --- Consistency, progression, red flags
  const datedRoles = experience.filter((e) => e.start);
  add("dates", "Dates on every role", "Structure",
    experience.length > 0 && datedRoles.length === experience.length,
    "Some roles are missing a start date.", "Missing dates read as a gap or an error.", "Add start and end dates to every role.");
  const years = experience
    .map((e) => parseInt((e.start ?? "").match(/\d{4}/)?.[0] ?? "0", 10))
    .filter(Boolean)
    .sort((a, b) => b - a);
  const gaps = years.filter((y, i) => i > 0 && years[i - 1] - y > 2).length;
  add("gaps", "No large unexplained gaps", "Content", gaps === 0 ? true : "warn",
    gaps ? `${gaps} gap(s) of more than two years between roles.` : "No large gaps detected.",
    "Unexplained gaps prompt questions in screening.", "Add a short line covering study, caring or contract work.");
  add("progression", "Career progression visible", "Content", experience.length >= 2 ? true : "warn",
    experience.length < 2 ? "Only one role listed." : "Multiple roles show progression.",
    "Reviewers look for growth over time.", "Include earlier roles even briefly.");
  add("consistency", "Consistent bullet punctuation", "Formatting",
    bullets.length === 0 || bullets.every((b) => b.trim().endsWith(".")) || bullets.every((b) => !b.trim().endsWith(".")) ? true : "warn",
    "Bullet punctuation is inconsistent.", "Inconsistency reads as carelessness.", "End every bullet the same way.");
  add("length", "Resume length", "Readability",
    words >= 250 && words <= 900 ? true : "warn",
    `Resume is about ${words} words.`, "Under 250 words looks thin; over 900 usually exceeds two pages.", "Aim for 350–750 words for most roles.");
  add("headline", "Headline present", "Content", !!resume.header.headline.trim() ? true : "warn",
    "No professional headline.", "A headline tells the reader the role you are targeting.", "Add a headline like 'Senior Data Analyst'.");
  add("empties", "No empty sections", "Structure",
    visible.every((s) => (s.items?.length ?? 0) > 0 || !!s.text?.trim() || (s.bullets?.length ?? 0) > 0),
    "One or more visible sections are empty.", "Empty headings look unfinished.", "Fill or hide empty sections.");
  add("filename", "Descriptive resume name", "Content", resume.name.trim().length > 3 && resume.name !== "Untitled resume",
    "The resume is still named 'Untitled resume'.", "File names are visible to recruiters.", "Rename it to Name – Role.");

  // --- Keyword coverage
  let matched: string[] = [];
  let missing: string[] = [];
  if (jobDescription && jobDescription.trim().length > 40) {
    const jdWords = keywords(jobDescription, 45);
    matched = jdWords.filter((w) => lower.includes(w));
    missing = jdWords.filter((w) => !lower.includes(w));
    const ratio = jdWords.length ? matched.length / jdWords.length : 0;
    add("keywords", "Job keyword coverage", "Keywords", ratio >= 0.6 ? true : ratio >= 0.35 ? "warn" : false,
      `${matched.length} of ${jdWords.length} job keywords appear in the resume.`,
      "Automated matching ranks on overlap with the posting.",
      "Work genuinely relevant missing terms into existing bullets and skills.");
    add("jdskills", "Skills overlap with posting", "Keywords",
      skillList.some((s) => jdWords.includes(s.toLowerCase())) ? true : "warn",
      "Few of your listed skills appear in the posting.", "Skill sections are parsed separately by many systems.",
      "Reorder your skills so posting-relevant ones come first.");
  } else {
    add("keywords", "Job keyword coverage", "Keywords", "warn",
      "No job description attached.", "Keyword scoring needs a target posting.", "Paste a job description in Job Tailoring to score keywords.");
    add("jdskills", "Skills overlap with posting", "Keywords", "warn",
      "No posting to compare skills against.", "Tailored resumes outperform generic ones.", "Attach a job description to compare.");
  }

  const score = (cats: Category[]) => {
    const subset = checks.filter((c) => cats.includes(c.category));
    if (!subset.length) return 0;
    const pts = subset.reduce((a, c) => a + (c.severity === "pass" ? 1 : c.severity === "warn" ? 0.5 : 0), 0);
    return Math.round((pts / subset.length) * 100);
  };

  const scores = {
    ats: score(["ATS"]),
    formatting: score(["Formatting"]),
    content: score(["Content", "Structure"]),
    keyword: score(["Keywords"]),
    readability: score(["Readability"]),
    overall: 0,
  };
  scores.overall = Math.round(
    scores.ats * 0.3 + scores.content * 0.3 + scores.formatting * 0.15 + scores.keyword * 0.15 + scores.readability * 0.1,
  );

  return { checks, scores, matched, missing };
}
