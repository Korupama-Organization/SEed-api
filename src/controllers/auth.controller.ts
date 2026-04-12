import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { User, IUser } from '../models/User';


// ─── Private helpers ─────────────────────────────────────────────────────────────

const normalizeEmail = (email: string): string => email.trim().toLowerCase();

const hashPassword = async (plain: string): Promise<string> => {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(plain, salt);
};

const sanitizeUser = (user: IUser) => {
    const { password: _, ...safe } = user.toObject() as any;
    return safe;
};


// ─── Controller functions ──────────────────────────────────────────────────────

export const loginUser = async (req: Request, res: Response) => {
    try {
        const { userID, password, type} = req.body;
