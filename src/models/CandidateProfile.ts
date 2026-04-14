import { Schema, model, Document, Types } from "mongoose";

export interface IBasicInfo {
  mssv?: string;
  fullName?: string;
  birthday?: Date;
  gender?: "Nam" | "Nữ" | "Khác";
  phone?: string;
  email?: string;
  github?: string;
  facebook?: string;
  linkedin?: string;
}

export interface IEducation {
  school?: string;
  major?: string;
  expectedGraduation?: string;
  gpa?: number;
}

export interface ILegacyTechnicalSkill {
  category: string;
  name: string;
  yoe?: number;
  confidence?: number;
}

export interface ISkills {
  technical: ILegacyTechnicalSkill[];
  softSkills: string[];
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

export interface ICandidateProfile extends Document {
  userId: Types.ObjectId;
  basicInfo: IBasicInfo;
  education: IEducation;
  strengths?: string;
  skills?: ISkills;
  languages: ILanguage[];
  achievements: IAchievement[];
  createdAt: Date;
  updatedAt: Date;
}

const BasicInfoSchema = new Schema<IBasicInfo>(
  {
    mssv: String,
    fullName: String,
    birthday: Date,
    gender: { type: String, enum: ["Nam", "Nữ", "Khác"] },
    phone: String,
    email: String,
    github: String,
    facebook: String,
    linkedin: String,
  },
  { _id: false },
);

const EducationSchema = new Schema<IEducation>(
  {
    school: String,
    major: String,
    expectedGraduation: String,
    gpa: Number,
  },
  { _id: false },
);

const LegacyTechnicalSkillSchema = new Schema<ILegacyTechnicalSkill>(
  {
    category: { type: String, required: true },
    name: { type: String, required: true },
    yoe: Number,
    confidence: Number,
  },
  { _id: false },
);

const SkillsSchema = new Schema<ISkills>(
  {
    technical: { type: [LegacyTechnicalSkillSchema], default: [] },
    softSkills: { type: [String], default: [] },
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

const CandidateProfileSchema = new Schema<ICandidateProfile>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    basicInfo: { type: BasicInfoSchema, required: true },
    education: { type: EducationSchema, required: true },
    strengths: String,
    skills: { type: SkillsSchema },
    languages: { type: [LanguageSchema], default: [] },
    achievements: { type: [AchievementSchema], default: [] },
  },
  { timestamps: true },
);

export const CandidateProfile = model<ICandidateProfile>(
  "CandidateProfile",
  CandidateProfileSchema,
  "candidate_profiles",
);
