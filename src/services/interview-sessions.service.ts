import { CreateInterviewSessionDto } from "../dto/create-interview-session.dto";
import { UpdateInterviewSessionDto } from "../dto/update-interview-session.dto";
import {
  InterviewSession,
  IInterviewSession,
} from "../models/InterviewSession";

export class InterviewSessionError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}

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
