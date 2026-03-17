import { Document, Schema, model } from 'mongoose';

export interface IScormCourseDraftAsset {
    contentType: 'video' | 'slides' | 'pdf' | 'images';
    fileName: string;
    fileType: string;
    fileSize: number;
    fileUrl: string;
    uploadedAt: Date;
}

export interface IScormCourseDraftQuestion {
    prompt: string;
    explanation?: string;
    options: string[];
    correctOptionId: string;
}

export interface IScormCourseDraftChapter {
    order: number;
    title: string;
    description: string;
    durationMinutes: number;
    assets: IScormCourseDraftAsset[];
    questions: IScormCourseDraftQuestion[];
}

export interface IScormCourseDraft extends Document {
    courseId: string;
    courseInfo: {
        title: string;
        subtitle?: string;
        description?: string;
        category?: string;
        level?: string;
        language?: string;
        estimatedHours?: string;
    };
    settings: {
        navigationMode: 'linear' | 'free';
        passScore: number;
        allowRetakes: boolean;
        trackTimeSpent: boolean;
    };
    metadata: {
        identifier: string;
        version: string;
        author: string;
        keywords?: string;
        notes?: string;
    };
    chapters: IScormCourseDraftChapter[];
    createdAt: Date;
    updatedAt: Date;
}

const AssetSchema = new Schema<IScormCourseDraftAsset>(
    {
        contentType: {
            type: String,
            enum: ['video', 'slides', 'pdf', 'images'],
            required: true,
        },
        fileName: { type: String, required: true },
        fileType: { type: String, required: true },
        fileSize: { type: Number, required: true },
        fileUrl: { type: String, required: true },
        uploadedAt: { type: Date, required: true },
    },
    { _id: false }
);

const QuestionSchema = new Schema<IScormCourseDraftQuestion>(
    {
        prompt: { type: String, required: true },
        explanation: String,
        options: [{ type: String, required: true }],
        correctOptionId: { type: String, required: true },
    },
    { _id: false }
);

const ChapterSchema = new Schema<IScormCourseDraftChapter>(
    {
        order: { type: Number, required: true },
        title: { type: String, required: true },
        description: { type: String, default: '' },
        durationMinutes: { type: Number, required: true, min: 1 },
        assets: { type: [AssetSchema], default: [] },
        questions: { type: [QuestionSchema], default: [] },
    },
    { _id: false }
);

const ScormCourseDraftSchema = new Schema<IScormCourseDraft>(
    {
        courseId: { type: String, required: true, unique: true, index: true },
        courseInfo: {
            title: { type: String, required: true },
            subtitle: String,
            description: String,
            category: String,
            level: String,
            language: String,
            estimatedHours: String,
        },
        settings: {
            navigationMode: {
                type: String,
                enum: ['linear', 'free'],
                required: true,
            },
            passScore: { type: Number, required: true, min: 0, max: 100 },
            allowRetakes: { type: Boolean, default: true },
            trackTimeSpent: { type: Boolean, default: true },
        },
        metadata: {
            identifier: { type: String, required: true },
            version: { type: String, required: true },
            author: { type: String, required: true },
            keywords: String,
            notes: String,
        },
        chapters: { type: [ChapterSchema], default: [] },
    },
    { timestamps: true }
);

export const ScormCourseDraft = model<IScormCourseDraft>('ScormCourseDraft', ScormCourseDraftSchema);
