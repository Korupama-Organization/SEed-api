import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { LivestreamAccessMode, LivestreamSession } from '../models/LivestreamSession';
import { closeRoom, ensureRoom, mintTeacherToken } from '../services/livekit/livekit-client';

const isValidObjectId = (value: string | undefined): boolean => {
    return Boolean(value && Types.ObjectId.isValid(value));
};

const assertTeacherOwnership = (req: AuthenticatedRequest, teacherId: unknown): boolean => {
    return String(teacherId) === String(req.auth!.userId);
};

const parseAccessMode = (value: unknown): LivestreamAccessMode | null => {
    if (value === 'public' || value === 'private') {
        return value;
    }

    return null;
};

const providerUnavailable = (res: Response) => {
    return res.status(503).json({ error: 'Livestream provider unavailable.' });
};

export const createLivestream = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { title, description, accessMode: rawAccessMode, courseId, scheduledFor } = req.body;

        if (!title || typeof title !== 'string') {
            return res.status(400).json({ error: 'title is required.' });
        }

        const accessMode = parseAccessMode(rawAccessMode ?? 'public');
        if (!accessMode) {
            return res.status(400).json({ error: 'accessMode must be public or private.' });
        }

        if (accessMode === 'private' && !isValidObjectId(courseId)) {
            return res.status(400).json({ error: 'courseId is required for private livestreams.' });
        }

        const provisionalId = new Types.ObjectId();
        const created = await LivestreamSession.create({
            _id: provisionalId,
            title: title.trim(),
            description,
            teacherId: req.auth!.userId,
            courseId: accessMode === 'private' ? courseId : undefined,
            accessMode,
            status: 'scheduled',
            livekitRoomName: `livestream-${String(provisionalId)}`,
            scheduledFor,
        });

        return res.status(201).json({ data: created });
    } catch {
        return res.status(500).json({ error: 'Server error.' });
    }
};

export const startLivestream = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const row = await LivestreamSession.findById(req.params.livestreamId);
        if (!row) {
            return res.status(404).json({ error: 'Livestream not found.' });
        }

        if (!assertTeacherOwnership(req, row.teacherId)) {
            return res.status(403).json({ error: 'Forbidden.' });
        }

        if (row.status === 'ended' || row.status === 'cancelled') {
            return res.status(409).json({ error: 'Livestream already closed.' });
        }

        if (row.status === 'live') {
            try {
                const alreadyLiveToken = await mintTeacherToken(req.auth!.userId, row.livekitRoomName);
                return res.status(200).json({ data: row, provider: alreadyLiveToken });
            } catch {
                return providerUnavailable(res);
            }
        }

        try {
            await ensureRoom(row.livekitRoomName);
            const teacherToken = await mintTeacherToken(req.auth!.userId, row.livekitRoomName);

            row.status = 'live';
            row.startedAt = new Date();
            await row.save();

            return res.status(200).json({ data: row, provider: teacherToken });
        } catch {
            return providerUnavailable(res);
        }
    } catch {
        return res.status(500).json({ error: 'Server error.' });
    }
};

export const endLivestream = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const row = await LivestreamSession.findById(req.params.livestreamId);
        if (!row) {
            return res.status(404).json({ error: 'Livestream not found.' });
        }

        if (!assertTeacherOwnership(req, row.teacherId)) {
            return res.status(403).json({ error: 'Forbidden.' });
        }

        if (row.status === 'ended' || row.status === 'cancelled') {
            return res.status(409).json({ error: 'Livestream already closed.' });
        }

        try {
            await closeRoom(row.livekitRoomName);
        } catch {
            return providerUnavailable(res);
        }

        row.status = 'ended';
        row.endedAt = new Date();
        await row.save();

        return res.status(200).json({ data: row });
    } catch {
        return res.status(500).json({ error: 'Server error.' });
    }
};

export const cancelLivestream = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const row = await LivestreamSession.findById(req.params.livestreamId);
        if (!row) {
            return res.status(404).json({ error: 'Livestream not found.' });
        }

        if (!assertTeacherOwnership(req, row.teacherId)) {
            return res.status(403).json({ error: 'Forbidden.' });
        }

        if (row.status === 'ended' || row.status === 'cancelled') {
            return res.status(409).json({ error: 'Livestream already closed.' });
        }

        if (row.status === 'live') {
            try {
                await closeRoom(row.livekitRoomName);
            } catch {
                return providerUnavailable(res);
            }
        }

        row.status = 'cancelled';
        row.cancelledAt = new Date();
        await row.save();

        return res.status(200).json({ data: row });
    } catch {
        return res.status(500).json({ error: 'Server error.' });
    }
};

export const healthLivestream = async (_req: Request, res: Response) => {
    return res.status(200).json({ data: { ok: true } });
};