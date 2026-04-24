import { Response } from "express";
import {
  CreateInterviewSessionDto,
  validateCreateInterviewSessionDto,
} from "../dto/create-interview-session.dto";
import {
  validateUpdateInterviewSessionDto,
  UpdateInterviewSessionDto,
} from "../dto/update-interview-session.dto";
import { AuthenticatedRequest } from "../middlewares/auth.middleware";
import {
  createInterviewSession,
  InterviewSessionError,
  updateInterviewSession,
} from "../services/interview-sessions.service";

export const createInterviewSessionHandler = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const userId = req.auth?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { value, error } = await validateCreateInterviewSessionDto(req.body);
    if (error || !value) {
      return res.status(400).json({ message: error || "Invalid payload" });
    }

    const interviewSession = await createInterviewSession(
      value as CreateInterviewSessionDto,
    );

    return res.status(201).json({
      message: "Interview session created successfully",
      interviewSession,
    });
  } catch (error: any) {
    if (error instanceof InterviewSessionError) {
      return res.status(error.statusCode).json({ message: error.message });
    }

    console.error("Create interview session error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const updateInterviewSessionHandler = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const userId = req.auth?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { value, error } = await validateUpdateInterviewSessionDto(req.body);

    if (error || !value) {
      return res.status(400).json({ message: error || "Invalid payload" });
    }

    const interviewSession = await updateInterviewSession(
      id,
      value as UpdateInterviewSessionDto,
    );

    return res.status(200).json({
      message: "Interview session updated successfully",
      interviewSession,
    });
  } catch (error: any) {
    if (error instanceof InterviewSessionError) {
      return res.status(error.statusCode).json({ message: error.message });
    }

    console.error("Update interview session error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};
