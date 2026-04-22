import { Schema, model, Types, Document } from 'mongoose';

export interface IJobBasicInfo {
  title: string;
  description: string;
  roleType: string;
  headcount: number;
  locations: string[];
  workModel: string;
  level: string;
  jobType: string;
}

export interface IJobRequirements {
  requiredSkills: Types.ObjectId[];
  preferredSkills: Types.ObjectId[];
  requiredEducation: string;
  minGpa: number;
  requiredLanguages: string[];
  minMonthsExperience: number;
  portfolioExpected: string;
}

export interface IJob extends Document {
  companyId: Types.ObjectId;
  createdBy: Types.ObjectId;
  basicInfo: IJobBasicInfo;
  requirements: IJobRequirements;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

const JobBasicInfoSchema = new Schema<IJobBasicInfo>(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    roleType: { type: String, required: true },
    headcount: { type: Number, required: true },
    locations: [{ type: String, required: true }],
    workModel: { type: String, required: true },
    level: { type: String, required: true },
    jobType: { type: String, required: true },
  },
  { _id: false }
);

const JobRequirementsSchema = new Schema<IJobRequirements>(
  {
    requiredSkills: [{ type: Schema.Types.ObjectId, ref: 'Skill' }],
    preferredSkills: [{ type: Schema.Types.ObjectId, ref: 'Skill' }],
    requiredEducation: { type: String },
    minGpa: { type: Number },
    requiredLanguages: [{ type: String }],
    minMonthsExperience: { type: Number },
    portfolioExpected: { type: String },
  },
  { _id: false }
);

const JobSchema = new Schema<IJob>(
  {
    companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    basicInfo: { type: JobBasicInfoSchema, required: true },
    requirements: { type: JobRequirementsSchema, required: true },
    status: { type: String, enum: ['published', 'open', 'closed', 'draft', 'archived'], default: 'draft' },
  },
  { timestamps: true }
);

export const Job = model<IJob>('Job', JobSchema);
