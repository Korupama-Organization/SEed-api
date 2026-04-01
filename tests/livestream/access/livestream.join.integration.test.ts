import express from 'express';
import request from 'supertest';
import livestreamRoutes from '../../../src/routes/livestream.routes';

type SessionRow = {
    _id: string;
    status: 'scheduled' | 'live' | 'ended' | 'cancelled';
    accessMode: 'public' | 'private';
    teacherId: string;
    livekitRoomName: string;
    courseId?: string;
};

const sessions = new Map<string, SessionRow>();
const livestreamFindById = jest.fn();
const enrollmentFindOne = jest.fn();
const orderFindOne = jest.fn();
const attendanceCreate = jest.fn();

jest.mock('../../../src/middlewares/auth.middleware', () => ({
    requireAuth: (req: any, res: any, next: any) => {
        const header = req.headers.authorization;
        if (!header?.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Authentication required.' });
        }

        const token = header.slice(7);
        if (token === 'student-token') {
            req.auth = { userId: 'student-1', role: 'student', payload: {} };
            return next();
        }

        if (token === 'other-student-token') {
            req.auth = { userId: 'student-2', role: 'student', payload: {} };
            return next();
        }

        if (token === 'teacher-token') {
            req.auth = { userId: 'teacher-1', role: 'teacher', payload: {} };
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

jest.mock('../../../src/models/Enrollment', () => ({
    Enrollment: {
        findOne: (...args: any[]) => enrollmentFindOne(...args),
    },
}));

jest.mock('../../../src/models/Order', () => ({
    Order: {
        findOne: (...args: any[]) => orderFindOne(...args),
    },
}));

jest.mock('../../../src/models/LivestreamAttendance', () => ({
    LivestreamAttendance: {
        create: (...args: any[]) => attendanceCreate(...args),
    },
}));

const mintViewerToken = jest.fn();
jest.mock('../../../src/services/livekit/livekit-client', () => ({
    ensureRoom: jest.fn(),
    closeRoom: jest.fn(),
    mintTeacherToken: jest.fn(),
    mintViewerToken: (...args: any[]) => mintViewerToken(...args),
}));

const acquireJoinLock = jest.fn();
const releaseJoinLock = jest.fn();
jest.mock('../../../src/services/livestream/session-lock.service', () => ({
    acquireJoinLock: (...args: any[]) => acquireJoinLock(...args),
    releaseJoinLock: (...args: any[]) => releaseJoinLock(...args),
    refreshJoinLock: jest.fn(),
}));

const leanResult = (value: any) => ({
    select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue(value),
    }),
    lean: jest.fn().mockResolvedValue(value),
});

describe('livestream join access routes', () => {
    const app = express();
    app.use(express.json());
    app.use('/api/livestreams', livestreamRoutes);

    beforeEach(() => {
        jest.clearAllMocks();
        sessions.clear();

        const livePublic: SessionRow = {
            _id: 'live-public-1',
            status: 'live',
            accessMode: 'public',
            teacherId: 'teacher-1',
            livekitRoomName: 'room-public-1',
        };

        const scheduledPublic: SessionRow = {
            _id: 'scheduled-public-1',
            status: 'scheduled',
            accessMode: 'public',
            teacherId: 'teacher-1',
            livekitRoomName: 'room-scheduled-1',
        };

        const endedPublic: SessionRow = {
            _id: 'ended-public-1',
            status: 'ended',
            accessMode: 'public',
            teacherId: 'teacher-1',
            livekitRoomName: 'room-ended-1',
        };

        const privateLive: SessionRow = {
            _id: 'live-private-1',
            status: 'live',
            accessMode: 'private',
            teacherId: 'teacher-1',
            livekitRoomName: 'room-private-1',
            courseId: 'course-1',
        };

        [livePublic, scheduledPublic, endedPublic, privateLive].forEach((row) => {
            sessions.set(row._id, row);
        });

        livestreamFindById.mockImplementation((id: string) => {
            return leanResult(sessions.get(id) || null);
        });

        enrollmentFindOne.mockReturnValue({
            select: jest.fn().mockReturnValue({
                lean: jest.fn().mockResolvedValue(null),
            }),
        });

        orderFindOne.mockReturnValue({
            select: jest.fn().mockReturnValue({
                lean: jest.fn().mockResolvedValue(null),
            }),
        });

        attendanceCreate.mockResolvedValue(undefined);
        mintViewerToken.mockResolvedValue({ token: 'viewer-token', roomName: 'room-public-1', url: 'wss://livekit.test' });
        acquireJoinLock.mockResolvedValue({ allowed: true, rejoin: false });
        releaseJoinLock.mockResolvedValue(true);
    });

    it('rejects join attempts before teacher starts and after stream ended', async () => {
        const beforeStart = await request(app)
            .post('/api/livestreams/scheduled-public-1/join')
            .set('Authorization', 'Bearer student-token')
            .send({ deviceId: 'device-a' });

        const afterEnd = await request(app)
            .post('/api/livestreams/ended-public-1/join')
            .set('Authorization', 'Bearer student-token')
            .send({ deviceId: 'device-a' });

        expect(beforeStart.status).toBe(409);
        expect(afterEnd.status).toBe(409);
        expect(mintViewerToken).not.toHaveBeenCalled();
    });

    it('enforces private purchase gate and allows authorized join', async () => {
        const denied = await request(app)
            .post('/api/livestreams/live-private-1/join')
            .set('Authorization', 'Bearer student-token')
            .send({ deviceId: 'device-a' });

        enrollmentFindOne.mockReturnValueOnce({
            select: jest.fn().mockReturnValue({
                lean: jest.fn().mockResolvedValue({ _id: 'enrollment-1' }),
            }),
        });

        const allowed = await request(app)
            .post('/api/livestreams/live-private-1/join')
            .set('Authorization', 'Bearer student-token')
            .send({ deviceId: 'device-a' });

        expect(denied.status).toBe(403);
        expect(allowed.status).toBe(200);
        expect(allowed.body.provider.token).toBe('viewer-token');
    });

    it('enforces single-device policy and allows rejoin from same device', async () => {
        acquireJoinLock
            .mockResolvedValueOnce({ allowed: true, rejoin: false })
            .mockResolvedValueOnce({ allowed: false, rejoin: false })
            .mockResolvedValueOnce({ allowed: true, rejoin: true });

        const first = await request(app)
            .post('/api/livestreams/live-public-1/join')
            .set('Authorization', 'Bearer student-token')
            .send({ deviceId: 'device-a' });

        const second = await request(app)
            .post('/api/livestreams/live-public-1/join')
            .set('Authorization', 'Bearer student-token')
            .send({ deviceId: 'device-b' });

        const rejoin = await request(app)
            .post('/api/livestreams/live-public-1/rejoin')
            .set('Authorization', 'Bearer student-token')
            .send({ deviceId: 'device-a' });

        expect(first.status).toBe(200);
        expect(second.status).toBe(409);
        expect(rejoin.status).toBe(200);
        expect(rejoin.body.data.rejoin).toBe(true);
    });
});
