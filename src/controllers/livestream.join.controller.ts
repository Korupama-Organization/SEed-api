import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { Enrollment } from '../models/Enrollment';
import { LivestreamAttendance } from '../models/LivestreamAttendance';
import { LivestreamSession } from '../models/LivestreamSession';
import { Order } from '../models/Order';
import { mintViewerToken } from '../services/livekit/livekit-client';
import { acquireJoinLock, releaseJoinLock } from '../services/livestream/session-lock.service';

const rejectClosedState = (status: string): string | null => {
    if (status === 'scheduled') {
        return 'Livestream has not started yet.';
    }

    if (status === 'paused') {
        return 'Livestream is paused.';
    }

    if (status === 'ended' || status === 'cancelled') {
        return 'Livestream already closed.';
    }

    return null;
};

const hasPrivateAccess = async (userId: string, courseId: string): Promise<boolean> => {
    const enrollment = await Enrollment.findOne({
        userId,
        courseId,
    })
        .select('_id')
        .lean();

    if (enrollment) {
        return true;
    }

    const paidOrder = await Order.findOne({
        userId,
        status: 'paid',
        'items.courseId': courseId,
    })
        .select('_id')
        .lean();

    return Boolean(paidOrder);
};

const wasRemovedByTeacher = async (livestreamId: string, userId: string): Promise<boolean> => {
    const row = await LivestreamAttendance.findOne({
        livestreamId,
        userId,
        eventType: 'removed',
        reason: 'removed-by-teacher',
    })
        .select('_id')
        .lean();

    return Boolean(row);
};

const rejectWithAudit = async (
    req: AuthenticatedRequest,
    res: Response,
    livestreamId: string,
    deviceId: string,
    statusCode: number,
    reason: string,
) => {
    await LivestreamAttendance.create({
        livestreamId,
        userId: req.auth!.userId,
        deviceId,
        eventType: 'reject',
        reason,
    });

    return res.status(statusCode).json({ error: reason });
};

const handleJoinLike = async (req: AuthenticatedRequest, res: Response, forceRejoin: boolean) => {
    const { deviceId } = req.body;
    if (!deviceId || typeof deviceId !== 'string') {
        return res.status(400).json({ error: 'deviceId is required.' });
    }

    const livestream = await LivestreamSession.findById(req.params.livestreamId).lean();
    if (!livestream) {
        return res.status(404).json({ error: 'Livestream not found.' });
    }

    if (req.auth!.role !== 'student') {
        return res.status(403).json({ error: 'Forbidden.' });
    }

    const removed = await wasRemovedByTeacher(String(livestream._id), req.auth!.userId);
    if (removed) {
        return rejectWithAudit(req, res, String(livestream._id), deviceId, 403, 'You were removed from this livestream.');
    }

    const closedReason = rejectClosedState(livestream.status);
    if (closedReason) {
        return rejectWithAudit(req, res, String(livestream._id), deviceId, 409, closedReason);
    }

    if (livestream.accessMode === 'private') {
        if (!livestream.courseId) {
            return rejectWithAudit(req, res, String(livestream._id), deviceId, 500, 'Livestream course scope is missing.');
        }

        const allowed = await hasPrivateAccess(req.auth!.userId, String(livestream.courseId));
        if (!allowed) {
            return rejectWithAudit(req, res, String(livestream._id), deviceId, 403, 'Private livestream access denied.');
        }
    }

    const lockResult = await acquireJoinLock(String(livestream._id), req.auth!.userId, deviceId);
    if (!lockResult.allowed) {
        return rejectWithAudit(req, res, String(livestream._id), deviceId, 409, 'Another active device is already connected.');
    }

    const provider = await mintViewerToken(req.auth!.userId, livestream.livekitRoomName);
    const eventType = forceRejoin || lockResult.rejoin ? 'rejoin' : 'join';

    await LivestreamAttendance.create({
        livestreamId: livestream._id,
        userId: req.auth!.userId,
        deviceId,
        eventType,
    });

    return res.status(200).json({
        data: {
            livestreamId: livestream._id,
            status: livestream.status,
            accessMode: livestream.accessMode,
            rejoin: eventType === 'rejoin',
        },
        provider,
    });
};

export const joinLivestream = async (req: AuthenticatedRequest, res: Response) => {
    try {
        return await handleJoinLike(req, res, false);
    } catch (error: any) {
        return res.status(500).json({ error: error.message || 'Server error.' });
    }
};

export const rejoinLivestream = async (req: AuthenticatedRequest, res: Response) => {
    try {
        return await handleJoinLike(req, res, true);
    } catch (error: any) {
        return res.status(500).json({ error: error.message || 'Server error.' });
    }
};

export const leaveLivestream = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { deviceId } = req.body;
        if (!deviceId || typeof deviceId !== 'string') {
            return res.status(400).json({ error: 'deviceId is required.' });
        }

        const livestream = await LivestreamSession.findById(req.params.livestreamId).select('_id').lean();
        if (!livestream) {
            return res.status(404).json({ error: 'Livestream not found.' });
        }

        await releaseJoinLock(String(livestream._id), req.auth!.userId, deviceId);

        await LivestreamAttendance.create({
            livestreamId: livestream._id,
            userId: req.auth!.userId,
            deviceId,
            eventType: 'leave',
        });

        return res.status(200).json({ data: { released: true } });
    } catch (error: any) {
        return res.status(500).json({ error: error.message || 'Server error.' });
    }
};