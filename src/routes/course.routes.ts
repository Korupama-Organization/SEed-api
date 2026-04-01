import { Router } from 'express';
import {
    getCourseMetadata,
    saveCourseMetadata,
    saveScormCourseDraft,
} from '../controllers/course.controller';
import { requireAuth } from '../middlewares/auth.middleware';

const router = Router();

/**
 * @swagger
 * /api/courses/metadata:
 *   post:
 *     summary: Save or update course metadata in MongoDB
 *     tags: [Courses]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - courseId
 *               - courseInfo
 *               - metadata
 *             properties:
 *               courseId:
 *                 type: string
 *                 example: course_123
 *               courseInfo:
 *                 type: object
 *                 properties:
 *                   title:
 *                     type: string
 *                     example: Introduction to SCORM Authoring
 *                   subtitle:
 *                     type: string
 *                   description:
 *                     type: string
 *                   category:
 *                     type: string
 *                   level:
 *                     type: string
 *                   language:
 *                     type: string
 *                   estimatedHours:
 *                     type: string
 *               settings:
 *                 type: object
 *                 properties:
 *                   navigationMode:
 *                     type: string
 *                     enum: [linear, free]
 *                   passScore:
 *                     type: number
 *                   allowRetakes:
 *                     type: boolean
 *                   trackTimeSpent:
 *                     type: boolean
 *               metadata:
 *                 type: object
 *                 properties:
 *                   identifier:
 *                     type: string
 *                   version:
 *                     type: string
 *                   author:
 *                     type: string
 *                   keywords:
 *                     type: string
 *                   notes:
 *                     type: string
 *     responses:
 *       200:
 *         description: Course metadata updated successfully
 *       201:
 *         description: Course metadata saved successfully
 *       400:
 *         description: Missing or invalid metadata input
 *       500:
 *         description: Server error while saving metadata
 */
router.post('/metadata', requireAuth, saveCourseMetadata);

/**
 * @swagger
 * /api/courses/metadata/{courseId}:
 *   get:
 *     summary: Get saved course metadata by courseId
 *     tags: [Courses]
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Course metadata fetched successfully
 *       404:
 *         description: Course metadata not found
 *       500:
 *         description: Server error while fetching metadata
 */
router.get('/metadata/:courseId', getCourseMetadata);

/**
 * @swagger
 * /api/courses/scorm-drafts:
 *   post:
 *     summary: Save a full SCORM course draft after direct file uploads complete
 *     tags: [Courses]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: SCORM course saved successfully
 *       400:
 *         description: Missing or invalid draft input
 *       500:
 *         description: Server error while saving the SCORM course
 */
router.post('/scorm-drafts', requireAuth, saveScormCourseDraft);

export default router;
