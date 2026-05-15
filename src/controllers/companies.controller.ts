import { Request, Response } from "express";
import {
  CreateCompanyDto,
  validateCreateCompanyDto,
} from "../dto/create-company.dto";
import { validateUpdateCompanyDto } from "../dto/update-company.dto";
import { AuthenticatedRequest } from "../middlewares/auth.middleware";
import {
  CompanyOnboardingError,
  createCompanyForNewbie,
  deleteMyCompany,
  getMyCompany,
  listCompanies,
  updateMyCompany,
} from "../services/company-onboarding.service";

const getQueryString = (value: unknown): string | undefined => {
  return typeof value === "string" ? value : undefined;
};

export const getAllCompanies = async (req: Request, res: Response) => {
  try {
    const result = await listCompanies({
      page: getQueryString(req.query.page) || "1",
      limit: getQueryString(req.query.limit) || "10",
      search: getQueryString(req.query.search),
    });

    return res.status(200).json({
      message: "Get list companies successfully",
      data: result.companies,
      pagination: result.pagination,
    });
  } catch (error: any) {
    if (error instanceof CompanyOnboardingError) {
      return res.status(error.statusCode).json({ message: error.message });
    }

    console.error("Get list companies error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

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

export const getCompany = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.auth?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const company = await getMyCompany(userId);
    return res.status(200).json({ company });
  } catch (error: any) {
    if (error instanceof CompanyOnboardingError) {
      return res.status(error.statusCode).json({ message: error.message });
    }

    console.error("Get company error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const updateCompany = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const userId = req.auth?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { value, error } = validateUpdateCompanyDto(req.body);
    if (error || !value) {
      return res.status(400).json({ message: error || "Invalid payload" });
    }

    const company = await updateMyCompany(userId, value);
    return res.status(200).json({
      message: "Company profile updated successfully",
      company,
    });
  } catch (error: any) {
    if (error instanceof CompanyOnboardingError) {
      return res.status(error.statusCode).json({ message: error.message });
    }

    console.error("Update company error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const deleteCompany = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const userId = req.auth?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    await deleteMyCompany(userId);
    return res.status(200).json({
      message: "Company profile deleted successfully",
    });
  } catch (error: any) {
    if (error instanceof CompanyOnboardingError) {
      return res.status(error.statusCode).json({ message: error.message });
    }

    console.error("Delete company error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};
