import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { CreditTransaction } from '../models/CreditTransaction';
import { Order } from '../models/Order';

export const listMyOrders = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const rows = await Order.find({ userId: req.auth!.userId }).lean();
        return res.status(200).json({ data: rows });
    } catch (error: any) {
        return res.status(500).json({ error: error.message || 'Server error.' });
    }
};

export const getOrderById = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const row = await Order.findById(req.params.orderId).lean();
        if (!row) {
            return res.status(404).json({ error: 'Order not found.' });
        }

        return res.status(200).json({ data: row });
    } catch (error: any) {
        return res.status(500).json({ error: error.message || 'Server error.' });
    }
};

export const createOrder = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { items, totalAmount } = req.body;
        if (!Array.isArray(items) || items.length === 0 || totalAmount === undefined) {
            return res.status(400).json({ error: 'items and totalAmount are required.' });
        }

        const userId = req.auth!.userId;
        const balance = await CreditTransaction.getAvailableBalance(userId);
        if (balance < totalAmount) {
            return res.status(400).json({ error: 'Insufficient credit balance.' });
        }

        const pendingOrder: any = await Order.create({
            userId,
            items,
            totalAmount,
            paymentMethod: 'credit',
            status: 'pending',
        });

        try {
            const debitTx: any = await CreditTransaction.createDebit({
                userId,
                amount: totalAmount,
                orderId: pendingOrder._id,
                type: 'purchase',
                note: 'Order payment',
            });

            const paidOrder = await Order.findByIdAndUpdate(
                pendingOrder._id,
                {
                    status: 'paid',
                    creditTransactionId: debitTx._id,
                },
                { new: true, runValidators: true },
            ).lean();

            return res.status(201).json({ data: paidOrder || pendingOrder });
        } catch (error: any) {
            await Order.findByIdAndUpdate(
                pendingOrder._id,
                { status: 'failed' },
                { new: false },
            );

            if (error.message?.toLowerCase().includes('insufficient')) {
                return res.status(400).json({ error: 'Insufficient credit balance.' });
            }

            return res.status(500).json({ error: error.message || 'Server error.' });
        }
    } catch (error: any) {
        return res.status(500).json({ error: error.message || 'Server error.' });
    }
};

export const updateOrderStatus = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const updated = await Order.findByIdAndUpdate(req.params.orderId, req.body, {
            new: true,
            runValidators: true,
        }).lean();

        if (!updated) {
            return res.status(404).json({ error: 'Order not found.' });
        }

        return res.status(200).json({ data: updated });
    } catch (error: any) {
        return res.status(500).json({ error: error.message || 'Server error.' });
    }
};
