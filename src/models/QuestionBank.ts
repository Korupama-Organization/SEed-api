import { Schema, model, Document, Types } from "mongoose";

export interface IContributor {
  name: string;
  company: string;
}

export interface IQuestionBank extends Document {
  category: string;
  question: string;
  suggestedAnswer: string;
  level: "Intern" | "Fresher";
  contributor?: IContributor;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ContributorSchema = new Schema<IContributor>(
  {
    name: { type: String },
    company: { type: String },
  },
  { _id: false },
);

const QuestionBankSchema = new Schema<IQuestionBank>(
  {
    category: { type: String, required: true },
    question: { type: String, required: true },
    suggestedAnswer: { type: String, required: true },
    level: { type: String, enum: ["Intern", "Fresher"], required: true },
    contributor: { type: ContributorSchema },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export const QuestionBank = model<IQuestionBank>(
  "QuestionBank",
  QuestionBankSchema,
);
