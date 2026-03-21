import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { Course } from '../models/Course';

export const listCourses = async (_req: AuthenticatedRequest, res: Response) => {
    try {
        const courses = await Course.find().lean();
        return res.status(200).json({ data: courses });
    } catch (error: any) {
        return res.status(500).json({ error: error.message || 'Server error.' });
    }
};

export const getCourseById = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const course = await Course.findById(req.params.courseId).lean();
        if (!course) {
            return res.status(404).json({ error: 'Course not found.' });
        }

        return res.status(200).json({ data: course });
    } catch (error: any) {
        return res.status(500).json({ error: error.message || 'Server error.' });
    }
};

export const createCourse = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { title, slug, price } = req.body;
        if (!title || !slug || price === undefined) {
            return res.status(400).json({ error: 'title, slug and price are required.' });
        }

        const created = await Course.create({
            ...req.body,
            instructor: req.auth!.userId,
        });

        return res.status(201).json({ data: created });
    } catch (error: any) {
        return res.status(500).json({ error: error.message || 'Server error.' });
    }
};

export const updateCourse = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const updated = await Course.findByIdAndUpdate(req.params.courseId, req.body, {
            new: true,
            runValidators: true,
        }).lean();

        if (!updated) {
            return res.status(404).json({ error: 'Course not found.' });
        }

        return res.status(200).json({ data: updated });
    } catch (error: any) {
        return res.status(500).json({ error: error.message || 'Server error.' });
    }
};

export const deleteCourse = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const deleted = await Course.findByIdAndDelete(req.params.courseId).lean();
        if (!deleted) {
            return res.status(404).json({ error: 'Course not found.' });
        }

        return res.status(200).json({ message: 'Course deleted.' });
    } catch (error: any) {
        return res.status(500).json({ error: error.message || 'Server error.' });
    }
};
