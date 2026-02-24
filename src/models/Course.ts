import { Schema, model, Document, Types } from 'mongoose';

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface ILessonRef {
    lessonId: Types.ObjectId;
    title: string;
    type: 'video' | 'quiz' | 'document';
    /** Duration in seconds */
    duration?: number;
}

export interface IModule {
    title: string;
    lessons: ILessonRef[];
}

export interface ICourseStats {
    totalStudents: number;
    averageRating: number;
}

export interface ICourse extends Document {
    title: string;
    slug: string;
    instructor: Types.ObjectId;
    thumbnail?: string;
    description?: string;
    price: number;
    isPublished: boolean;
    tags: string[];
    /** Nested curriculum: Course → Modules → Lessons */
    curriculum: IModule[];
    stats: ICourseStats;
    createdAt: Date;
    updatedAt: Date;
}

// ─── Schema ───────────────────────────────────────────────────────────────────

const LessonRefSchema = new Schema<ILessonRef>(
    {
        lessonId: { type: Schema.Types.ObjectId, ref: 'Lesson' },
        title: String,
        type: { type: String, enum: ['video', 'quiz', 'document'] },
        duration: Number,
    },
    { _id: false }
);

const ModuleSchema = new Schema<IModule>(
    {
        title: { type: String, required: true },
        lessons: [LessonRefSchema],
    },
    { _id: true }
);

const CourseStatsSchema = new Schema<ICourseStats>(
    {
        totalStudents: { type: Number, default: 0 },
        averageRating: { type: Number, default: 0, min: 0, max: 5 },
    },
    { _id: false }
);

const CourseSchema = new Schema<ICourse>(
    {
        title: { type: String, required: true, index: 'text' },
        slug: { type: String, unique: true, lowercase: true, trim: true },
        instructor: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        thumbnail: String,
        description: String,
        price: { type: Number, required: true, min: 0 },
        isPublished: { type: Boolean, default: false },
        tags: [String],
        curriculum: [ModuleSchema],
        stats: { type: CourseStatsSchema, default: () => ({}) },
    },
    { timestamps: true }
);

CourseSchema.index({ instructor: 1 });
CourseSchema.index({ isPublished: 1 });
CourseSchema.index({ tags: 1 });

export const Course = model<ICourse>('Course', CourseSchema);
