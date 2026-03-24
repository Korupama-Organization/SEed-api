import express from 'express';
import request from 'supertest';
import livestreamRoutes from '../../../src/routes/livestream.routes';

type SessionRow = {
    _id: string;
    status: 'scheduled' | 'live' | 'paused' | 'ended' | 'cancelled';
    accessMode: 'public' | 'private';
    teacherId: string;
    livekitRoomName: string;
};

const sessions = new Map<string, SessionRow>();
const livestreamFindById = jest.fn();
const attendanceCreate = jest.fn();
const attendanceFindOne = jest.fn();
const attendanceFind = jest.fn();
const acquireJoinLock = jest.fn();

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

        if (token === 'removed-student-token') {
            req.auth = { userId: 'student-removed', role: 'student', payload: {} };
            return next();
        }

        if (token === 'admin-token') {
            req.auth = { userId: 'admin-1', role: 'admin', payload: {} };
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
        find: (...args: any[]) => attendanceFind(...args),
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

const mintViewerToken = jest.fn();
jest.mock('../../../src/services/livekit/livekit-client', () => ({
    ensureRoom: jest.fn(),
    closeRoom: jest.fn(),
    mintTeacherToken: jest.fn(),
    mintViewerToken: (...args: any[]) => mintViewerToken(...args),
}));

jest.mock('../../../src/services/livestream/session-lock.service', () => ({
    acquireJoinLock: (...args: any[]) => acquireJoinLock(...args),
    releaseJoinLock: jest.fn(),
    refreshJoinLock: jest.fn(),
}));

const leanResult = (value: any) => ({
    select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue(value),
    }),
    lean: jest.fn().mockResolvedValue(value),
});

const makeFindChain = (rows: any[]) => ({
    sort: jest.fn().mockReturnValue({
        limit: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue(rows),
        }),
    }),
});

describe('livestream presence and realtime event routes', () => {
    const app = express();
    app.use(express.json());
    app.use('/api/livestreams', livestreamRoutes);

    beforeEach(() => {
        jest.clearAllMocks();
        sessions.clear();

        sessions.set('live-1', {
            _id: 'live-1',
            status: 'live',
            accessMode: 'public',
            teacherId: 'teacher-1',
            livekitRoomName: 'room-live-1',
        });

        livestreamFindById.mockImplementation((id: string) => {
            return leanResult(sessions.get(id) || null);
        });

        attendanceFindOne.mockImplementation((query: any) => ({
            select: jest.fn().mockReturnValue({
                lean: jest.fn().mockResolvedValue(query.userId === 'student-removed' ? { _id: 'removed-1' } : null),
            }),
        }));

        attendanceFind.mockReturnValue(
            makeFindChain([
                { _id: 'e1', livestreamId: 'live-1', eventType: 'join', userId: 'student-1', createdAt: new Date('2026-01-01T00:00:00.000Z') },
                { _id: 'e2', livestreamId: 'live-1', eventType: 'control', userId: 'teacher-1', reason: 'paused', createdAt: new Date('2026-01-01T00:01:00.000Z') },
            ]),
        );

        attendanceCreate.mockResolvedValue(undefined);
        mintViewerToken.mockResolvedValue({ token: 'viewer-token', roomName: 'room-live-1', url: 'wss://livekit.test' });
        acquireJoinLock
            .mockResolvedValueOnce({ allowed: true, rejoin: false })
            .mockResolvedValueOnce({ allowed: true, rejoin: true });
    });

    it('allows same-device rejoin and blocks removed users from rejoining', async () => {
        const join = await request(app)
            .post('/api/livestreams/live-1/join')
            .set('Authorization', 'Bearer student-token')
            .send({ deviceId: 'device-a' });

        const rejoin = await request(app)
            .post('/api/livestreams/live-1/rejoin')
            .set('Authorization', 'Bearer student-token')
            .send({ deviceId: 'device-a' });

        const removed = await request(app)
            .post('/api/livestreams/live-1/rejoin')
            .set('Authorization', 'Bearer removed-student-token')
            .send({ deviceId: 'device-r' });

        expect(join.status).toBe(200);
        expect(rejoin.status).toBe(200);
        expect(rejoin.body.data.rejoin).toBe(true);
        expect(removed.status).toBe(403);
    });

    it('returns ordered metadata events and applies role gating', async () => {
        const teacherFeed = await request(app)
            .get('/api/livestreams/live-1/events?limit=2&since=2026-01-01T00:00:00.000Z')
            .set('Authorization', 'Bearer teacher-token');

        const studentFeed = await request(app)
            .get('/api/livestreams/live-1/events?limit=2&cursor=507f1f77bcf86cd799439011')
            .set('Authorization', 'Bearer student-token');

        const adminFeed = await request(app)
            .get('/api/livestreams/live-1/events')
            .set('Authorization', 'Bearer admin-token');

        expect(teacherFeed.status).toBe(200);
        expect(studentFeed.status).toBe(200);
        expect(adminFeed.status).toBe(403);

        expect(teacherFeed.body.data[0].eventType).toBe('join');
        expect(teacherFeed.body.data[1].eventType).toBe('control');
    });
});
