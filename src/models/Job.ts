import {Schema, model, Types, Document} from 'mongoose';

export interface IRequirements {
    requiredSkills: string[];
    preferredSkills: string[];
    requiredEducation: "Năm 3" | "Năm 4/ Sắp tốt nghiệp" | "Đã tốt nghiệp" | null;
    minGPA: number | null;
    requiredLanguages: string[];
    preferredLanguages: string[];
    minimumExperience: number | null; // in months
}

export interface IInterviewConfig {
    useAIInterview: boolean;
    useManualInterview: boolean;
    sessionDuration: number | null; // in minutes, applicable if useAIInterview is true
}

export interface IApplicationStats{
    totalApplications: number;
    applicationsByStatus: {
        applied: number;
        screeningPassed: number;
        aiInterviewCompleted: number;
        manualInterviewCompleted: number;
        offered: number;
        hired: number;
    }
}

export interface IJob extends Document {
    companyId: Types.ObjectId;
    createdBy: Types.ObjectId; // userId of the creator (recruiter or manager)
    title: string;
    slug: string; // URL-friendly version of the job title

    summary: string;
    jobDetails: string;

    role: 'Frontend' | 'Backend' | 'Fullstack' | 'Mobile' | 'DevOps' | 'QA' | 'Khác';
    level: 'Intern' | 'Fresher' ;
    employmentType: 'Full-time' | 'Part-time' | 'Internship' | 'Contract';
    workMode: 'On-site' | 'Remote' | 'Hybrid';

    vacancies: number;
    applicationDeadline: Date;

    address: string; // Specific address for on-site jobs
    requirements: IRequirements;
    interviewConfig: IInterviewConfig;
    applicationStats: IApplicationStats;
    
    status: 'open' | 'closed' | 'draft' | 'archived';
    publíshedAt: Date | null;
    
    createdAt: Date;
    updatedAt: Date;
}

const RequirementsSchema = new Schema<IRequirements>(
    {
        requiredSkills: [String],
        preferredSkills: [String],
        requiredEducation: { type: String, enum: ['Năm 3', 'Năm 4/ Sắp tốt nghiệp', 'Đã tốt nghiệp', null] },
        minGPA: Number,
        requiredLanguages: [String],
        preferredLanguages: [String],
        minimumExperience: Number,
    },
    { _id: false }
);

const InterviewConfigSchema = new Schema<IInterviewConfig>(
    {
        useAIInterview: { type: Boolean, default: false },
        useManualInterview: { type: Boolean, default: false },
        sessionDuration: Number,
    },
    { _id: false }
);

const ApplicationStatsSchema = new Schema<IApplicationStats>(
    {
        totalApplications: { type: Number, default: 0 },
        applicationsByStatus: {
            applied: { type: Number, default: 0 },
            screeningPassed: { type: Number, default: 0 },
            aiInterviewCompleted: { type: Number, default: 0 },
            manualInterviewCompleted: { type: Number, default: 0 },
            offered: { type: Number, default: 0 },
            hired: { type: Number, default: 0 },
        },
    },
    { _id: false }
);

const JobSchema = new Schema<IJob>(
    {
        companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
        createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        title: { type: String, required: true },
        slug: { type: String, required: true, unique: true },
        summary: { type: String, required: true },
        jobDetails: { type: String, required: true },
        role: { type: String, enum: ['Frontend', 'Backend', 'Fullstack', 'Mobile', 'DevOps', 'QA', 'Khác'], required: true },
        level: { type: String, enum: ['Intern', 'Fresher'], required: true },
        employmentType: { type: String, enum: ['Full-time', 'Part-time', 'Internship', 'Contract'], required: true },
        workMode: { type: String, enum: ['On-site', 'Remote', 'Hybrid'], required: true },
        vacancies: { type: Number, required: true },
        applicationDeadline: { type: Date, required: true },
        address: String,
        requirements: { type: RequirementsSchema, required: true },
        interviewConfig: { type: InterviewConfigSchema, required: true },
        applicationStats: { type: ApplicationStatsSchema, required: true },
        status: { type: String, enum: ['open', 'closed', 'draft', 'archived'], default: 'draft' },
        publíshedAt: Date,
    },
     { timestamps: true }
);

JobSchema.index({ companyId: 1, slug: 1 }, { unique: true });

export const Job = model<IJob>('Job', JobSchema);



