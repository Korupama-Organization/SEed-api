import { Schema, model, Document, Model, Types } from 'mongoose';

export type CreditTransactionType =
    | 'topup'
    | 'purchase'
    | 'refund'
    | 'manual_adjustment';

export type CreditTransactionDirection = 'credit' | 'debit';
export type CreditTransactionStatus = 'pending' | 'completed' | 'failed' | 'cancelled';

export interface ICreditTransaction extends Document {
    userId: Types.ObjectId;
    type: CreditTransactionType;
    direction: CreditTransactionDirection;
    amount: number;
    status: CreditTransactionStatus;
    orderId?: Types.ObjectId;
    note?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface ICreditTransactionModel extends Model<ICreditTransaction> {
    getUserBalance(userId: Types.ObjectId | string): Promise<number>;
    getAvailableBalance(userId: Types.ObjectId | string): Promise<number>;
    createTopup(params: {
        userId: Types.ObjectId | string;
        amount: number;
        note?: string;
        status?: CreditTransactionStatus;
    }): Promise<ICreditTransaction>;
    createDebit(params: {
        userId: Types.ObjectId | string;
        amount: number;
        type?: Extract<CreditTransactionType, 'purchase' | 'manual_adjustment'>;
        orderId?: Types.ObjectId | string;
        note?: string;
    }): Promise<ICreditTransaction>;
}

const toObjectId = (value: Types.ObjectId | string): Types.ObjectId =>
    value instanceof Types.ObjectId ? value : new Types.ObjectId(value);

const CreditTransactionSchema = new Schema<ICreditTransaction, ICreditTransactionModel>(
    {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        type: {
            type: String,
            enum: ['topup', 'purchase', 'refund', 'manual_adjustment'],
            required: true,
        },
        direction: {
            type: String,
            enum: ['credit', 'debit'],
            required: true,
        },
        amount: {
            type: Number,
            required: true,
            min: 0,
        },
        status: {
            type: String,
            enum: ['pending', 'completed', 'failed', 'cancelled'],
            default: 'completed',
        },
        orderId: { type: Schema.Types.ObjectId, ref: 'Order' },
        note: { type: String, trim: true },
    },
    { timestamps: true }
);

CreditTransactionSchema.index({ userId: 1, status: 1, createdAt: -1 });
CreditTransactionSchema.index({ orderId: 1 });

CreditTransactionSchema.statics.getUserBalance = async function (
    userId: Types.ObjectId | string
): Promise<number> {
    const [result] = await this.aggregate([
        {
            $match: {
                userId: toObjectId(userId),
                status: 'completed',
            },
        },
        {
            $group: {
                _id: null,
                balance: {
                    $sum: {
                        $cond: [{ $eq: ['$direction', 'credit'] }, '$amount', { $multiply: ['$amount', -1] }],
                    },
                },
            },
        },
    ]);

    return result?.balance ?? 0;
};

CreditTransactionSchema.statics.getAvailableBalance = async function (
    userId: Types.ObjectId | string
): Promise<number> {
    return this.getUserBalance(userId);
};

CreditTransactionSchema.statics.createTopup = async function (params: {
    userId: Types.ObjectId | string;
    amount: number;
    note?: string;
    status?: CreditTransactionStatus;
}): Promise<ICreditTransaction> {
    if (params.amount <= 0) {
        throw new Error('Topup amount must be greater than 0');
    }

    return this.create({
        userId: toObjectId(params.userId),
        type: 'topup',
        direction: 'credit',
        amount: params.amount,
        status: params.status ?? 'completed',
        note: params.note,
    });
};

CreditTransactionSchema.statics.createDebit = async function (params: {
    userId: Types.ObjectId | string;
    amount: number;
    type?: Extract<CreditTransactionType, 'purchase' | 'manual_adjustment'>;
    orderId?: Types.ObjectId | string;
    note?: string;
}): Promise<ICreditTransaction> {
    if (params.amount <= 0) {
        throw new Error('Debit amount must be greater than 0');
    }

    const balance = await this.getAvailableBalance(params.userId);
    if (balance < params.amount) {
        throw new Error('Insufficient credit balance');
    }

    return this.create({
        userId: toObjectId(params.userId),
        type: params.type ?? 'purchase',
        direction: 'debit',
        amount: params.amount,
        status: 'completed',
        orderId: params.orderId ? toObjectId(params.orderId) : undefined,
        note: params.note,
    });
};

export const CreditTransaction = model<ICreditTransaction, ICreditTransactionModel>(
    'CreditTransaction',
    CreditTransactionSchema
);
