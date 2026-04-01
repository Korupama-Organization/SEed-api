import { Schema, model, Document, Types } from 'mongoose';

export type LivestreamAccessMode = 'public' | 'private';
export type LivestreamStatus = 'scheduled' | 'live' | 'ended' | 'cancelled';

export interface ILivestreamSession extends Document {
    title: string;
    description?: string;
    teacherId: Types.ObjectId;
    courseId?: Types.ObjectId;
    accessMode: LivestreamAccessMode;
    status: LivestreamStatus;
    livekitRoomName: string;
    scheduledFor?: Date;
    startedAt?: Date;
    endedAt?: Date;
    cancelledAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const LivestreamSessionSchema = new Schema<ILivestreamSession>(
    {
        title: { type: String, required: true, trim: true },
        description: { type: String, trim: true },
        teacherId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        courseId: { type: Schema.Types.ObjectId, ref: 'Course' },
        accessMode: {
            type: String,
            enum: ['public', 'private'],
            default: 'public',
            required: true,
        },
        status: {
            type: String,
            enum: ['scheduled', 'live', 'ended', 'cancelled'],
            default: 'scheduled',
            required: true,
            index: true,
        },
        livekitRoomName: { type: String, required: true, trim: true, index: true },
        scheduledFor: { type: Date },
        startedAt: { type: Date },
        endedAt: { type: Date },
        cancelledAt: { type: Date },
    },
    { timestamps: true },
);

LivestreamSessionSchema.index({ teacherId: 1, status: 1 });

LivestreamSessionSchema.pre('validate', function validatePrivateCourse(next) {
    if (this.accessMode === 'private' && !this.courseId) {
        this.invalidate('courseId', 'courseId is required for private livestreams.');
    }

    next();
});

export const LivestreamSession = model<ILivestreamSession>('LivestreamSession', LivestreamSessionSchema);
