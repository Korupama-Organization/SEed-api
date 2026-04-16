import { Response } from "express";
import {
  CreateCompanyDto,
  validateCreateCompanyDto,
} from "../dto/create-company.dto";
import { AuthenticatedRequest } from "../middlewares/auth.middleware";
import {
  CompanyOnboardingError,
  createCompanyForNewbie,
} from "../services/company-onboarding.service";

export const createCompany = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const userId = req.auth?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { value, error } = validateCreateCompanyDto(req.body);
    if (error || !value) {
      return res.status(400).json({ message: error || "Invalid payload" });
    }

    const company = await createCompanyForNewbie(
      userId,
      value as CreateCompanyDto,
    );
    return res.status(201).json({
      message: "Company profile created successfully",
      company,
    });
  } catch (error: any) {
    if (error instanceof CompanyOnboardingError) {
      return res.status(error.statusCode).json({ message: error.message });
    }

    console.error("Create company error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};
