import { Router } from "express";
import { getMyRecruiterDashboard } from "../controllers/recruiter-dashboard.controller";
import { requireAuth } from "../middlewares/auth.middleware";
import { requireRole } from "../middlewares/domain-authorization.middleware";

const router = Router();

/**
 * @swagger
 * /api/recruiter-dashboard/me:
 *   get:
 *     summary: Get recruiter dashboard data
 *     description: Trả về dữ liệu tổng quan cho Recruit dashboard gồm card thống kê, chart hồ sơ, trạng thái hồ sơ, hoạt động gần đây và lịch phỏng vấn sắp tới.
 *     tags: [RecruiterDashboard]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         required: false
 *         schema:
 *           type: string
 *           enum: [week, month]
 *           default: week
 *         description: Khoảng thời gian cho biểu đồ hồ sơ.
 *     responses:
 *       200:
 *         description: Recruiter dashboard loaded successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Server error
 */
router.get(
  "/me",
  requireAuth,
  requireRole("recruiter"),
  getMyRecruiterDashboard,
);

export default router;
