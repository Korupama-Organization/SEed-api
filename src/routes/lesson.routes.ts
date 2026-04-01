import { Router } from 'express';
import {
    createLesson,
    deleteLesson,
    getLessonById,
    listLessons,
    updateLesson,
} from '../controllers/lesson.controller';
import { requireAuth, AuthenticatedRequest } from '../middlewares/auth.middleware';
import { requireOwnership, requireRole } from '../middlewares/domain-authorization.middleware';
import { Course } from '../models/Course';
import { Lesson } from '../models/Lesson';

const router = Router();

/**
 * @swagger
 * /api/lessons:
 *   get:
 *     summary: List lessons
 *     tags: [Lessons]
 *     responses:
 *       200:
 *         description: List of lessons
 */
router.get('/', listLessons);

/**
 * @swagger
 * /api/lessons/{lessonId}:
 *   get:
 *     summary: Get lesson by id
 *     tags: [Lessons]
 *     parameters:
 *       - in: path
 *         name: lessonId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lesson detail
 *       404:
 *         description: Lesson not found
 */
router.get('/:lessonId', getLessonById);

/**
 * @swagger
 * /api/lessons:
 *   post:
 *     summary: Create lesson (teacher course owner)
 *     tags: [Lessons]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       201:
 *         description: Lesson created
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.post(
    '/',
    requireAuth,
    requireRole('teacher'),
    requireOwnership({
        getOwnerId: async (req: AuthenticatedRequest) => {
            const course = await Course.findById(req.body.courseId).select('instructor').lean();
            return course ? String(course.instructor) : null;
        },
    }),
    createLesson,
);

/**
 * @swagger
 * /api/lessons/{lessonId}:
 *   put:
 *     summary: Update lesson (teacher course owner)
 *     tags: [Lessons]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: lessonId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lesson updated
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.put(
    '/:lessonId',
    requireAuth,
    requireRole('teacher'),
    requireOwnership({
        getOwnerId: async (req: AuthenticatedRequest) => {
            const lesson = await Lesson.findById(req.params.lessonId).select('courseId').lean();
            if (!lesson) {
                return null;
            }

            const course = await Course.findById(lesson.courseId).select('instructor').lean();
            return course ? String(course.instructor) : null;
        },
    }),
    updateLesson,
);

/**
 * @swagger
 * /api/lessons/{lessonId}:
 *   delete:
 *     summary: Delete lesson (teacher course owner)
 *     tags: [Lessons]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: lessonId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lesson deleted
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.delete(
    '/:lessonId',
    requireAuth,
    requireRole('teacher'),
    requireOwnership({
        getOwnerId: async (req: AuthenticatedRequest) => {
            const lesson = await Lesson.findById(req.params.lessonId).select('courseId').lean();
            if (!lesson) {
                return null;
            }

            const course = await Course.findById(lesson.courseId).select('instructor').lean();
            return course ? String(course.instructor) : null;
        },
    }),
    deleteLesson,
);

export default router;
