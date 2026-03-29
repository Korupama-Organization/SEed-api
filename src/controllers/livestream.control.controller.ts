import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { LivestreamAttendance } from '../models/LivestreamAttendance';
import { ILivestreamSession, LivestreamSession } from '../models/LivestreamSession';
import { closeRoom } from '../services/livekit/livekit-client';

const getLivestreamId = (req: AuthenticatedRequest): string => {
    const value = req.params.livestreamId;
    return Array.isArray(value) ? value[0] : value;
};

const loadOwnedLivestream = async (
    req: AuthenticatedRequest,
): Promise<{ row?: ILivestreamSession; status?: number; message?: string }> => {
    const row = await LivestreamSession.findById(getLivestreamId(req));
    if (!row) {
        return { status: 404, message: 'Livestream not found.' };
    }

    if (String(row.teacherId) !== String(req.auth!.userId)) {
        return { status: 403, message: 'Forbidden.' };
    }

    return { row };
};

const providerUnavailable = (res: Response) => {
    return res.status(503).json({ error: 'Livestream provider unavailable.' });
};

export const pauseLivestream = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const owned = await loadOwnedLivestream(req);
        if (!owned.row) {
            return res.status(owned.status || 404).json({ error: owned.message || 'Livestream not found.' });
        }

        const row = owned.row;
        if (row.status !== 'live') {
            return res.status(409).json({ error: 'Livestream must be live to pause.' });
        }

        row.status = 'paused';
        row.pausedAt = new Date();
        await row.save();

        await LivestreamAttendance.create({
            livestreamId: row._id,
            userId: req.auth!.userId,
            actorUserId: req.auth!.userId,
            eventType: 'control',
            reason: 'paused',
            metadata: { action: 'pause' },
        });

        return res.status(200).json({ data: row });
    } catch {
        return res.status(500).json({ error: 'Server error.' });
    }
};

export const resumeLivestream = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const owned = await loadOwnedLivestream(req);
        if (!owned.row) {
            return res.status(owned.status || 404).json({ error: owned.message || 'Livestream not found.' });
        }

        const row = owned.row;
        if (row.status !== 'paused') {
            return res.status(409).json({ error: 'Livestream must be paused to resume.' });
        }

        row.status = 'live';
        row.resumedAt = new Date();
        await row.save();

        await LivestreamAttendance.create({
            livestreamId: row._id,
            userId: req.auth!.userId,
            actorUserId: req.auth!.userId,
            eventType: 'control',
            reason: 'resumed',
            metadata: { action: 'resume' },
        });

        return res.status(200).json({ data: row });
    } catch {
        return res.status(500).json({ error: 'Server error.' });
    }
};

export const forceEndLivestream = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const owned = await loadOwnedLivestream(req);
        if (!owned.row) {
            return res.status(owned.status || 404).json({ error: owned.message || 'Livestream not found.' });
        }

        const row = owned.row;
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

        await LivestreamAttendance.create({
            livestreamId: row._id,
            userId: req.auth!.userId,
            actorUserId: req.auth!.userId,
            eventType: 'control',
            reason: 'force-ended',
            metadata: { action: 'force-end' },
        });

        return res.status(200).json({ data: row });
    } catch {
        return res.status(500).json({ error: 'Server error.' });
    }
};

export const removeParticipant = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const owned = await loadOwnedLivestream(req);
        if (!owned.row) {
            return res.status(owned.status || 404).json({ error: owned.message || 'Livestream not found.' });
        }

        const row = owned.row;
        const participantUserId = req.params.participantUserId;
        if (!participantUserId) {
            return res.status(400).json({ error: 'participantUserId is required.' });
        }

        if (row.status !== 'live' && row.status !== 'paused') {
            return res.status(409).json({ error: 'Livestream is not active.' });
        }

        await LivestreamAttendance.create({
            livestreamId: row._id,
            userId: participantUserId,
            actorUserId: req.auth!.userId,
            eventType: 'removed',
            reason: 'removed-by-teacher',
            metadata: { action: 'remove-participant' },
        });

        return res.status(200).json({ data: { removed: true, participantUserId } });
    } catch {
        return res.status(500).json({ error: 'Server error.' });
    }
};