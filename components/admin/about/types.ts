// Domain shapes for the JSON columns on the About model.
// Match the schema comments in prisma/schema.prisma.

export interface SkillProject {
  name: string;
  repositoryLink: string;
}

export interface Skill {
  name: string;
  expertiseLevel: string;
  projects: SkillProject[];
}

export interface SkillCategory {
  category: string;
  skills: Skill[];
}

export interface Experience {
  company: string;
  role: string;
  description: string;
  startDate: string;
  endDate: string;
  isOngoing: boolean;
  achievements: string[];
}

export interface Education {
  institution: string;
  degree: string;
  fieldOfStudy: string;
  startDate: string;
  endDate: string;
  isOngoing: boolean;
  expectedGradDate: string;
  relevantCoursework: string[];
}

export interface Certification {
  organization: string;
  name: string;
  issueDate: string;
  expirationDate: string;
  credentialUrl: string;
}

export interface Leadership {
  organization: string;
  role: string;
  startDate: string;
  endDate: string;
  description: string;
}

export type Hobby = string | { name: string; color: string };

export interface AboutEditableShape {
  professionalSummary: string;
  technicalSkills: SkillCategory[];
  professionalExperience: Experience[];
  education: Education[];
  technicalCertifications: Certification[];
  leadershipExperience: Leadership[];
  leadershipSubtitle: string;
  hobbies: Hobby[];
}

// EntryForm/SkillItem etc. operate over arbitrary keyed records driven
// by FieldDef metadata. The loose Record<string, any> is intentional —
// the alternative is per-shape generics and unsafe casts at every
// access site, which would be far harder to read. The cast is confined
// to EntryForm consumers (Certification + Leadership) only.
export type DynamicEntry = Record<string, any>;

export interface FieldDef {
  key: string;
  label: string;
  type?: string;
  placeholder?: string;
}
