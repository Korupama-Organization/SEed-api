import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { CreditTransaction } from '../models/CreditTransaction';

export const getCreditBalance = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const balance = await CreditTransaction.getAvailableBalance(req.auth!.userId);
        return res.status(200).json({ data: { balance } });
    } catch (error: any) {
        return res.status(500).json({ error: error.message || 'Server error.' });
    }
};

export const listCreditTransactions = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const rows = await CreditTransaction.find({ userId: req.auth!.userId })
            .sort({ createdAt: -1 })
            .lean();

        return res.status(200).json({ data: rows });
    } catch (error: any) {
        return res.status(500).json({ error: error.message || 'Server error.' });
    }
};

export const createCreditTopup = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const amount = Number(req.body.amount || 0);
        if (!Number.isFinite(amount) || amount <= 0) {
            return res.status(400).json({ error: 'amount must be greater than 0.' });
        }

        const tx = await CreditTransaction.createTopup({
            userId: req.auth!.userId,
            amount,
            note: req.body.note,
        });

        return res.status(201).json({ data: tx });
    } catch (error: any) {
        return res.status(500).json({ error: error.message || 'Server error.' });
    }
};
