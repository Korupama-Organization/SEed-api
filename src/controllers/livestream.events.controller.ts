import { Response } from 'express';
import { Types } from 'mongoose';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { LivestreamAttendance } from '../models/LivestreamAttendance';
import { LivestreamSession } from '../models/LivestreamSession';

const asNumber = (value: unknown, fallback: number): number => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
};

export const listLivestreamEvents = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const livestream = await LivestreamSession.findById(req.params.livestreamId).select('_id teacherId').lean();
        if (!livestream) {
            return res.status(404).json({ error: 'Livestream not found.' });
        }

        const isTeacherOwner = String(livestream.teacherId) === String(req.auth!.userId);
        const isStudent = req.auth!.role === 'student';
        if (!isTeacherOwner && !isStudent) {
            return res.status(403).json({ error: 'Forbidden.' });
        }

        const limit = Math.min(asNumber(req.query.limit, 50), 100);
        const since = typeof req.query.since === 'string' ? new Date(req.query.since) : null;
        const cursor = typeof req.query.cursor === 'string' && Types.ObjectId.isValid(req.query.cursor)
            ? new Types.ObjectId(req.query.cursor)
            : null;

        const filter: Record<string, unknown> = {
            livestreamId: req.params.livestreamId,
        };

        if (since && !Number.isNaN(since.getTime())) {
            filter.createdAt = { $gt: since };
        }

        if (cursor) {
            filter._id = { $gt: cursor };
        }

        const rows = await LivestreamAttendance.find(filter)
            .sort({ _id: 1 })
            .limit(limit)
            .lean();

        return res.status(200).json({ data: rows });
    } catch (error: any) {
        return res.status(500).json({ error: error.message || 'Server error.' });
    }
};