import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { Lesson } from '../models/Lesson';

export const listLessons = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { courseId } = req.query;
        const filter = courseId ? { courseId } : {};
        const lessons = await Lesson.find(filter).lean();
        return res.status(200).json({ data: lessons });
    } catch (error: any) {
        return res.status(500).json({ error: error.message || 'Server error.' });
    }
};

export const getLessonById = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const lesson = await Lesson.findById(req.params.lessonId).lean();
        if (!lesson) {
            return res.status(404).json({ error: 'Lesson not found.' });
        }

        return res.status(200).json({ data: lesson });
    } catch (error: any) {
        return res.status(500).json({ error: error.message || 'Server error.' });
    }
};

export const createLesson = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { courseId, title, type } = req.body;
        if (!courseId || !title || !type) {
            return res.status(400).json({ error: 'courseId, title and type are required.' });
        }

        const created = await Lesson.create(req.body);
        return res.status(201).json({ data: created });
    } catch (error: any) {
        return res.status(500).json({ error: error.message || 'Server error.' });
    }
};

export const updateLesson = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const updated = await Lesson.findByIdAndUpdate(req.params.lessonId, req.body, {
            new: true,
            runValidators: true,
        }).lean();

        if (!updated) {
            return res.status(404).json({ error: 'Lesson not found.' });
        }

        return res.status(200).json({ data: updated });
    } catch (error: any) {
        return res.status(500).json({ error: error.message || 'Server error.' });
    }
};

export const deleteLesson = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const deleted = await Lesson.findByIdAndDelete(req.params.lessonId).lean();
        if (!deleted) {
            return res.status(404).json({ error: 'Lesson not found.' });
        }

        return res.status(200).json({ message: 'Lesson deleted.' });
    } catch (error: any) {
        return res.status(500).json({ error: error.message || 'Server error.' });
    }
};
