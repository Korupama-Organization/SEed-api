import { Schema, model, Document, Types } from 'mongoose';

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface IVideoConfig {
    originalUrl?: string; // Raw S3 link
    hlsUrl?: string;      // Encoded m3u8 link (AES-128 encrypted)
    duration?: number;    // Total duration in seconds
    drmKeyId?: string;    // Key ID used by the player for decryption
}

export interface IAttachment {
    name: string;
    url: string;
    fileType: string;
}

export interface IQuizData {
    question: string;
    options: string[];       // e.g. ["A. Đúng", "B. Sai"]
    correctIndex: number;    // Zero-based index of the correct option
    explanation?: string;
}

export interface IInteractivePoint {
    timestamp: number;                   // Trigger time in seconds
    type: 'quiz' | 'popup_text';
    isBlocking: boolean;                 // If true, must complete before continuing (FR-PLAY-03)
    quizData?: IQuizData;
    /** If answered incorrectly, seek player back to this timestamp (seconds) */
    retryTimestamp?: number;
}

export interface ILesson extends Document {
    courseId: Types.ObjectId;
    title: string;
    type: 'video' | 'quiz' | 'document';
    content?: string;           // HTML for reading material or description
    videoConfig?: IVideoConfig;
    attachments: IAttachment[];
    interactivePoints: IInteractivePoint[];
    createdAt: Date;
    updatedAt: Date;
}

// ─── Schema ───────────────────────────────────────────────────────────────────

const VideoConfigSchema = new Schema<IVideoConfig>(
    {
        originalUrl: String,
        hlsUrl: String,
        duration: Number,
        drmKeyId: String,
    },
    { _id: false }
);

const AttachmentSchema = new Schema<IAttachment>(
    {
        name: { type: String, required: true },
        url: { type: String, required: true },
        fileType: { type: String, required: true },
    },
    { _id: false }
);

const QuizDataSchema = new Schema<IQuizData>(
    {
        question: { type: String, required: true },
        options: [String],
        correctIndex: { type: Number, required: true },
        explanation: String,
    },
    { _id: false }
);

const InteractivePointSchema = new Schema<IInteractivePoint>(
    {
        timestamp: { type: Number, required: true },
        type: { type: String, enum: ['quiz', 'popup_text'], default: 'quiz' },
        isBlocking: { type: Boolean, default: true },
        quizData: QuizDataSchema,
        retryTimestamp: Number,
    },
    { _id: true }
);

const LessonSchema = new Schema<ILesson>(
    {
        courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
        title: { type: String, required: true },
        type: { type: String, enum: ['video', 'quiz', 'document'], required: true },
        content: String,
        videoConfig: VideoConfigSchema,
        attachments: [AttachmentSchema],
        interactivePoints: [InteractivePointSchema],
    },
    { timestamps: true }
);

LessonSchema.index({ courseId: 1 });

export const Lesson = model<ILesson>('Lesson', LessonSchema);
