import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { Enrollment } from '../models/Enrollment';

export const listMyEnrollments = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const rows = await Enrollment.find({ userId: req.auth!.userId }).lean();
        return res.status(200).json({ data: rows });
    } catch (error: any) {
        return res.status(500).json({ error: error.message || 'Server error.' });
    }
};

export const getEnrollmentById = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const row = await Enrollment.findById(req.params.enrollmentId).lean();
        if (!row) {
            return res.status(404).json({ error: 'Enrollment not found.' });
        }

        return res.status(200).json({ data: row });
    } catch (error: any) {
        return res.status(500).json({ error: error.message || 'Server error.' });
    }
};

export const createEnrollment = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { courseId } = req.body;
        if (!courseId) {
            return res.status(400).json({ error: 'courseId is required.' });
        }

        const created = await Enrollment.create({
            ...req.body,
            userId: req.auth!.userId,
        });

        return res.status(201).json({ data: created });
    } catch (error: any) {
        return res.status(500).json({ error: error.message || 'Server error.' });
    }
};

export const updateEnrollmentProgress = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const updated = await Enrollment.findByIdAndUpdate(req.params.enrollmentId, req.body, {
            new: true,
            runValidators: true,
        }).lean();

        if (!updated) {
            return res.status(404).json({ error: 'Enrollment not found.' });
        }

        return res.status(200).json({ data: updated });
    } catch (error: any) {
        return res.status(500).json({ error: error.message || 'Server error.' });
    }
};
