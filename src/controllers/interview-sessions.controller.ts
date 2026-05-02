import { Response } from "express";
import {
  CreateInterviewSessionDto,
  validateCreateInterviewSessionDto,
} from "../dto/create-interview-session.dto";
import {
  CancelInterviewSessionDto,
  validateCancelInterviewSessionDto,
} from "../dto/cancel-interview-session.dto";
import {
  validateUpdateInterviewSessionDto,
  UpdateInterviewSessionDto,
} from "../dto/update-interview-session.dto";
import { AuthenticatedRequest } from "../middlewares/auth.middleware";
import {
  cancelInterviewSession,
  completeInterviewSession,
  createInterviewSession,
  getInterviewSessionById,
  InterviewSessionError,
  startInterviewSession,
  updateInterviewSession,
} from "../services/interview-sessions.service";

const resolveSessionId = (req: AuthenticatedRequest): string | undefined => {
  const paramValue = req.params.sessionId ?? req.params.id;
  if (Array.isArray(paramValue)) {
    return paramValue[0];
  }

  return paramValue;
};

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

export const getInterviewSessionDetailHandler = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const userId = req.auth?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const id = resolveSessionId(req);
    if (!id) {
      return res
        .status(400)
        .json({ message: "Interview session id is required" });
    }

    const interviewSession = await getInterviewSessionById(id);

    return res.status(200).json({
      message: "Interview session retrieved successfully",
      interviewSession,
    });
  } catch (error: any) {
    if (error instanceof InterviewSessionError) {
      return res.status(error.statusCode).json({ message: error.message });
    }

    console.error("Get interview session detail error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const startInterviewSessionHandler = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const userId = req.auth?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const id = resolveSessionId(req);
    if (!id) {
      return res
        .status(400)
        .json({ message: "Interview session id is required" });
    }

    const interviewSession = await startInterviewSession(id);

    return res.status(200).json({
      message: "Interview session started successfully",
      interviewSession,
    });
  } catch (error: any) {
    if (error instanceof InterviewSessionError) {
      return res.status(error.statusCode).json({ message: error.message });
    }

    console.error("Start interview session error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const completeInterviewSessionHandler = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const userId = req.auth?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const id = resolveSessionId(req);
    if (!id) {
      return res
        .status(400)
        .json({ message: "Interview session id is required" });
    }

    const interviewSession = await completeInterviewSession(id);

    return res.status(200).json({
      message: "Interview session completed successfully",
      interviewSession,
    });
  } catch (error: any) {
    if (error instanceof InterviewSessionError) {
      return res.status(error.statusCode).json({ message: error.message });
    }

    console.error("Complete interview session error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const cancelInterviewSessionHandler = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const userId = req.auth?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const id = resolveSessionId(req);
    if (!id) {
      return res
        .status(400)
        .json({ message: "Interview session id is required" });
    }

    const { value, error } = await validateCancelInterviewSessionDto(req.body);
    if (error || !value) {
      return res.status(400).json({ message: error || "Invalid payload" });
    }

    const interviewSession = await cancelInterviewSession(
      id,
      value as CancelInterviewSessionDto,
    );

    return res.status(200).json({
      message: "Interview session cancelled successfully",
      interviewSession,
    });
  } catch (error: any) {
    if (error instanceof InterviewSessionError) {
      return res.status(error.statusCode).json({ message: error.message });
    }

    console.error("Cancel interview session error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};
