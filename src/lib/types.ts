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
  location?: string;
  start?: string;
  end?: string;
  current?: boolean;
  bullets: string[];
}

export interface EducationItem {
  id: ID;
  degree: string;
  school: string;
  location?: string;
  start?: string;
  end?: string;
  details?: string;
}

export interface ProjectItem {
  id: ID;
  name: string;
  role?: string;
  url?: string;
  description?: string;
  bullets: string[];
}

export interface SimpleItem {
  id: ID;
  title: string;
  subtitle?: string;
  date?: string;
  description?: string;
}

export interface SkillGroup {
  id: ID;
  label: string;
  items: string[];
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
  text?: string;
  items?: (ExperienceItem | EducationItem | ProjectItem | SimpleItem | SkillGroup)[];
  bullets?: string[];
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

export interface ResumeHeader {
  fullName: string;
  headline: string;
  email: string;
  phone: string;
  location: string;
  website: string;
  linkedin: string;
  github: string;
}

export interface Resume {
  id: ID;
  name: string;
  targetRole?: string;
  targetCompany?: string;
  parentId?: ID;
  header: ResumeHeader;
  sections: ResumeSection[];
  design: ResumeDesign;
  createdAt: number;
  updatedAt: number;
  lastScore?: number;
}

export interface CoverLetter {
  id: ID;
  name: string;
  company: string;
  position: string;
  tone: string;
  length: string;
  body: string;
  resumeId?: ID;
  jobId?: ID;
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
  url?: string;
  location?: string;
  dateApplied?: string;
  resumeId?: ID;
  coverLetterId?: ID;
  jobDescription?: string;
  salary?: string;
  status: ApplicationStatus;
  recruiter?: string;
  contact?: string;
  notes?: string;
  followUp?: string;
  interviewDate?: string;
  interviewStage?: string;
  createdAt: number;
  updatedAt: number;
}

export interface SavedJob {
  id: ID;
  title: string;
  company?: string;
  text: string;
  analysis?: JobAnalysis;
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
  answer?: string;
  feedback?: string;
}

export interface InterviewSession {
  id: ID;
  role: string;
  company?: string;
  resumeId?: ID;
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
