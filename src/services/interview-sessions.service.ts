import { CreateInterviewSessionDto } from "../dto/create-interview-session.dto";
import { CancelInterviewSessionDto } from "../dto/cancel-interview-session.dto";
import { UpdateInterviewSessionDto } from "../dto/update-interview-session.dto";
import {
  InterviewSession,
  IInterviewSession,
} from "../models/InterviewSession";
import { Types } from "mongoose";

export class InterviewSessionError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}

type InterviewStatus =
  | "scheduled"
  | "in_progress"
  | "coding_test"
  | "completed"
  | "cancelled";

const STATUS_TRANSITIONS: Record<InterviewStatus, InterviewStatus[]> = {
  scheduled: ["in_progress", "cancelled"],
  in_progress: ["completed", "cancelled"],
  coding_test: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
};

const assertValidSessionId = (id: string): void => {
  if (!Types.ObjectId.isValid(id)) {
    throw new InterviewSessionError("Interview session ID is invalid", 400);
  }
};

const fetchInterviewSession = async (
  id: string,
): Promise<IInterviewSession> => {
  assertValidSessionId(id);

  const session = await InterviewSession.findById(id);
  if (!session) {
    throw new InterviewSessionError("Interview session not found", 404);
  }

  return session;
};

const transitionInterviewSessionStatus = async (
  id: string,
  nextStatus: InterviewStatus,
  options?: { cancelReason?: string },
): Promise<IInterviewSession> => {
  const session = await fetchInterviewSession(id);

  if (session.status === nextStatus) {
    throw new InterviewSessionError(
      `Interview session is already ${nextStatus}`,
      400,
    );
  }

  const allowedNextStatuses = STATUS_TRANSITIONS[session.status];
  if (!allowedNextStatuses.includes(nextStatus)) {
    throw new InterviewSessionError(
      "Interview session status does not allow this action",
      400,
    );
  }

  session.status = nextStatus;
  if (nextStatus === "cancelled" && options?.cancelReason) {
    session.cancelReason = options.cancelReason;
  }

  const updatedSession = await session.save();
  return updatedSession;
};

export const createInterviewSession = async (
  dto: CreateInterviewSessionDto,
): Promise<IInterviewSession> => {
  try {
    const session = await InterviewSession.create(dto);
    return session;
  } catch (error: any) {
    throw new InterviewSessionError(
      error?.message || "Failed to create interview session.",
      500,
    );
  }
};

export const updateInterviewSession = async (
  id: string,
  dto: UpdateInterviewSessionDto,
): Promise<IInterviewSession> => {
  try {
    const updatedSession = await InterviewSession.findByIdAndUpdate(id, dto, {
      new: true,
    });

    if (!updatedSession) {
      throw new InterviewSessionError("Interview session not found", 404);
    }

    return updatedSession;
  } catch (error: any) {
    if (error instanceof InterviewSessionError) {
      throw error;
    }

    throw new InterviewSessionError(
      error?.message || "Failed to update interview session.",
      500,
    );
  }
};

export const getInterviewSessionById = async (
  id: string,
): Promise<IInterviewSession> => {
  try {
    return await fetchInterviewSession(id);
  } catch (error: any) {
    if (error instanceof InterviewSessionError) {
      throw error;
    }

    throw new InterviewSessionError(
      error?.message || "Failed to fetch interview session.",
      500,
    );
  }
};

export const startInterviewSession = async (
  id: string,
): Promise<IInterviewSession> => {
  try {
    return await transitionInterviewSessionStatus(id, "in_progress");
  } catch (error: any) {
    if (error instanceof InterviewSessionError) {
      throw error;
    }

    throw new InterviewSessionError(
      error?.message || "Failed to start interview session.",
      500,
    );
  }
};

export const completeInterviewSession = async (
  id: string,
): Promise<IInterviewSession> => {
  try {
    return await transitionInterviewSessionStatus(id, "completed");
  } catch (error: any) {
    if (error instanceof InterviewSessionError) {
      throw error;
    }

    throw new InterviewSessionError(
      error?.message || "Failed to complete interview session.",
      500,
    );
  }
};

export const cancelInterviewSession = async (
  id: string,
  dto: CancelInterviewSessionDto,
): Promise<IInterviewSession> => {
  try {
    return await transitionInterviewSessionStatus(id, "cancelled", {
      cancelReason: dto.cancelReason,
    });
  } catch (error: any) {
    if (error instanceof InterviewSessionError) {
      throw error;
    }

    throw new InterviewSessionError(
      error?.message || "Failed to cancel interview session.",
      500,
    );
  }
};
