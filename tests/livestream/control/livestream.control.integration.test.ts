import express from 'express';
import request from 'supertest';
import livestreamRoutes from '../../../src/routes/livestream.routes';

type SessionRow = {
    _id: string;
    teacherId: string;
    status: 'scheduled' | 'live' | 'paused' | 'ended' | 'cancelled';
    accessMode: 'public' | 'private';
    livekitRoomName: string;
    pausedAt?: Date;
    resumedAt?: Date;
    endedAt?: Date;
    save: jest.Mock<Promise<SessionRow>, []>;
};

const sessions = new Map<string, SessionRow>();
const livestreamFindById = jest.fn();
const attendanceCreate = jest.fn();
const closeRoom = jest.fn();

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

        if (token === 'other-teacher-token') {
            req.auth = { userId: 'teacher-2', role: 'teacher', payload: {} };
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
        findOne: jest.fn(),
        find: jest.fn(),
    },
}));

jest.mock('../../../src/services/livekit/livekit-client', () => ({
    ensureRoom: jest.fn(),
    closeRoom: (...args: any[]) => closeRoom(...args),
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

const makeSession = (seed: Partial<SessionRow>): SessionRow => {
    const row: SessionRow = {
        _id: seed._id || 'session-1',
        teacherId: seed.teacherId || 'teacher-1',
        status: seed.status || 'live',
        accessMode: seed.accessMode || 'public',
        livekitRoomName: seed.livekitRoomName || 'room-1',
        save: jest.fn(async () => {
            sessions.set(row._id, row);
            return row;
        }),
    };

    return row;
};

describe('livestream teacher control routes', () => {
    const app = express();
    app.use(express.json());
    app.use('/api/livestreams', livestreamRoutes);

    beforeEach(() => {
        jest.clearAllMocks();
        sessions.clear();

        const live = makeSession({ _id: 'live-1', status: 'live' });
        sessions.set(live._id, live);

        livestreamFindById.mockImplementation(async (id: string) => sessions.get(id) || null);
        attendanceCreate.mockResolvedValue(undefined);
        closeRoom.mockResolvedValue(undefined);
    });

    it('allows teacher to pause, resume, and force-end with control audit entries', async () => {
        const pause = await request(app)
            .patch('/api/livestreams/live-1/pause')
            .set('Authorization', 'Bearer teacher-token');

        const resume = await request(app)
            .patch('/api/livestreams/live-1/resume')
            .set('Authorization', 'Bearer teacher-token');

        const forceEnd = await request(app)
            .patch('/api/livestreams/live-1/force-end')
            .set('Authorization', 'Bearer teacher-token');

        expect(pause.status).toBe(200);
        expect(pause.body.data.status).toBe('paused');

        expect(resume.status).toBe(200);
        expect(resume.body.data.status).toBe('live');

        expect(forceEnd.status).toBe(200);
        expect(forceEnd.body.data.status).toBe('ended');
        expect(closeRoom).toHaveBeenCalledTimes(1);

        const actions = attendanceCreate.mock.calls.map((call: any[]) => call[0]?.metadata?.action);
        expect(actions).toEqual(['pause', 'resume', 'force-end']);
    });

    it('denies non-owner teacher and student for teacher controls', async () => {
        const nonOwner = await request(app)
            .patch('/api/livestreams/live-1/pause')
            .set('Authorization', 'Bearer other-teacher-token');

        const student = await request(app)
            .patch('/api/livestreams/live-1/pause')
            .set('Authorization', 'Bearer student-token');

        expect(nonOwner.status).toBe(403);
        expect(student.status).toBe(403);
    });

    it('records participant removal while stream is active', async () => {
        const remove = await request(app)
            .patch('/api/livestreams/live-1/participants/student-1/remove')
            .set('Authorization', 'Bearer teacher-token');

        expect(remove.status).toBe(200);
        expect(remove.body.data.removed).toBe(true);

        const removedCall = attendanceCreate.mock.calls.find((call: any[]) => call[0]?.eventType === 'removed');
        expect(removedCall).toBeTruthy();
        expect(removedCall?.[0]?.reason).toBe('removed-by-teacher');
    });
});
