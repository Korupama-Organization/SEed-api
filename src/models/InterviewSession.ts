import { Document, model, Schema, Types } from "mongoose";

type SessionType = "real" | "mock";
type InterviewMode = "technical" | "behavioral" | "hr";
type InterviewStatus =
  | "scheduled"
  | "in_progress"
  | "coding_test"
  | "completed"
  | "cancelled";

interface IConversationEvaluation {
  score?: number;
  strengths?: string[];
  weaknesses?: string[];
  feedback?: string;
  intentCategory?: string;
}

interface IConversation {
  question: string;
  answer: string;
  audioUrl?: string;
  evaluation?: IConversationEvaluation;
}

interface IFinalReport {
  overallScore?: number;
  technicalScore?: number;
  communicationScore?: number;
  confidenceScore?: number;
  aiSummary?: string;
  improvementAreas?: string[];
}

export interface IInterviewSession extends Document {
  jobId: Types.ObjectId;
  candidateId: Types.ObjectId;
  sessionType: SessionType;
  interviewMode: InterviewMode;
  status: InterviewStatus;
  conversations: IConversation[];
  finalReport?: IFinalReport;
  startTime: Date;
  endTime: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ConversationEvaluationSchema = new Schema<IConversationEvaluation>(
  {
    score: { type: Number },
    strengths: [{ type: String }],
    weaknesses: [{ type: String }],
    feedback: { type: String },
    intentCategory: { type: String },
  },
  { _id: false },
);

const ConversationSchema = new Schema<IConversation>(
  {
    question: { type: String, required: true },
    answer: { type: String, required: true },
    audioUrl: { type: String },
    evaluation: { type: ConversationEvaluationSchema },
  },
  { _id: false },
);

const FinalReportSchema = new Schema<IFinalReport>(
  {
    overallScore: { type: Number },
    technicalScore: { type: Number },
    communicationScore: { type: Number },
    confidenceScore: { type: Number },
    aiSummary: { type: String },
    improvementAreas: [{ type: String }],
  },
  { _id: false },
);

const InterviewSessionSchema = new Schema<IInterviewSession>(
  {
    jobId: { type: Schema.Types.ObjectId, ref: "Job", required: true },
    candidateId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    sessionType: { type: String, enum: ["real", "mock"], required: true },
    interviewMode: {
      type: String,
      enum: ["technical", "behavioral", "hr"],
      required: true,
    },
    status: {
      type: String,
      enum: [
        "scheduled",
        "in_progress",
        "coding_test",
        "completed",
        "cancelled",
      ],
      required: true,
    },
    conversations: { type: [ConversationSchema], default: [] },
    finalReport: { type: FinalReportSchema },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
  },
  { timestamps: true },
);

export const InterviewSession = model<IInterviewSession>(
  "InterviewSession",
  InterviewSessionSchema,
);
