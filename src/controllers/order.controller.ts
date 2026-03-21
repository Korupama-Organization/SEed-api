import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
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

        const created = await Order.create({
            ...req.body,
            userId: req.auth!.userId,
        });

        return res.status(201).json({ data: created });
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
