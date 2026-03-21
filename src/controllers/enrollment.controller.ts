import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { Enrollment } from '../models/Enrollment';
import {
    createEnrollmentWithLessons,
    enrollmentDomainErrors,
    updateEnrollmentLessonProgress,
} from '../services/enrollment-progress.service';

const toStatusCode = (error: any): number => {
    if (error instanceof enrollmentDomainErrors.DomainLogicError) {
        return error.statusCode;
    }

    return 500;
};

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

        const created = await createEnrollmentWithLessons({
            userId: req.auth!.userId,
            courseId: String(courseId),
        });

        return res.status(201).json({ data: created });
    } catch (error: any) {
        const statusCode = toStatusCode(error);
        return res.status(statusCode).json({ error: error.message || 'Server error.' });
    }
};

export const updateEnrollmentProgress = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { lessonId, lastPosition, markCompleted, completedInteraction } = req.body;
        if (!lessonId) {
            return res.status(400).json({ error: 'lessonId is required.' });
        }

        const updated = await updateEnrollmentLessonProgress({
            enrollmentId: String(req.params.enrollmentId),
            lessonId: String(lessonId),
            lastPosition,
            markCompleted,
            completedInteraction,
        });

        return res.status(200).json({ data: updated });
    } catch (error: any) {
        const statusCode = toStatusCode(error);
        return res.status(statusCode).json({ error: error.message || 'Server error.' });
    }
};
