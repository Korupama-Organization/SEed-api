import { Router } from "express";
import {
  createInterviewSessionHandler,
  updateInterviewSessionHandler,
} from "../controllers/interview-sessions.controller";
import { requireAuth } from "../middlewares/auth.middleware";

const router = Router();

/**
 * @swagger
 * /api/interview-sessions:
 *   post:
 *     summary: Create a new interview session
 *     tags: [InterviewSessions]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - jobId
 *               - candidateId
 *               - sessionType
 *               - interviewMode
 *               - status
 *               - startTime
 *               - endTime
 *             properties:
 *               jobId:
 *                 type: string
 *                 example: 6800c1a16541f34f61f7b111
 *               candidateId:
 *                 type: string
 *                 example: 6800c1a16541f34f61f7b222
 *               sessionType:
 *                 type: string
 *                 enum: [real, mock]
 *                 example: real
 *               interviewMode:
 *                 type: string
 *                 enum: [technical, behavioral, hr]
 *                 example: technical
 *               status:
 *                 type: string
 *                 enum: [scheduled, in_progress, coding_test, completed, cancelled]
 *                 example: coding_test
 *               conversations:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     question:
 *                       type: string
 *                     answer:
 *                       type: string
 *                     audioUrl:
 *                       type: string
 *                     evaluation:
 *                       type: object
 *                       properties:
 *                         score:
 *                           type: number
 *                         strengths:
 *                           type: array
 *                           items:
 *                             type: string
 *                         weaknesses:
 *                           type: array
 *                           items:
 *                             type: string
 *                         feedback:
 *                           type: string
 *                         intentCategory:
 *                           type: string
 *               finalReport:
 *                 type: object
 *                 properties:
 *                   overallScore:
 *                     type: number
 *                   technicalScore:
 *                     type: number
 *                   communicationScore:
 *                     type: number
 *                   confidenceScore:
 *                     type: number
 *                   aiSummary:
 *                     type: string
 *                   improvementAreas:
 *                     type: array
 *                     items:
 *                       type: string
 *               startTime:
 *                 type: string
 *                 format: date-time
 *                 example: 2026-05-01T09:00:00.000Z
 *               endTime:
 *                 type: string
 *                 format: date-time
 *                 example: 2026-05-01T10:00:00.000Z
 *     responses:
 *       201:
 *         description: Interview session created successfully
 *       400:
 *         description: Invalid payload
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post("/", requireAuth, createInterviewSessionHandler);

/**
 * @swagger
 * /api/interview-sessions/{id}:
 *   patch:
 *     summary: Update an interview session by id
 *     tags: [InterviewSessions]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: 6800c1a16541f34f61f7b999
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               jobId:
 *                 type: string
 *               candidateId:
 *                 type: string
 *               sessionType:
 *                 type: string
 *                 enum: [real, mock]
 *               interviewMode:
 *                 type: string
 *                 enum: [technical, behavioral, hr]
 *               status:
 *                 type: string
 *                 enum: [scheduled, in_progress, coding_test, completed, cancelled]
 *               conversations:
 *                 type: array
 *                 items:
 *                   type: object
 *               finalReport:
 *                 type: object
 *               startTime:
 *                 type: string
 *                 format: date-time
 *               endTime:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Interview session updated successfully
 *       400:
 *         description: Invalid payload
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Interview session not found
 *       500:
 *         description: Server error
 */
router.patch("/:id", requireAuth, updateInterviewSessionHandler);

export default router;
