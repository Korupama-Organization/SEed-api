import { Schema, model, Document, Types } from 'mongoose';

// ─── Interfaces ───────────────────────────────────────────────────────────────

export type AIAction = 'generate_outline' | 'generate_quiz' | 'summarize';

export interface IAILog extends Document {
    userId: Types.ObjectId;
    action: AIAction;
    /** Number of tokens sent to the AI model */
    inputTokens?: number;
    /** Number of tokens returned by the AI model */
    outputTokens?: number;
    /** Model identifier, e.g. 'gpt-4o', 'gemini-pro' */
    modelUsed?: string;
    createdAt: Date;
    updatedAt: Date;
}

// ─── Schema ───────────────────────────────────────────────────────────────────

const AILogSchema = new Schema<IAILog>(
    {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        action: {
            type: String,
            enum: ['generate_outline', 'generate_quiz', 'summarize'],
            required: true,
        },
        inputTokens: Number,
        outputTokens: Number,
        modelUsed: String,
    },
    { timestamps: true }
);

// Index to support billing / quota queries per user
AILogSchema.index({ userId: 1, createdAt: -1 });

export const AILog = model<IAILog>('AILog', AILogSchema);
