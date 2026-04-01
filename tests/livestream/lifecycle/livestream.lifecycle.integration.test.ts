import express from 'express';
import request from 'supertest';
import livestreamRoutes from '../../../src/routes/livestream.routes';

type SessionRow = {
    _id: string;
    title: string;
    teacherId: string;
    accessMode: 'public' | 'private';
    status: 'scheduled' | 'live' | 'ended' | 'cancelled';
    livekitRoomName: string;
    courseId?: string;
    startedAt?: Date;
    endedAt?: Date;
    cancelledAt?: Date;
    save: jest.Mock<Promise<SessionRow>, []>;
};

const sessionStore = new Map<string, SessionRow>();
const sessionCreate = jest.fn();
const sessionFindById = jest.fn();

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
        create: (...args: any[]) => sessionCreate(...args),
        findById: (...args: any[]) => sessionFindById(...args),
    },
}));

const ensureRoom = jest.fn();
const closeRoom = jest.fn();
const mintTeacherToken = jest.fn();

jest.mock('../../../src/services/livekit/livekit-client', () => ({
    ensureRoom: (...args: any[]) => ensureRoom(...args),
    closeRoom: (...args: any[]) => closeRoom(...args),
    mintTeacherToken: (...args: any[]) => mintTeacherToken(...args),
    mintViewerToken: jest.fn(),
}));

const makeSession = (seed: Partial<SessionRow>): SessionRow => {
    const row: SessionRow = {
        _id: seed._id || 'session-1',
        title: seed.title || 'Test livestream',
        teacherId: seed.teacherId || 'teacher-1',
        accessMode: seed.accessMode || 'public',
        status: seed.status || 'scheduled',
        livekitRoomName: seed.livekitRoomName || 'livestream-session-1',
        courseId: seed.courseId,
        startedAt: seed.startedAt,
        endedAt: seed.endedAt,
        cancelledAt: seed.cancelledAt,
        save: jest.fn(async () => {
            sessionStore.set(row._id, row);
            return row;
        }),
    };

    return row;
};

describe('livestream lifecycle routes', () => {
    const app = express();
    app.use(express.json());
    app.use('/api/livestreams', livestreamRoutes);

    beforeEach(() => {
        jest.clearAllMocks();
        sessionStore.clear();

        sessionCreate.mockImplementation(async (payload: any) => {
            const row = makeSession({
                _id: String(payload._id || 'session-1'),
                title: payload.title,
                teacherId: String(payload.teacherId),
                accessMode: payload.accessMode,
                status: payload.status,
                livekitRoomName: payload.livekitRoomName,
                courseId: payload.courseId,
            });
            sessionStore.set(row._id, row);
            return row;
        });

        sessionFindById.mockImplementation(async (id: string) => {
            return sessionStore.get(id) || null;
        });

        ensureRoom.mockResolvedValue({ roomName: 'livestream-session-1' });
        closeRoom.mockResolvedValue(undefined);
        mintTeacherToken.mockResolvedValue({ token: 'teacher-token', roomName: 'livestream-session-1', url: 'wss://livekit.test' });
    });

    it('persists teacher-created session with access mode and scheduled state', async () => {
        const response = await request(app)
            .post('/api/livestreams')
            .set('Authorization', 'Bearer teacher-token')
            .send({
                title: 'Private class',
                accessMode: 'private',
                courseId: '507f191e810c19729de860ea',
            });

        expect(response.status).toBe(201);
        expect(response.body.data.status).toBe('scheduled');
        expect(response.body.data.accessMode).toBe('private');
    });

    it('enforces scheduled to live to ended transitions and treats ended as terminal', async () => {
        const created = await request(app)
            .post('/api/livestreams')
            .set('Authorization', 'Bearer teacher-token')
            .send({ title: 'Class A', accessMode: 'public' });

        const id = created.body.data._id;

        const start = await request(app)
            .patch(`/api/livestreams/${id}/start`)
            .set('Authorization', 'Bearer teacher-token');
        const end = await request(app)
            .patch(`/api/livestreams/${id}/end`)
            .set('Authorization', 'Bearer teacher-token');
        const restart = await request(app)
            .patch(`/api/livestreams/${id}/start`)
            .set('Authorization', 'Bearer teacher-token');

        expect(start.status).toBe(200);
        expect(end.status).toBe(200);
        expect(end.body.data.status).toBe('ended');
        expect(restart.status).toBe(409);
    });

    it('rejects non-teacher lifecycle control and verifies adapter calls', async () => {
        const studentCreate = await request(app)
            .post('/api/livestreams')
            .set('Authorization', 'Bearer student-token')
            .send({ title: 'Nope', accessMode: 'public' });

        const created = await request(app)
            .post('/api/livestreams')
            .set('Authorization', 'Bearer teacher-token')
            .send({ title: 'Class B', accessMode: 'public' });

        const id = created.body.data._id;

        const start = await request(app)
            .patch(`/api/livestreams/${id}/start`)
            .set('Authorization', 'Bearer teacher-token');
        const cancel = await request(app)
            .patch(`/api/livestreams/${id}/cancel`)
            .set('Authorization', 'Bearer teacher-token');
        const studentEnd = await request(app)
            .patch(`/api/livestreams/${id}/end`)
            .set('Authorization', 'Bearer student-token');

        expect(studentCreate.status).toBe(403);
        expect(studentEnd.status).toBe(403);
        expect(start.status).toBe(200);
        expect(cancel.status).toBe(200);

        expect(ensureRoom).toHaveBeenCalledTimes(1);
        expect(mintTeacherToken).toHaveBeenCalledTimes(1);
        expect(closeRoom).toHaveBeenCalledTimes(1);
    });
});
