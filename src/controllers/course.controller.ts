import { Request, Response } from 'express';
import { ScormCourseDraft } from '../models/ScormCourseDraft';

type SaveScormCourseBody = {
    courseId?: string;
    courseInfo?: {
        title?: string;
        subtitle?: string;
        description?: string;
        category?: string;
        level?: string;
        language?: string;
        estimatedHours?: string;
    };
    settings?: {
        navigationMode?: 'linear' | 'free';
        passScore?: number;
        allowRetakes?: boolean;
        trackTimeSpent?: boolean;
    };
    metadata?: {
        identifier?: string;
        version?: string;
        author?: string;
        keywords?: string;
        notes?: string;
    };
    chapters?: Array<{
        order?: number;
        title?: string;
        description?: string;
        durationMinutes?: number;
        assets?: Array<{
            contentType?: 'video' | 'slides' | 'pdf' | 'images';
            fileName?: string;
            fileType?: string;
            fileSize?: number;
            fileUrl?: string;
            uploadedAt?: string;
        }>;
        questions?: Array<{
            prompt?: string;
            explanation?: string;
            options?: string[];
            correctOptionId?: string;
        }>;
    }>;
};

export async function saveScormCourseDraft(req: Request, res: Response) {
    try {
        const { courseId, courseInfo, settings, metadata, chapters } =
            req.body as SaveScormCourseBody;

        if (
            !courseId ||
            !courseInfo?.title ||
            !settings ||
            !metadata?.identifier ||
            !metadata?.version ||
            !metadata?.author ||
            !Array.isArray(chapters)
        ) {
            return res.status(400).json({
                error: 'Missing required course fields.',
            });
        }

        const savedCourse = await ScormCourseDraft.findOneAndUpdate(
            { courseId },
            {
                courseId,
                courseInfo,
                settings,
                metadata,
                chapters: chapters.map((chapter) => ({
                    order: chapter.order ?? 1,
                    title: chapter.title ?? 'Untitled Chapter',
                    description: chapter.description ?? '',
                    durationMinutes: chapter.durationMinutes ?? 1,
                    assets: (chapter.assets ?? []).map((asset) => ({
                        contentType: asset.contentType,
                        fileName: asset.fileName,
                        fileType: asset.fileType,
                        fileSize: asset.fileSize,
                        fileUrl: asset.fileUrl,
                        uploadedAt: asset.uploadedAt ? new Date(asset.uploadedAt) : new Date(),
                    })),
                    questions: (chapter.questions ?? []).map((question) => ({
                        prompt: question.prompt ?? '',
                        explanation: question.explanation,
                        options: question.options ?? [],
                        correctOptionId: question.correctOptionId ?? '',
                    })),
                })),
            },
            {
                new: true,
                upsert: true,
                runValidators: true,
                setDefaultsOnInsert: true,
            }
        );

        return res.status(201).json({
            message: 'SCORM course saved successfully.',
            course: savedCourse,
        });
    } catch (error) {
        console.error('Failed to save SCORM course draft:', error);

        return res.status(500).json({
            error: 'Internal Server Error',
        });
    }
}
