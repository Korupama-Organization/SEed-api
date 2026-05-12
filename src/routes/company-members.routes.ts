import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware";
import {
  createMember,
  deleteMember,
  getMember,
  listMembers,
  updateMember,
} from "../controllers/company-members.controller";

const router = Router();

/**
 * @swagger
 * /api/company-members:
 *   get:
 *     summary: List all members of current user's company
 *     tags: [Company Members]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of company members
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 companyId:
 *                   type: string
 *                 members:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       userId:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           fullName:
 *                             type: string
 *                           email:
 *                             type: string
 *                           avatarUrl:
 *                             type: string
 *                           role:
 *                             type: string
 *                           status:
 *                             type: string
 *                       membershipRole:
 *                         type: string
 *                       jobTitle:
 *                         type: string
 *                       permission:
 *                         type: object
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User has not joined any company
 *       500:
 *         description: Server error
 */
router.get("/", requireAuth, listMembers);

/**
 * @swagger
 * /api/company-members/{memberId}:
 *   get:
 *     summary: Get a company member by ID
 *     tags: [Company Members]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: memberId
 *         required: true
 *         schema:
 *           type: string
 *         description: Member ID
 *     responses:
 *       200:
 *         description: Member details
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Member not found
 *       500:
 *         description: Server error
 */
router.get("/:memberId", requireAuth, getMember);

/**
 * @swagger
 * /api/company-members:
 *   post:
 *     summary: Add a new member (recruiter/interviewer) to the company
 *     tags: [Company Members]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - membershipRole
 *               - jobTitle
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email of the user to add
 *                 example: recruiter@example.com
 *               membershipRole:
 *                 type: string
 *                 enum: [recruiter, interviewer]
 *                 description: Role within the company
 *                 example: recruiter
 *               jobTitle:
 *                 type: string
 *                 description: Job title in the company
 *                 example: Senior Recruiter
 *               permission:
 *                 type: object
 *                 properties:
 *                   canCreateJob:
 *                     type: boolean
 *                     example: true
 *                   canUpdateJob:
 *                     type: boolean
 *                     example: true
 *                   canDeleteJob:
 *                     type: boolean
 *                     example: false
 *                   canViewApplications:
 *                     type: boolean
 *                     example: true
 *                   canUpdateApplicationStatus:
 *                     type: boolean
 *                     example: true
 *                   canScheduleInterviews:
 *                     type: boolean
 *                     example: false
 *     responses:
 *       201:
 *         description: Member added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 member:
 *                   type: object
 *       400:
 *         description: Invalid payload
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Only manager can perform this action
 *       404:
 *         description: User not found
 *       409:
 *         description: User already a member
 *       500:
 *         description: Server error
 */
router.post("/", requireAuth, createMember);

/**
 * @swagger
 * /api/company-members/{memberId}:
 *   patch:
 *     summary: Update a company member's role, job title, or permissions
 *     tags: [Company Members]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: memberId
 *         required: true
 *         schema:
 *           type: string
 *         description: Member ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               membershipRole:
 *                 type: string
 *                 enum: [manager, recruiter, interviewer]
 *               jobTitle:
 *                 type: string
 *               permission:
 *                 type: object
 *                 properties:
 *                   canCreateJob:
 *                     type: boolean
 *                   canUpdateJob:
 *                     type: boolean
 *                   canDeleteJob:
 *                     type: boolean
 *                   canViewApplications:
 *                     type: boolean
 *                   canUpdateApplicationStatus:
 *                     type: boolean
 *                   canScheduleInterviews:
 *                     type: boolean
 *     responses:
 *       200:
 *         description: Member updated successfully
 *       400:
 *         description: Invalid payload
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Only manager can perform this action
 *       404:
 *         description: Member not found
 *       500:
 *         description: Server error
 */
router.patch("/:memberId", requireAuth, updateMember);

/**
 * @swagger
 * /api/company-members/{memberId}:
 *   delete:
 *     summary: Remove a member from the company
 *     tags: [Company Members]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: memberId
 *         required: true
 *         schema:
 *           type: string
 *         description: Member ID
 *     responses:
 *       200:
 *         description: Member removed successfully
 *       400:
 *         description: Cannot remove yourself
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Only manager can perform this action
 *       404:
 *         description: Member not found
 *       500:
 *         description: Server error
 */
router.delete("/:memberId", requireAuth, deleteMember);

export default router;
