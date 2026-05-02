import { Response } from "express";
import {
  CreateApplicationDto,
  validateCreateApplicationDto,
} from "../dto/create-application.dto";
import {
  InterviewApplicationDto,
  validateInterviewApplicationDto,
} from "../dto/interview-application.dto";
import {
  OfferApplicationDto,
  validateOfferApplicationDto,
} from "../dto/offer-application.dto";
import {
  HireApplicationDto,
  validateHireApplicationDto,
} from "../dto/hire-application.dto";
import {
  RejectApplicationDto,
  validateRejectApplicationDto,
} from "../dto/reject-application.dto";
import {
  ShortlistApplicationDto,
  validateShortlistApplicationDto,
} from "../dto/shortlist-application.dto";
import { AuthenticatedRequest } from "../middlewares/auth.middleware";
import {
  applyApplication,
  ApplicationServiceError,
  hireApplication,
  interviewApplication,
  offerApplication,
  rejectApplication,
  shortlistApplication,
} from "../services/applications.service";

const resolveApplicationId = (
  req: AuthenticatedRequest,
): string | undefined => {
  const paramValue = req.params.id;
  if (Array.isArray(paramValue)) {
    return paramValue[0];
  }

  return paramValue;
};

export const applyApplicationHandler = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const userId = req.auth?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { value, error } = await validateCreateApplicationDto(req.body);
    if (error || !value) {
      return res.status(400).json({ message: error || "Invalid payload" });
    }

    const application = await applyApplication(value as CreateApplicationDto);

    return res.status(201).json({
      message: "Application created successfully",
      application,
    });
  } catch (error: any) {
    if (error instanceof ApplicationServiceError) {
      return res.status(error.statusCode).json({ message: error.message });
    }

    console.error("Apply application error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const shortlistApplicationHandler = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const userId = req.auth?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const id = resolveApplicationId(req);
    if (!id) {
      return res.status(400).json({ message: "Application id is required" });
    }

    const { value, error } = await validateShortlistApplicationDto(req.body);
    if (error || !value) {
      return res.status(400).json({ message: error || "Invalid payload" });
    }

    const application = await shortlistApplication(
      id,
      value as ShortlistApplicationDto,
    );

    return res.status(200).json({
      message: "Application shortlisted successfully",
      application,
    });
  } catch (error: any) {
    if (error instanceof ApplicationServiceError) {
      return res.status(error.statusCode).json({ message: error.message });
    }

    console.error("Shortlist application error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const interviewApplicationHandler = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const userId = req.auth?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const id = resolveApplicationId(req);
    if (!id) {
      return res.status(400).json({ message: "Application id is required" });
    }

    const { value, error } = await validateInterviewApplicationDto(req.body);
    if (error || !value) {
      return res.status(400).json({ message: error || "Invalid payload" });
    }

    const application = await interviewApplication(
      id,
      value as InterviewApplicationDto,
    );

    return res.status(200).json({
      message: "Application moved to interview successfully",
      application,
    });
  } catch (error: any) {
    if (error instanceof ApplicationServiceError) {
      return res.status(error.statusCode).json({ message: error.message });
    }

    console.error("Interview application error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const offerApplicationHandler = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const userId = req.auth?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const id = resolveApplicationId(req);
    if (!id) {
      return res.status(400).json({ message: "Application id is required" });
    }

    const { value, error } = await validateOfferApplicationDto(req.body);
    if (error || !value) {
      return res.status(400).json({ message: error || "Invalid payload" });
    }

    const application = await offerApplication(
      id,
      value as OfferApplicationDto,
      userId,
    );

    return res.status(200).json({
      message: "Application offered successfully",
      application,
    });
  } catch (error: any) {
    if (error instanceof ApplicationServiceError) {
      return res.status(error.statusCode).json({ message: error.message });
    }

    console.error("Offer application error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const hireApplicationHandler = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const userId = req.auth?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const id = resolveApplicationId(req);
    if (!id) {
      return res.status(400).json({ message: "Application id is required" });
    }

    const { value, error } = await validateHireApplicationDto(req.body);
    if (error || !value) {
      return res.status(400).json({ message: error || "Invalid payload" });
    }

    const application = await hireApplication(
      id,
      value as HireApplicationDto,
      userId,
    );

    return res.status(200).json({
      message: "Application hired successfully",
      application,
    });
  } catch (error: any) {
    if (error instanceof ApplicationServiceError) {
      return res.status(error.statusCode).json({ message: error.message });
    }

    console.error("Hire application error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const rejectApplicationHandler = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const userId = req.auth?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const id = resolveApplicationId(req);
    if (!id) {
      return res.status(400).json({ message: "Application id is required" });
    }

    const { value, error } = await validateRejectApplicationDto(req.body);
    if (error || !value) {
      return res.status(400).json({ message: error || "Invalid payload" });
    }

    const application = await rejectApplication(
      id,
      value as RejectApplicationDto,
      userId,
    );

    return res.status(200).json({
      message: "Application rejected successfully",
      application,
    });
  } catch (error: any) {
    if (error instanceof ApplicationServiceError) {
      return res.status(error.statusCode).json({ message: error.message });
    }

    console.error("Reject application error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};
