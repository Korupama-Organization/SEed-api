import { Router } from "express";
import { updateMyCandidateProfile } from "../controllers/candidate-profile.controller";
import { requireAuth } from "../middlewares/auth.middleware";
import { requireRole } from "../middlewares/domain-authorization.middleware";

const router = Router();

/**
 * @swagger
 * /api/candidate-profiles/me:
 *   patch:
 *     summary: Update almost full candidate profile
 *     description: Update fields in candidate_profiles for authenticated candidate.
 *     tags: [CandidateProfile]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CandidateProfilePatchRequest'
 *           examples:
 *             full:
 *               summary: Update almost full candidate profile
 *               value:
 *                 basicInfo:
 *                   mssv: 2152xxxx
 *                   fullName: Nguyen Huu Lam Giang
 *                   birthday: 2003-01-01T00:00:00.000Z
 *                   gender: Nam
 *                   phone: 090xxxxxxx
 *                   email: student@gm.uit.edu.vn
 *                   github: https://github.com/nguyenvana
 *                   facebook: https://facebook.com/nguyenvana
 *                   linkedin: https://linkedin.com/in/nguyenvana
 *                 education:
 *                   school: Đại học Công nghệ Thông tin - ĐHQG TP.HCM
 *                   major: Kỹ thuật Phần mềm
 *                   expectedGraduation: 06/2025
 *                   gpa: 3.6
 *                 strengths: Tư duy logic tốt, có khả năng tự học công nghệ mới nhanh chóng.
 *                 skills:
 *                   technical:
 *                     - category: Programming Languages
 *                       name: TypeScript
 *                       yoe: 1
 *                       confidence: 1
 *                     - category: Frameworks
 *                       name: NestJS
 *                       yoe: 0.5
 *                       confidence: 1
 *                     - category: Databases
 *                       name: MongoDB
 *                       yoe: 0.5
 *                       confidence: 1
 *                   softSkills:
 *                     - Thuyết trình
 *                     - Làm việc nhóm
 *                     - Giải quyết vấn đề
 *                 languages:
 *                   - certificateName: IELTS
 *                     score: 7
 *                     issuedAt: 2024-01-01T00:00:00.000Z
 *                     expiresAt: 2026-01-01T00:00:00.000Z
 *                 achievements:
 *                   - title: Top 10 Hackathon 2025
 *                     achievedAt: 2025-10-01T00:00:00.000Z
 *     responses:
 *       200:
 *         description: Candidate profile updated successfully
 *       400:
 *         description: Invalid payload, unknown fields, or schema validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Candidate profile not found
 *       500:
 *         description: Server error
 */
router.patch(
  "/me",
  requireAuth,
  requireRole("candidate"),
  updateMyCandidateProfile,
);

export default router;
