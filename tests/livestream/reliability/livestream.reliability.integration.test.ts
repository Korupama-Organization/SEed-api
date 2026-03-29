import express from 'express';
import request from 'supertest';
import livestreamRoutes from '../../../src/routes/livestream.routes';

type SessionRow = {
    _id: string;
    teacherId: string;
    status: 'scheduled' | 'live' | 'paused' | 'ended' | 'cancelled';
    accessMode: 'public' | 'private';
    livekitRoomName: string;
    startedAt?: Date;
    endedAt?: Date;
    save: jest.Mock<Promise<SessionRow>, []>;
};

const sessions = new Map<string, SessionRow>();
const livestreamFindById = jest.fn();
const attendanceCreate = jest.fn();
const attendanceFindOne = jest.fn();
const acquireJoinLock = jest.fn();
const mintViewerToken = jest.fn();
const ensureRoom = jest.fn();
const closeRoom = jest.fn();
const mintTeacherToken = jest.fn();

jest.mock('../../../src/middlewares/auth.middleware', () => ({
    requireAuth: (req: any, res: any, next: any) => {
        const header = req.headers.authorization;
        if (!header?.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Authentication required.' });
        }

        const token = header.slice(7);
        if (token === 'teacher-token') {
            req.auth = { userId: 'teacher-1', role: 'teacher', payload: {} };
            return next();
        }

        if (token === 'student-token') {
            req.auth = { userId: 'student-1', role: 'student', payload: {} };
            return next();
        }

        return res.status(401).json({ error: 'Authentication required.' });
    },
}));

jest.mock('../../../src/models/LivestreamSession', () => ({
    LivestreamSession: {
        create: jest.fn(),
        findById: (...args: any[]) => livestreamFindById(...args),
    },
}));

jest.mock('../../../src/models/LivestreamAttendance', () => ({
    LivestreamAttendance: {
        create: (...args: any[]) => attendanceCreate(...args),
        findOne: (...args: any[]) => attendanceFindOne(...args),
        find: jest.fn(),
    },
}));

jest.mock('../../../src/models/Enrollment', () => ({
    Enrollment: {
        findOne: jest.fn(() => ({
            select: jest.fn().mockReturnValue({
                lean: jest.fn().mockResolvedValue(null),
            }),
        })),
    },
}));

jest.mock('../../../src/models/Order', () => ({
    Order: {
        findOne: jest.fn(() => ({
            select: jest.fn().mockReturnValue({
                lean: jest.fn().mockResolvedValue(null),
            }),
        })),
    },
}));

jest.mock('../../../src/services/livestream/session-lock.service', () => ({
    acquireJoinLock: (...args: any[]) => acquireJoinLock(...args),
    releaseJoinLock: jest.fn(),
    refreshJoinLock: jest.fn(),
}));

jest.mock('../../../src/services/livekit/livekit-client', () => ({
    ensureRoom: (...args: any[]) => ensureRoom(...args),
    closeRoom: (...args: any[]) => closeRoom(...args),
    mintTeacherToken: (...args: any[]) => mintTeacherToken(...args),
    mintViewerToken: (...args: any[]) => mintViewerToken(...args),
}));

const withQueryHelpers = (row: SessionRow | null): any => {
    if (!row) {
        return null;
    }

    return Object.assign(row, {
        lean: jest.fn().mockResolvedValue(row),
        select: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue(row),
        }),
    });
};

const makeSession = (seed: Partial<SessionRow>): SessionRow => {
    const row: SessionRow = {
        _id: seed._id || 'session-1',
        teacherId: seed.teacherId || 'teacher-1',
        status: seed.status || 'scheduled',
        accessMode: seed.accessMode || 'public',
        livekitRoomName: seed.livekitRoomName || 'room-1',
        startedAt: seed.startedAt,
        endedAt: seed.endedAt,
        save: jest.fn(async () => {
            sessions.set(row._id, row);
            return row;
        }),
    };

    return row;
};

describe('livestream reliability regression routes', () => {
    const app = express();
    app.use(express.json());
    app.use('/api/livestreams', livestreamRoutes);

    beforeEach(() => {
        jest.clearAllMocks();
        sessions.clear();

        const scheduled = makeSession({ _id: 'scheduled-1', status: 'scheduled' });
        const live = makeSession({ _id: 'live-1', status: 'live' });
        sessions.set(scheduled._id, scheduled);
        sessions.set(live._id, live);

        livestreamFindById.mockImplementation((id: string) => {
            return withQueryHelpers(sessions.get(id) || null);
        });

        attendanceFindOne.mockReturnValue({
            select: jest.fn().mockReturnValue({
                lean: jest.fn().mockResolvedValue(null),
            }),
        });

        attendanceCreate.mockResolvedValue(undefined);
        acquireJoinLock.mockResolvedValue({ allowed: true, rejoin: false });
        mintViewerToken.mockResolvedValue({ token: 'viewer-token', roomName: 'room-1', url: 'wss://livekit.test' });
        ensureRoom.mockResolvedValue({ roomName: 'room-1' });
        closeRoom.mockResolvedValue(undefined);
        mintTeacherToken.mockResolvedValue({ token: 'teacher-token', roomName: 'room-1', url: 'wss://livekit.test' });
    });

    it('fails join closed when redis lock dependency is unavailable', async () => {
        acquireJoinLock.mockRejectedValueOnce(new Error('redis unavailable'));

        const response = await request(app)
            .post('/api/livestreams/live-1/join')
            .set('Authorization', 'Bearer student-token')
            .send({ deviceId: 'device-a' });

        expect(response.status).toBe(503);
        expect(response.body.error).toBe('Livestream join temporarily unavailable.');

        const eventTypes = attendanceCreate.mock.calls.map((call: any[]) => call[0]?.eventType);
        expect(eventTypes).toContain('reject');
        expect(eventTypes).not.toContain('join');
        expect(mintViewerToken).not.toHaveBeenCalled();
    });

    it('returns provider unavailable and keeps scheduled state when start dependency fails', async () => {
        ensureRoom.mockRejectedValueOnce(new Error('provider down'));

        const start = await request(app)
            .patch('/api/livestreams/scheduled-1/start')
            .set('Authorization', 'Bearer teacher-token');

        expect(start.status).toBe(503);
        expect(start.body.error).toBe('Livestream provider unavailable.');

        const scheduled = sessions.get('scheduled-1')!;
        expect(scheduled.status).toBe('scheduled');
        expect(scheduled.save).not.toHaveBeenCalled();
    });

    it('returns provider unavailable and avoids control audit write when force-end fails', async () => {
        closeRoom.mockRejectedValueOnce(new Error('provider down'));

        const forceEnd = await request(app)
            .patch('/api/livestreams/live-1/force-end')
            .set('Authorization', 'Bearer teacher-token');

        expect(forceEnd.status).toBe(503);
        expect(forceEnd.body.error).toBe('Livestream provider unavailable.');

        const live = sessions.get('live-1')!;
        expect(live.status).toBe('live');

        const controlWrites = attendanceCreate.mock.calls.filter((call: any[]) => call[0]?.eventType === 'control');
        expect(controlWrites).toHaveLength(0);
    });
});