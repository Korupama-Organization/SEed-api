import { Schema, model, Document, Types } from 'mongoose';

export type LivestreamAttendanceEvent = 'join' | 'rejoin' | 'reject' | 'leave' | 'removed' | 'control';

export interface ILivestreamAttendance extends Document {
    livestreamId: Types.ObjectId;
    userId: Types.ObjectId;
    actorUserId?: Types.ObjectId;
    deviceId: string;
    eventType: LivestreamAttendanceEvent;
    reason?: string;
    metadata?: Record<string, unknown>;
    createdAt: Date;
    updatedAt: Date;
}

const LivestreamAttendanceSchema = new Schema<ILivestreamAttendance>(
    {
        livestreamId: {
            type: Schema.Types.ObjectId,
            ref: 'LivestreamSession',
            required: true,
            index: true,
        },
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        actorUserId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
        deviceId: { type: String, trim: true, default: 'system' },
        eventType: {
            type: String,
            enum: ['join', 'rejoin', 'reject', 'leave', 'removed', 'control'],
            required: true,
            index: true,
        },
        reason: { type: String, trim: true },
        metadata: { type: Schema.Types.Mixed },
    },
    { timestamps: true },
);

LivestreamAttendanceSchema.index({ livestreamId: 1, userId: 1, createdAt: -1 });

export const LivestreamAttendance = model<ILivestreamAttendance>('LivestreamAttendance', LivestreamAttendanceSchema);