import { Schema, model, Document } from 'mongoose';

export interface ICounter extends Document {
  key: string;
  seq: number;
}

const CounterSchema = new Schema<ICounter>(
  {
    key: { type: String, required: true, unique: true },
    seq: { type: Number, required: true, default: 0 },
  },
  { timestamps: false }
);

export const Counter = model<ICounter>('Counter', CounterSchema);
