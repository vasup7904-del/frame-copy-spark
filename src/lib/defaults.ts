import type {
  AppData,
  CareerProfile,
  Resume,
  ResumeDesign,
  ResumeSection,
  SectionKind,
} from "./types";

export const uid = () =>
  `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

export const emptyProfile = (): CareerProfile => ({
  fullName: "",
  headline: "",
  email: "",
  phone: "",
  location: "",
  website: "",
  linkedin: "",
  github: "",
  summary: "",
  links: [],
  experience: [],
  education: [],
  skills: [],
  projects: [],
  certifications: [],
  achievements: [],
  awards: [],
  languages: [],
  volunteer: [],
  publications: [],
  courses: [],
  organizations: [],
  interests: [],
});

export const TEMPLATES: {
  id: string;
  name: string;
  category: string;
  description: string;
  atsSafe: boolean;
  columns: 1 | 2;
}[] = [
  { id: "atlas", name: "Atlas", category: "ATS", description: "Single column, standard headings, zero graphics.", atsSafe: true, columns: 1 },
  { id: "meridian", name: "Meridian", category: "Modern", description: "Accent rule headings with airy spacing.", atsSafe: true, columns: 1 },
  { id: "quartz", name: "Quartz", category: "Minimal", description: "Quiet type, generous white space.", atsSafe: true, columns: 1 },
  { id: "harbor", name: "Harbor", category: "Professional", description: "Classic corporate layout with clear hierarchy.", atsSafe: true, columns: 1 },
  { id: "summit", name: "Summit", category: "Executive", description: "Bold name block for senior leadership profiles.", atsSafe: true, columns: 1 },
  { id: "prism", name: "Prism", category: "Creative", description: "Colour-banded headings with a tinted sidebar.", atsSafe: false, columns: 2 },
  { id: "lyceum", name: "Lyceum", category: "Academic", description: "Serif type for publications and research.", atsSafe: true, columns: 1 },
  { id: "circuit", name: "Circuit", category: "Technical", description: "Dense skills matrix for engineering roles.", atsSafe: true, columns: 1 },
  { id: "campus", name: "Campus", category: "Student", description: "Education-first order for early careers.", atsSafe: true, columns: 1 },
  { id: "ledger", name: "Ledger", category: "Two-column", description: "Sidebar for contact and skills, main column for history.", atsSafe: false, columns: 2 },
];

export const FONT_OPTIONS = [
  { id: "Inter, sans-serif", label: "Inter" },
  { id: "'Space Grotesk', sans-serif", label: "Space Grotesk" },
  { id: "Georgia, 'Times New Roman', serif", label: "Georgia" },
  { id: "'Times New Roman', Times, serif", label: "Times New Roman" },
  { id: "Arial, Helvetica, sans-serif", label: "Arial" },
  { id: "'Courier New', monospace", label: "Courier New" },
];

export const defaultDesign = (): ResumeDesign => ({
  template: "atlas",
  fontFamily: "Inter, sans-serif",
  fontSize: 10.5,
  lineHeight: 1.45,
  accent: "#4f46e5",
  margin: 16,
  sectionSpacing: 14,
  headingStyle: "bar",
  pageSize: "A4",
  showPhoto: false,
});

export const SECTION_LABELS: Record<SectionKind, string> = {
  summary: "Professional Summary",
  experience: "Work Experience",
  education: "Education",
  skills: "Skills",
  projects: "Projects",
  certifications: "Certifications",
  achievements: "Achievements",
  awards: "Awards",
  languages: "Languages",
  volunteer: "Volunteer Experience",
  publications: "Publications",
  courses: "Courses",
  organizations: "Organizations",
  interests: "Interests",
  references: "References",
  custom: "Custom Section",
};

export const newSection = (kind: SectionKind, title?: string): ResumeSection => ({
  id: uid(),
  kind,
  title: title ?? SECTION_LABELS[kind],
  visible: true,
  text: kind === "summary" || kind === "references" || kind === "custom" ? "" : undefined,
  items:
    kind === "summary" || kind === "references" || kind === "custom" || kind === "interests"
      ? undefined
      : [],
  bullets: kind === "interests" ? [] : undefined,
});

export const blankResume = (name = "Untitled resume"): Resume => {
  const now = Date.now();
  return {
    id: uid(),
    name,
    header: {
      fullName: "",
      headline: "",
      contacts: [],
    },
    sections: [
      newSection("summary"),
      newSection("experience"),
      newSection("education"),
      newSection("skills"),
      newSection("projects"),
    ],
    design: defaultDesign(),
    createdAt: now,
    updatedAt: now,
  };
};

export const emptyData = (): AppData => ({
  version: 1,
  profile: emptyProfile(),
  resumes: [],
  coverLetters: [],
  applications: [],
  savedJobs: [],
  interviews: [],
  notes: [],
  settings: {
    displayName: "",
    defaultTemplate: "atlas",
    defaultPageSize: "A4",
  },
});
