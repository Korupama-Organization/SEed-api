import { Schema, model, Document, Types } from "mongoose";

export interface IAcademicInfo {
  university: string;
  major: string;
  graduationYear: number;
  gpa?: number;
}
export interface ILanguage {
  certificateName: string;
  score: number;
  issuedAt: Date;
  expiresAt: Date;
}

export interface IAchievement {
  title: string;
  achievedAt: Date;
}

export interface ITechnicalSkill {
  category:
    | "Ngôn ngữ lập trình"
    | "Framework"
    | "OS"
    | "Database"
    | "Cloud"
    | "Version Control"
    | "Công cụ quản lý dự án"
    | "Khác";
  name: string;
  yearsOfExperience: number;
  confidence: boolean;
}

export interface IProject {
  name: string;
  description: string;
  technologies: string[];
  role: string;
  contribution: string;
  startDate: Date;
  endDate: Date;
  teamSize: number;
  repositoryUrl?: string;
  reportUrl?: string;
}

export interface IWorkExperience {
  companyName: string;
  position: string;
  startDate: Date;
  endDate: Date;
  description: string;
  technologiesUsed: string[];
}

export interface IIntroductionQuestions {
  preferredRoles: {
    preferredRole:
      | "Frontend"
      | "Backend"
      | "Fullstack"
      | "Mobile"
      | "DevOps"
      | "QA"
      | "Khác";
  }[];
  whyTheseRoles: string;
  futureGoals: string;
  favoriteTechnology: string;
}

export interface ICandidateProfile extends Document {
  userId: Types.ObjectId;
  academicInfo: IAcademicInfo;
  languages: ILanguage[];
  achievements: IAchievement[];
  advantagePoint: string;
  technicalSkills: ITechnicalSkill[];
  softSkills: string[];
  projects: IProject[];
  workExperiences: IWorkExperience[];
  introductionQuestions: IIntroductionQuestions;
  createdAt: Date;
  updatedAt: Date;
}

const AcademicInfoSchema = new Schema<IAcademicInfo>(
  {
    university: { type: String, required: true },
    major: { type: String, required: true },
    graduationYear: { type: Number, required: true },
    gpa: Number,
  },
  { _id: false },
);

const LanguageSchema = new Schema<ILanguage>(
  {
    certificateName: { type: String, required: true },
    score: { type: Number, required: true },
    issuedAt: { type: Date, required: true },
    expiresAt: { type: Date, required: true },
  },
  { _id: false },
);

const AchievementSchema = new Schema<IAchievement>(
  {
    title: { type: String, required: true },
    achievedAt: { type: Date, required: true },
  },
  { _id: false },
);

const TechnicalSkillSchema = new Schema<ITechnicalSkill>(
  {
    category: {
      type: String,
      enum: [
        "Ngôn ngữ lập trình",
        "Framework",
        "OS",
        "Database",
        "Cloud",
        "Version Control",
        "Công cụ quản lý dự án",
        "Khác",
      ],
      required: true,
    },
    name: { type: String, required: true },
    yearsOfExperience: { type: Number, required: true },
    confidence: { type: Boolean, default: true },
  },
  { _id: false },
);

const ProjectSchema = new Schema<IProject>(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    technologies: { type: [String], required: true },
    role: { type: String, required: true },
    contribution: { type: String, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    teamSize: { type: Number, required: true },
    repositoryUrl: String,
    reportUrl: String,
  },
  { _id: false },
);

const WorkExperienceSchema = new Schema<IWorkExperience>(
  {
    companyName: { type: String, required: true },
    position: { type: String, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    description: { type: String, required: true },
    technologiesUsed: { type: [String], required: true },
  },
  { _id: false },
);

const IntroductionQuestionsSchema = new Schema<IIntroductionQuestions>(
  {
    preferredRoles: [
      {
        preferredRole: {
          type: String,
          enum: [
            "Frontend",
            "Backend",
            "Fullstack",
            "Mobile",
            "DevOps",
            "QA",
            "Khác",
          ],
          required: true,
        },
      },
    ],
    whyTheseRoles: { type: String, required: true },
    futureGoals: { type: String, required: true },
    favoriteTechnology: { type: String, required: true },
  },
  { _id: false },
);

const CandidateProfileSchema = new Schema<ICandidateProfile>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    academicInfo: { type: AcademicInfoSchema, required: true },
    languages: { type: [LanguageSchema], default: [] },
    achievements: { type: [AchievementSchema], default: [] },
    advantagePoint: String,
    technicalSkills: { type: [TechnicalSkillSchema], default: [] },
    softSkills: { type: [String], default: [] },
    projects: { type: [ProjectSchema], default: [] },
    workExperiences: { type: [WorkExperienceSchema], default: [] },
    introductionQuestions: {
      type: IntroductionQuestionsSchema,
      required: true,
    },
  },
  { timestamps: true },
);

CandidateProfileSchema.index({ userId: 1 }, { unique: true });
CandidateProfileSchema.index({ "academicInfo.major": 1 });

export const CandidateProfile = model<ICandidateProfile>(
  "CandidateProfile",
  CandidateProfileSchema,
  "candidate_profiles",
);
