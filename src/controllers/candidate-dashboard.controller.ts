import { Response } from "express";
import { AuthenticatedRequest } from "../middlewares/auth.middleware";
import { getCandidateDashboard } from "../services/candidate-dashboard.service";

export const getMyCandidateDashboard = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const userId = req.auth?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required." });
    }

    const dashboard = await getCandidateDashboard(userId);

    return res.status(200).json({
      message: "Lấy dữ liệu candidate dashboard thành công.",
      data: dashboard,
    });
  } catch (error) {
    console.error("Get candidate dashboard error:", error);
    return res.status(500).json({ error: "Lỗi máy chủ." });
  }
};