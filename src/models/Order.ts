import { Schema, model, Document, Types } from 'mongoose';

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface IOrderItem {
    courseId: Types.ObjectId;
    price: number;
}

export interface IOrder extends Document {
    userId: Types.ObjectId;
    items: IOrderItem[];
    totalAmount: number;
    paymentMethod: 'credit';
    status: 'pending' | 'paid' | 'failed' | 'cancelled';
    creditTransactionId?: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

// ─── Schema ───────────────────────────────────────────────────────────────────

const OrderItemSchema = new Schema<IOrderItem>(
    {
        courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
        price: { type: Number, required: true, min: 0 },
    },
    { _id: false }
);

const OrderSchema = new Schema<IOrder>(
    {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        items: { type: [OrderItemSchema], required: true },
        totalAmount: { type: Number, required: true, min: 0 },
        paymentMethod: {
            type: String,
            enum: ['credit'],
            default: 'credit',
        },
        status: {
            type: String,
            enum: ['pending', 'paid', 'failed', 'cancelled'],
            default: 'pending',
        },
        creditTransactionId: { type: Schema.Types.ObjectId, ref: 'CreditTransaction' },
    },
    { timestamps: true }
);

OrderSchema.index({ userId: 1, status: 1 });

export const Order = model<IOrder>('Order', OrderSchema);
