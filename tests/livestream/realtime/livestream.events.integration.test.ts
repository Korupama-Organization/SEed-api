import express from 'express';
import request from 'supertest';
import livestreamRoutes from '../../../src/routes/livestream.routes';

type SessionRow = {
    _id: string;
    teacherId: string;
};

const sessions = new Map<string, SessionRow>();
const livestreamFindById = jest.fn();
const attendanceFind = jest.fn();

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
        create: jest.fn(),
        findOne: jest.fn(),
        find: (...args: any[]) => attendanceFind(...args),
    },
}));

jest.mock('../../../src/services/livekit/livekit-client', () => ({
    ensureRoom: jest.fn(),
    closeRoom: jest.fn(),
    mintTeacherToken: jest.fn(),
    mintViewerToken: jest.fn(),
}));

jest.mock('../../../src/models/Enrollment', () => ({
    Enrollment: {
        findOne: jest.fn(),
    },
}));

jest.mock('../../../src/models/Order', () => ({
    Order: {
        findOne: jest.fn(),
    },
}));

jest.mock('../../../src/services/livestream/session-lock.service', () => ({
    acquireJoinLock: jest.fn(),
    releaseJoinLock: jest.fn(),
    refreshJoinLock: jest.fn(),
}));

const makeFindChain = (rows: any[]) => ({
    sort: jest.fn().mockReturnValue({
        limit: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue(rows),
        }),
    }),
});

describe('livestream realtime event feed routes', () => {
    const app = express();
    app.use(express.json());
    app.use('/api/livestreams', livestreamRoutes);

    beforeEach(() => {
        jest.clearAllMocks();
        sessions.clear();

        sessions.set('live-1', { _id: 'live-1', teacherId: 'teacher-1' });

        livestreamFindById.mockImplementation((id: string) => ({
            select: jest.fn().mockReturnValue({
                lean: jest.fn().mockResolvedValue(sessions.get(id) || null),
            }),
        }));

        attendanceFind.mockReturnValue(
            makeFindChain([
                { _id: 'e1', livestreamId: 'live-1', eventType: 'join', userId: 'student-1' },
                { _id: 'e2', livestreamId: 'live-1', eventType: 'control', userId: 'teacher-1', reason: 'paused' },
            ]),
        );
    });

    it('returns ordered event feed for teacher and student roles', async () => {
        const teacherResponse = await request(app)
            .get('/api/livestreams/live-1/events?limit=2')
            .set('Authorization', 'Bearer teacher-token');

        const studentResponse = await request(app)
            .get('/api/livestreams/live-1/events?limit=2')
            .set('Authorization', 'Bearer student-token');

        expect(teacherResponse.status).toBe(200);
        expect(studentResponse.status).toBe(200);
        expect(teacherResponse.body.data).toHaveLength(2);
        expect(teacherResponse.body.data[0].eventType).toBe('join');
        expect(teacherResponse.body.data[1].eventType).toBe('control');
    });

    it('rejects unsupported roles from event feed access', async () => {
        const adminResponse = await request(app)
            .get('/api/livestreams/live-1/events')
            .set('Authorization', 'Bearer admin-token');

        expect(adminResponse.status).toBe(403);
    });
});
