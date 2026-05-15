import { application } from "express";
import { model, Schema, Types, Document, ObjectId } from "mongoose";

export interface IApplicationStatus {
    status: 'applied' | 'screening_passed' | 'ai_interview_completed' | 'manual_interview_completed' | 'offered' | 'hired' | 'rejected';
    note: string; // Optional field to provide additional information about the status
    createdAt: Date;
    updatedAt: Date;
}

export interface IApplication extends Document {
    
    candidateUserId: Types.ObjectId;
    jobId: Types.ObjectId;

    screeningResults: {
        resumeScreening: 'not_started' | 'processing' | 'passed' | 'failed' | 'manual_override' ; // 'manual_override' allows recruiters to override the result of AI screening
        matchedSkills: string[]; // List of skills that matched between candidate profile and job requirements
        missingSkills: string[]; // List of skills that are required by the job but missing in candidate profile
        score: number; // Overall score calculated based on matched skills, missing skills
        evaluatedAt: Date; // Timestamp of when the screening was performed
        evaluatedBy: 'System' | ObjectId; // Indicates whether the screening was done by AI or manually by a recruiter
    };
    applicationStatus: IApplicationStatus[];

    finalDecision: {
        decision: 'offer' | 'reject' | null; // Final decision made by the recruiter
        decidedAt: Date | null; // Timestamp of when the final decision was made
        decidedBy: ObjectId | null; // userId of the recruiter who made the final decision
    }
    createdAt: Date;
    updatedAt: Date;
}

const ApplicationStatusSchema = new Schema<IApplicationStatus>({
    status: {
        type: String,
        enum: ['applied', 'screening_passed', 'ai_interview_completed', 'manual_interview_completed', 'offered', 'hired', 'rejected']
    },
    note: {
        type: String,
        trim: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

const ApplicationSchema = new Schema<IApplication>( 
    {
        candidateUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        jobId: { type: Schema.Types.ObjectId, ref: 'Job', required: true },
        screeningResults: {
            resumeScreening: { type: String, enum: ['not_started', 'processing', 'passed', 'failed', 'manual_override'], default: 'not_started' },
            matchedSkills: [String],
            missingSkills: [String],
            score: Number,
            evaluatedAt: Date,
            evaluatedBy: { type: Schema.Types.Mixed } // Can be 'System' or ObjectId of the recruiter
        },
        applicationStatus: [ApplicationStatusSchema],
        finalDecision: {
            decision: { type: String, enum: ['offer', 'reject', null], default: null },
            decidedAt: Date,
            decidedBy: { type: Schema.Types.ObjectId, ref: 'User' }
        }
    },
    { timestamps: true }
);

ApplicationSchema.index({ candidateUserId: 1, jobId: 1 }, { unique: true });

export const Application = model<IApplication>('Application', ApplicationSchema);
