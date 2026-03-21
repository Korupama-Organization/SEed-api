import express from 'express';
import request from 'supertest';
import courseRoutes from '../../../src/routes/course.routes';
import lessonRoutes from '../../../src/routes/lesson.routes';

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

const courseFind = jest.fn();
const courseFindById = jest.fn();
const courseCreate = jest.fn();
const courseFindByIdAndUpdate = jest.fn();
const courseFindByIdAndDelete = jest.fn();

jest.mock('../../../src/models/Course', () => ({
    Course: {
        find: (...args: any[]) => courseFind(...args),
        findById: (...args: any[]) => courseFindById(...args),
        create: (...args: any[]) => courseCreate(...args),
        findByIdAndUpdate: (...args: any[]) => courseFindByIdAndUpdate(...args),
        findByIdAndDelete: (...args: any[]) => courseFindByIdAndDelete(...args),
    },
}));

const lessonFind = jest.fn();
const lessonFindById = jest.fn();
const lessonCreate = jest.fn();
const lessonFindByIdAndUpdate = jest.fn();
const lessonFindByIdAndDelete = jest.fn();

jest.mock('../../../src/models/Lesson', () => ({
    Lesson: {
        find: (...args: any[]) => lessonFind(...args),
        findById: (...args: any[]) => lessonFindById(...args),
        create: (...args: any[]) => lessonCreate(...args),
        findByIdAndUpdate: (...args: any[]) => lessonFindByIdAndUpdate(...args),
        findByIdAndDelete: (...args: any[]) => lessonFindByIdAndDelete(...args),
    },
}));

const makeChain = (result: any) => ({
    select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue(result),
    }),
    lean: jest.fn().mockResolvedValue(result),
});

describe('course and lesson routes', () => {
    const app = express();
    app.use(express.json());
    app.use('/api/courses', courseRoutes);
    app.use('/api/lessons', lessonRoutes);

    beforeEach(() => {
        jest.clearAllMocks();

        courseFind.mockReturnValue({ lean: jest.fn().mockResolvedValue([]) });
        courseFindById.mockReturnValue(makeChain({ _id: 'course-1', instructor: 'teacher-1' }));
        courseCreate.mockResolvedValue({ _id: 'course-1' });
        courseFindByIdAndUpdate.mockReturnValue({ lean: jest.fn().mockResolvedValue({ _id: 'course-1' }) });
        courseFindByIdAndDelete.mockReturnValue({ lean: jest.fn().mockResolvedValue({ _id: 'course-1' }) });

        lessonFind.mockReturnValue({ lean: jest.fn().mockResolvedValue([]) });
        lessonFindById.mockReturnValue(makeChain({ _id: 'lesson-1', courseId: 'course-1' }));
        lessonCreate.mockResolvedValue({ _id: 'lesson-1' });
        lessonFindByIdAndUpdate.mockReturnValue({ lean: jest.fn().mockResolvedValue({ _id: 'lesson-1' }) });
        lessonFindByIdAndDelete.mockReturnValue({ lean: jest.fn().mockResolvedValue({ _id: 'lesson-1' }) });
    });

    it('allows public GET on courses and lessons', async () => {
        const c = await request(app).get('/api/courses');
        const l = await request(app).get('/api/lessons');

        expect(c.status).toBe(200);
        expect(l.status).toBe(200);
    });

    it('rejects unauthenticated course mutation with 401', async () => {
        const response = await request(app).post('/api/courses').send({
            title: 'Course A',
            slug: 'course-a',
            price: 100,
        });

        expect(response.status).toBe(401);
    });

    it('rejects non-teacher course mutation with 403', async () => {
        const response = await request(app)
            .post('/api/courses')
            .set('Authorization', 'Bearer student-token')
            .send({ title: 'Course A', slug: 'course-a', price: 100 });

        expect(response.status).toBe(403);
    });

    it('allows teacher course creation and lesson creation', async () => {
        const c = await request(app)
            .post('/api/courses')
            .set('Authorization', 'Bearer teacher-token')
            .send({ title: 'Course A', slug: 'course-a', price: 100 });

        const l = await request(app)
            .post('/api/lessons')
            .set('Authorization', 'Bearer teacher-token')
            .send({ courseId: 'course-1', title: 'L1', type: 'video' });

        expect(c.status).toBe(201);
        expect(l.status).toBe(201);
    });
});
