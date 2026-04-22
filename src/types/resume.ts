export interface ContactLink {
  text: string;
  href: string;
}

export interface SkillGroup {
  label: string;
  tokens: string[];
}

export interface Job {
  title: string;
  companyHtml: string;
  dates: string;
  tenure: string | null;
  context: string;
  bulletsHtml: string[];
  selectedWorkHtml: string[];
  selectedClients: string[];
}

export interface EducationEntry {
  school: string;
  degree: string;
  dates: string;
}

export interface Endorsement {
  author: string;
  sourceUrl: string | null;
  authorTitle: string | null;
  company: string | null;
  quoteParagraphs: string[];
}

export interface ResumeData {
  name: string;
  location: string;
  summaryTitle: string;
  skillsTitle: string;
  experienceTitle: string;
  educationTitle: string;
  endorsementsTitle: string;
  contactLinks: ContactLink[];
  summary: string[];
  skills: SkillGroup[];
  jobs: Job[];
  education: EducationEntry[];
  endorsements: Endorsement[];
}
