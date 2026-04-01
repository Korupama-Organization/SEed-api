import { Schema, model, Document, Types } from 'mongoose';

export type LivestreamAttendanceEvent = 'join' | 'rejoin' | 'reject' | 'leave';

export interface ILivestreamAttendance extends Document {
    livestreamId: Types.ObjectId;
    userId: Types.ObjectId;
    deviceId: string;
    eventType: LivestreamAttendanceEvent;
    reason?: string;
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
        deviceId: { type: String, required: true, trim: true },
        eventType: {
            type: String,
            enum: ['join', 'rejoin', 'reject', 'leave'],
            required: true,
        },
        reason: { type: String, trim: true },
    },
    { timestamps: true },
);

LivestreamAttendanceSchema.index({ livestreamId: 1, userId: 1, createdAt: -1 });

export const LivestreamAttendance = model<ILivestreamAttendance>('LivestreamAttendance', LivestreamAttendanceSchema);
