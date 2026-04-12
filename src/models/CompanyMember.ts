import { Schema, model, Types, Document } from "mongoose";

export interface IPermission {
    canCreateJob : boolean; //For recruiter and manager
    canUpdateJob : boolean; //For recruiter and manager
    canDeleteJob : boolean; //For recruiter and manager
    canViewApplications : boolean; //For all roles
    canUpdateApplicationStatus : boolean; //For recruiter and manager
    canScheduleInterviews : boolean; //For interviewer
    canUpdateCompanyProfile : boolean; //For manager
}

export interface ICompanyMember extends Document {
    userId: Types.ObjectId;
    companyId: Types.ObjectId;

    membershipRole : 'manager' | 'recruiter' | 'interviewer';
    jobTitle: string;
    
    permission : IPermission;

    createdAt: Date;
    updatedAt: Date;

}

const CompanyMemberSchema = new Schema<ICompanyMember>(
    {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
        membershipRole: { type: String, enum: ['manager', 'recruiter', 'interviewer'], required: true },
        jobTitle: { type: String, required: true },
        permission: {
            canCreateJob: { type: Boolean, default: false },
            canUpdateJob: { type: Boolean, default: false },
            canDeleteJob: { type: Boolean, default: false },
            canViewApplications: { type: Boolean, default: true },
            canUpdateApplicationStatus: { type: Boolean, default: false },
            canScheduleInterviews: { type: Boolean, default: false },
            canUpdateCompanyProfile: { type: Boolean, default: false },
        },
    },
    { timestamps: true }
);

CompanyMemberSchema.index({ userId: 1, companyId: 1 }, { unique: true });

export const CompanyMember = model<ICompanyMember>('CompanyMember', CompanyMemberSchema);