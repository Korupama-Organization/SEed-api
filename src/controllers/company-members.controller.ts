import { Response } from "express";
import { AuthenticatedRequest } from "../middlewares/auth.middleware";
import { validateCreateCompanyMemberDto } from "../dto/create-company-member.dto";
import { validateUpdateCompanyMemberDto } from "../dto/update-company-member.dto";
import { validateCreateCompanyMemberAuthDto } from "../dto/create-company-member-auth.dto";
import { validateUpdateRecruiterProfileDto } from "../dto/update-recruiter-profile.dto";
import {
  CompanyMemberError,
  createCompanyMember,
  createCompanyMemberWithAuth,
  getCompanyMemberById,
  listCompanyMembers,
  removeCompanyMember,
  updateCompanyMember,
  updateRecruiterProfile,
} from "../services/company-member.service";

export const listMembers = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const userId = req.auth?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const result = await listCompanyMembers(userId);
    return res.status(200).json(result);
  } catch (error: any) {
    if (error instanceof CompanyMemberError) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    console.error("List company members error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const getMember = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.auth?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const memberId = req.params.memberId as string;
    if (!memberId) {
      return res.status(400).json({ message: "Thiếu memberId." });
    }

    const member = await getCompanyMemberById(userId, memberId);
    return res.status(200).json({ member });
  } catch (error: any) {
    if (error instanceof CompanyMemberError) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    console.error("Get company member error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const createMember = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const userId = req.auth?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { value, error } = validateCreateCompanyMemberDto(req.body);
    if (error || !value) {
      return res.status(400).json({ message: error || "Invalid payload" });
    }

    const member = await createCompanyMember(userId, value);
    return res.status(201).json({
      message: "Thêm thành viên thành công.",
      member,
    });
  } catch (error: any) {
    if (error instanceof CompanyMemberError) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    console.error("Create company member error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const updateMember = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const userId = req.auth?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const memberId = req.params.memberId as string;
    if (!memberId) {
      return res.status(400).json({ message: "Thiếu memberId." });
    }

    const { value, error } = validateUpdateCompanyMemberDto(req.body);
    if (error || !value) {
      return res.status(400).json({ message: error || "Invalid payload" });
    }

    const member = await updateCompanyMember(userId, memberId, value);
    return res.status(200).json({
      message: "Cập nhật thành viên thành công.",
      member,
    });
  } catch (error: any) {
    if (error instanceof CompanyMemberError) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    console.error("Update company member error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const deleteMember = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const userId = req.auth?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const memberId = req.params.memberId as string;
    if (!memberId) {
      return res.status(400).json({ message: "Thiếu memberId." });
    }

    await removeCompanyMember(userId, memberId);
    return res.status(200).json({
      message: "Xóa thành viên thành công.",
    });
  } catch (error: any) {
    if (error instanceof CompanyMemberError) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    console.error("Delete company member error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const createMemberWithAuth = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const userId = req.auth?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { value, error } = validateCreateCompanyMemberAuthDto(req.body);
    if (error || !value) {
      return res.status(400).json({ message: error || "Invalid payload" });
    }

    const data = await createCompanyMemberWithAuth(userId, value);
    return res.status(201).json({
      message: "Tạo thành viên thành công.",
      data,
    });
  } catch (error: any) {
    if (error instanceof CompanyMemberError) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    console.error("Create company member with auth error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const updateProfile = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const userId = req.auth?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { value, error } = validateUpdateRecruiterProfileDto(req.body);
    if (error || !value) {
      return res.status(400).json({ message: error || "Invalid payload" });
    }

    const data = await updateRecruiterProfile(userId, value);
    return res.status(200).json({
      message: "Cập nhật profile thành công.",
      data,
    });
  } catch (error: any) {
    if (error instanceof CompanyMemberError) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    console.error("Update recruiter profile error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};
