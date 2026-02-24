import { Schema, model, Document, Types } from 'mongoose';

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface ICompletedInteraction {
    /** References the _id of an interactivePoint inside a Lesson */
    pointId: string;
    /** Zero-based index of the answer the user selected */
    userAnswer: number;
    passedAt: Date;
}

export interface ILessonProgress {
    lessonId: Types.ObjectId;
    status: 'locked' | 'in-progress' | 'completed';
    /** Last watched position in seconds (FR-PLAY-02) */
    lastPosition: number;
    completedInteractions: ICompletedInteraction[];
}

export interface IEnrollment extends Document {
    userId: Types.ObjectId;
    courseId: Types.ObjectId;
    enrolledAt: Date;
    /** Overall progress 0–100 */
    overallProgress: number;
    isCompleted: boolean;
    certificateUrl?: string;
    lessonProgress: ILessonProgress[];
    createdAt: Date;
    updatedAt: Date;
}

// ─── Schema ───────────────────────────────────────────────────────────────────

const CompletedInteractionSchema = new Schema<ICompletedInteraction>(
    {
        pointId: { type: String, required: true },
        userAnswer: { type: Number, required: true },
        passedAt: { type: Date, default: Date.now },
    },
    { _id: false }
);

const LessonProgressSchema = new Schema<ILessonProgress>(
    {
        lessonId: { type: Schema.Types.ObjectId, ref: 'Lesson', required: true },
        status: {
            type: String,
            enum: ['locked', 'in-progress', 'completed'],
            default: 'locked',
        },
        lastPosition: { type: Number, default: 0 },
        completedInteractions: [CompletedInteractionSchema],
    },
    { _id: false }
);

const EnrollmentSchema = new Schema<IEnrollment>(
    {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
        enrolledAt: { type: Date, default: Date.now },
        overallProgress: { type: Number, default: 0, min: 0, max: 100 },
        isCompleted: { type: Boolean, default: false },
        certificateUrl: String,
        lessonProgress: [LessonProgressSchema],
    },
    { timestamps: true }
);

// One enrollment record per user per course
EnrollmentSchema.index({ userId: 1, courseId: 1 }, { unique: true });

export const Enrollment = model<IEnrollment>('Enrollment', EnrollmentSchema);
