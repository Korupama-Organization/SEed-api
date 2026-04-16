import { Response } from "express";
import { AuthenticatedRequest } from "../middlewares/auth.middleware";
import {
  CompanyOnboardingError,
  getMyProfileAndCompanyStatus,
} from "../services/company-onboarding.service";

export const getMyProfile = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const userId = req.auth?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const response = await getMyProfileAndCompanyStatus(userId);
    return res.status(200).json(response);
  } catch (error: any) {
    if (error instanceof CompanyOnboardingError) {
      return res.status(error.statusCode).json({ message: error.message });
    }

    console.error("Get profile error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};
