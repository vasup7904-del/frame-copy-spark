export type ID = string;

export interface LinkItem {
  id: ID;
  label: string;
  url: string;
}

export interface ExperienceItem {
  id: ID;
  role: string;
  company: string;
  location?: string | undefined;
  start?: string | undefined;
  end?: string | undefined;
  current?: boolean | undefined;
  description?: string | undefined;
  bullets: string[];
}

export interface EducationItem {
  id: ID;
  degree: string;
  school: string;
  field?: string | undefined;
  location?: string | undefined;
  start?: string | undefined;
  end?: string | undefined;
  details?: string | undefined;
  description?: string | undefined;
}

export interface ProjectItem {
  id: ID;
  name: string;
  role?: string | undefined;
  url?: string | undefined;
  description?: string | undefined;
  technologies?: string[] | undefined;
  bullets: string[];
}

export interface SimpleItem {
  id: ID;
  title: string;
  subtitle?: string | undefined;
  date?: string | undefined;
  description?: string | undefined;
}

export interface SkillGroup {
  id: ID;
  /** category, e.g. "Languages & frameworks" */
  label: string;
  items: string[];
  proficiency?: string | undefined;
}

export interface CareerProfile {
  fullName: string;
  headline: string;
  email: string;
  phone: string;
  location: string;
  website: string;
  linkedin: string;
  github: string;
  photo?: string | undefined;
  summary: string;
  links: LinkItem[];
  experience: ExperienceItem[];
  education: EducationItem[];
  skills: SkillGroup[];
  projects: ProjectItem[];
  certifications: SimpleItem[];
  achievements: SimpleItem[];
  awards: SimpleItem[];
  languages: SimpleItem[];
  volunteer: SimpleItem[];
  publications: SimpleItem[];
  courses: SimpleItem[];
  organizations: SimpleItem[];
  interests: string[];
}

export type SectionKind =
  | "summary"
  | "experience"
  | "education"
  | "skills"
  | "projects"
  | "certifications"
  | "achievements"
  | "awards"
  | "languages"
  | "volunteer"
  | "publications"
  | "courses"
  | "organizations"
  | "interests"
  | "references"
  | "custom";

export interface ResumeSection {
  id: ID;
  kind: SectionKind;
  title: string;
  visible: boolean;
  /** free text used by summary / references / custom sections */
  text?: string | undefined;
  items?: (ExperienceItem | EducationItem | ProjectItem | SimpleItem | SkillGroup)[] | undefined;
  bullets?: string[] | undefined;
}

export interface ResumeDesign {
  template: string;
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  accent: string;
  margin: number;
  sectionSpacing: number;
  headingStyle: "plain" | "underline" | "bar" | "caps";
  pageSize: "A4" | "Letter";
  showPhoto: boolean;
}

export interface HeaderContactItem {
  id: ID;
  /** preset kind (email, phone, linkedin, leetcode, custom, custom-link…) */
  type: string;
  /** editor label, e.g. "LeetCode" */
  label: string;
  /** text shown on the resume */
  value: string;
  /** optional link target; when set the value renders as a clickable link */
  url?: string | undefined;
  visible: boolean;
  /** 1-based header row */
  row: number;
}

export interface ResumeHeader {
  fullName: string;
  headline: string;
  photo?: string | undefined;
  /** ordered contact items — array order is display order within a row */
  contacts: HeaderContactItem[];
}

export interface Resume {
  id: ID;
  name: string;
  targetRole?: string | undefined;
  targetCompany?: string | undefined;
  parentId?: ID | undefined;
  header: ResumeHeader;
  sections: ResumeSection[];
  design: ResumeDesign;
  createdAt: number;
  updatedAt: number;
  lastScore?: number | undefined;
}

export interface CoverLetter {
  id: ID;
  name: string;
  company: string;
  position: string;
  tone: string;
  length: string;
  body: string;
  resumeId?: ID | undefined;
  jobId?: ID | undefined;
  createdAt: number;
  updatedAt: number;
}

export type ApplicationStatus =
  | "Saved"
  | "Applied"
  | "Screening"
  | "Interview"
  | "Technical Interview"
  | "Final Round"
  | "Offer"
  | "Rejected"
  | "Withdrawn";

export interface JobApplication {
  id: ID;
  company: string;
  title: string;
  url?: string | undefined;
  location?: string | undefined;
  dateApplied?: string | undefined;
  resumeId?: ID | undefined;
  coverLetterId?: ID | undefined;
  jobDescription?: string | undefined;
  salary?: string | undefined;
  status: ApplicationStatus;
  recruiter?: string | undefined;
  contact?: string | undefined;
  notes?: string | undefined;
  followUp?: string | undefined;
  interviewDate?: string | undefined;
  interviewStage?: string | undefined;
  createdAt: number;
  updatedAt: number;
}

export interface SavedJob {
  id: ID;
  title: string;
  company?: string | undefined;
  text: string;
  analysis?: JobAnalysis | undefined;
  createdAt: number;
}

export interface JobAnalysis {
  jobTitle: string;
  requiredSkills: string[];
  preferredSkills: string[];
  technologies: string[];
  responsibilities: string[];
  qualifications: string[];
  keywords: string[];
  experienceRequirements: string[];
  educationRequirements: string[];
  softSkills: string[];
}

export interface InterviewQuestion {
  id: ID;
  category: string;
  question: string;
  answer?: string | undefined;
  feedback?: string | undefined;
}

export interface InterviewSession {
  id: ID;
  role: string;
  company?: string | undefined;
  resumeId?: ID | undefined;
  questions: InterviewQuestion[];
  createdAt: number;
}

export interface NoteDoc {
  id: ID;
  title: string;
  kind: "note" | "linkedin" | "interview-notes" | "other";
  body: string;
  createdAt: number;
  updatedAt: number;
}

export interface AppData {
  version: number;
  profile: CareerProfile;
  resumes: Resume[];
  coverLetters: CoverLetter[];
  applications: JobApplication[];
  savedJobs: SavedJob[];
  interviews: InterviewSession[];
  notes: NoteDoc[];
  settings: {
    displayName: string;
    defaultTemplate: string;
    defaultPageSize: "A4" | "Letter";
  };
}
