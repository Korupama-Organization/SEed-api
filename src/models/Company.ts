import { Schema, model, Types, Document } from "mongoose";

export interface ILocation {
    address: string;
    city: string;
    country: string;
}

export interface IWorkingEnvironment {
    type: 'On-site' | 'Remote' | 'Hybrid';
    techStack: string[];
    benefits: string[];
}

export interface ISocialMediaLinks {
    platform: 'LinkedIn' | 'Facebook' | 'Twitter' | 'GitHub' | 'Zalo' | 'Khác';
    url: string;
}

export interface IRecrutingPreferences {
    targetRoles: string[];
    targetLevels: {level: 'Intern' | 'Fresher'}[];
    usingAIInterview: boolean;
    usingManualInterview: boolean;
}


export interface ICompany extends Document {
    name: string;
    shortName: string;
    logoUrl?: string;
    websiteUrl: string;
    email: string;
    phone: string;
    description?: string;
    location: ILocation[];
    workingEnvironment: IWorkingEnvironment;
    socialMediaLinks: ISocialMediaLinks[];

    recruitingPreferences: IRecrutingPreferences;

    // Inform if the company is a partner of SE-UIT/ is going to participate in the job fair
    partnerStatus: 'active' | 'inactive';

    createdAt: Date;
    updatedAt: Date;
}

const LocationSchema = new Schema<ILocation>(
    {
        address: { type: String, required: true },  
        city: { type: String, required: true },
        country: { type: String, required: true },
    },
    { _id: false }
);

const WorkingEnvironmentSchema = new Schema<IWorkingEnvironment>(
    {
        type: { type: String, enum: ['On-site', 'Remote', 'Hybrid'], required: true },
        techStack: { type: [String], required: true },
        benefits: { type: [String], required: true },
    },
    { _id: false }
);

const SocialMediaLinksSchema = new Schema<ISocialMediaLinks>(
    {
        platform: { type: String, enum: ['LinkedIn', 'Facebook', 'Twitter', 'GitHub', 'Zalo', 'Khác'], required: true },
        url: { type: String, required: true },
    },
    { _id: false }
);

const RecruitingPreferencesSchema = new Schema<IRecrutingPreferences>(
    {
        targetRoles: { type: [String], required: true },
        targetLevels: { type: [{level: {type: String, enum: ['Intern', 'Fresher']}}], required: true },
        usingAIInterview: { type: Boolean, required: true },
        usingManualInterview: { type: Boolean, required: true },
    },
     { _id: false }
);

const CompanySchema = new Schema<ICompany>(
    {
        name: { type: String, required: true },
        shortName: { type: String, required: true },
        logoUrl: String,
        websiteUrl: { type: String, required: true },
        email: { type: String, required: true },
        phone: { type: String, required: true },
        description: String,
        location: { type: [LocationSchema], required: true },
        workingEnvironment: { type: WorkingEnvironmentSchema, required: true },
        socialMediaLinks: { type: [SocialMediaLinksSchema], required: true },
        recruitingPreferences: { type: RecruitingPreferencesSchema, required: true },
        partnerStatus: { type: String, enum: ['active', 'inactive'], default: 'inactive' },
    },
     { timestamps: true }
);

CompanySchema.index({ name: 1 }, { unique: true });
CompanySchema.index({status: 1});

export const Company = model<ICompany>('Company', CompanySchema);

