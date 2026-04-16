import { Router } from "express";
import { getMyProfile } from "../controllers/users.controller";
import { requireAuth } from "../middlewares/auth.middleware";

const router = Router();

/**
 * @swagger
 * /api/users/me:
 *   get:
 *     summary: Get current user profile and company onboarding status
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Current user profile fetched successfully
 *         content:
 *           application/json:
 *             examples:
 *               existingCompanyMember:
 *                 summary: User already belongs to a company
 *                 value:
 *                   isNewbie: false
 *                   user:
 *                     _id: 6800bca16541f34f61f7a001
 *                     role: recruiter
 *                     authMethod: normal_auth
 *                     status: active
 *                     fullName: Nguyen Van A
 *                     contactInfo:
 *                       email: hr@seeds.example.com
 *                       phone: "0909123456"
 *                   companyId: 6800c1a16541f34f61f7b111
 *                   membershipRole: manager
 *                   permissions:
 *                     canCreateJob: true
 *                     canUpdateJob: true
 *                     canDeleteJob: true
 *                     canViewApplications: true
 *                     canUpdateApplicationStatus: true
 *                     canScheduleInterviews: true
 *                     canUpdateCompanyProfile: true
 *               newbieUser:
 *                 summary: User has not created company profile yet
 *                 value:
 *                   isNewbie: true
 *                   user:
 *                     _id: 6800bca16541f34f61f7a002
 *                     role: recruiter
 *                     authMethod: normal_auth
 *                     status: active
 *                     fullName: Tran Thi B
 *                     contactInfo:
 *                       email: newbie@seeds.example.com
 *                       phone: null
 *                   message: Vui lòng tạo profile công ty
 *             schema:
 *               oneOf:
 *                 - type: object
 *                   properties:
 *                     isNewbie:
 *                       type: boolean
 *                       example: false
 *                     user:
 *                       type: object
 *                     companyId:
 *                       type: string
 *                     membershipRole:
 *                       type: string
 *                       enum: [manager, recruiter, interviewer]
 *                     permissions:
 *                       type: object
 *                       properties:
 *                         canCreateJob:
 *                           type: boolean
 *                         canUpdateJob:
 *                           type: boolean
 *                         canDeleteJob:
 *                           type: boolean
 *                         canViewApplications:
 *                           type: boolean
 *                         canUpdateApplicationStatus:
 *                           type: boolean
 *                         canScheduleInterviews:
 *                           type: boolean
 *                         canUpdateCompanyProfile:
 *                           type: boolean
 *                 - type: object
 *                   properties:
 *                     isNewbie:
 *                       type: boolean
 *                       example: true
 *                     user:
 *                       type: object
 *                     message:
 *                       type: string
 *                       example: Vui lòng tạo profile công ty
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.get("/me", requireAuth, getMyProfile);

export default router;
