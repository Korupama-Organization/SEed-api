import { Router } from 'express';
import {
    createCourse,
    deleteCourse,
    getCourseById,
    listCourses,
    updateCourse,
} from '../controllers/course.controller';
import { requireAuth, AuthenticatedRequest } from '../middlewares/auth.middleware';
import { requireOwnership, requireRole } from '../middlewares/domain-authorization.middleware';
import { Course } from '../models/Course';

const router = Router();

/**
 * @swagger
 * /api/courses:
 *   get:
 *     summary: List courses
 *     tags: [Courses]
 *     responses:
 *       200:
 *         description: List of courses
 */
router.get('/', listCourses);

/**
 * @swagger
 * /api/courses/{courseId}:
 *   get:
 *     summary: Get course by id
 *     tags: [Courses]
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Course detail
 *       404:
 *         description: Course not found
 */
router.get('/:courseId', getCourseById);

/**
 * @swagger
 * /api/courses:
 *   post:
 *     summary: Create course (teacher only)
 *     tags: [Courses]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       201:
 *         description: Course created
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.post('/', requireAuth, requireRole('teacher'), createCourse);

/**
 * @swagger
 * /api/courses/{courseId}:
 *   put:
 *     summary: Update course (teacher owner only)
 *     tags: [Courses]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Course updated
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.put(
    '/:courseId',
    requireAuth,
    requireRole('teacher'),
    requireOwnership({
        getOwnerId: async (req: AuthenticatedRequest) => {
            const course = await Course.findById(req.params.courseId).select('instructor').lean();
            return course ? String(course.instructor) : null;
        },
    }),
    updateCourse,
);

/**
 * @swagger
 * /api/courses/{courseId}:
 *   delete:
 *     summary: Delete course (teacher owner only)
 *     tags: [Courses]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Course deleted
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.delete(
    '/:courseId',
    requireAuth,
    requireRole('teacher'),
    requireOwnership({
        getOwnerId: async (req: AuthenticatedRequest) => {
            const course = await Course.findById(req.params.courseId).select('instructor').lean();
            return course ? String(course.instructor) : null;
        },
    }),
    deleteCourse,
);

export default router;
