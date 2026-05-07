import { Response } from "express";
import { AuthenticatedRequest } from "../middlewares/auth.middleware";
import {
  getRecruiterDashboard,
  RecruiterDashboardServiceError,
} from "../services/recruiter-dashboard.service";

export const getMyRecruiterDashboard = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const userId = req.auth?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required." });
    }

    const dashboard = await getRecruiterDashboard(userId, {
      period: req.query.period,
    });

    return res.status(200).json({
      message: "Lấy dữ liệu recruiter dashboard thành công.",
      data: dashboard,
    });
  } catch (error) {
    if (error instanceof RecruiterDashboardServiceError) {
      return res.status(error.statusCode).json({ error: error.message });
    }

    console.error("Get recruiter dashboard error:", error);
    return res.status(500).json({ error: "Lỗi máy chủ." });
  }
};
