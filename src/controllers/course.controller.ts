import { Request, Response } from 'express';
import { Course } from '../models/Course';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { ScormCourseDraft } from '../models/ScormCourseDraft';

type CourseInfoInput = {
    title?: string;
    subtitle?: string;
    description?: string;
    category?: string;
    level?: string;
    language?: string;
    estimatedHours?: string;
};

type CourseSettingsInput = {
    navigationMode?: 'linear' | 'free';
    passScore?: number | string;
    allowRetakes?: boolean;
    trackTimeSpent?: boolean;
};

type CourseMetadataInput = {
    identifier?: string;
    version?: string;
    author?: string;
    keywords?: string;
    notes?: string;
};

type CourseChapterInput = {
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
};

type SaveScormCourseBody = {
    courseId?: string;
    courseInfo?: CourseInfoInput;
    settings?: CourseSettingsInput;
    metadata?: CourseMetadataInput;
    chapters?: CourseChapterInput[];
};

type SaveCourseMetadataBody = {
    courseId?: string;
    courseInfo?: CourseInfoInput;
    settings?: CourseSettingsInput;
    metadata?: CourseMetadataInput;
};

const DEFAULT_SETTINGS = {
    navigationMode: 'linear' as const,
    passScore: 80,
    allowRetakes: true,
    trackTimeSpent: true,
};

function normalizeRequiredString(value?: string): string | undefined {
    const normalized = value?.trim();
    return normalized ? normalized : undefined;
}

function normalizeOptionalString(value?: string): string | undefined {
    const normalized = value?.trim();
    return normalized ? normalized : undefined;
}

function normalizeAssetUrl(value?: string): string | undefined {
    const normalized = value?.trim();
    return normalized ? normalized : undefined;
}

function normalizePassScore(value?: number | string): number | undefined {
    if (value === undefined || value === null || value === '') {
        return undefined;
    }

    const parsed = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
}

function buildCourseInfo(
    existing?: SaveCourseMetadataBody['courseInfo'],
    input?: SaveCourseMetadataBody['courseInfo'],
) {
    return {
        title: normalizeRequiredString(input?.title) ?? normalizeRequiredString(existing?.title),
        subtitle: normalizeOptionalString(input?.subtitle) ?? normalizeOptionalString(existing?.subtitle),
        description: normalizeOptionalString(input?.description) ?? normalizeOptionalString(existing?.description),
        category: normalizeOptionalString(input?.category) ?? normalizeOptionalString(existing?.category),
        level: normalizeOptionalString(input?.level) ?? normalizeOptionalString(existing?.level),
        language: normalizeOptionalString(input?.language) ?? normalizeOptionalString(existing?.language),
        estimatedHours: normalizeOptionalString(input?.estimatedHours) ?? normalizeOptionalString(existing?.estimatedHours),
    };
}

function buildSettings(
    existing?: SaveCourseMetadataBody['settings'],
    input?: SaveCourseMetadataBody['settings'],
) {
    return {
        navigationMode:
            input?.navigationMode ??
            existing?.navigationMode ??
            DEFAULT_SETTINGS.navigationMode,
        passScore:
            normalizePassScore(input?.passScore) ??
            normalizePassScore(existing?.passScore) ??
            DEFAULT_SETTINGS.passScore,
        allowRetakes:
            input?.allowRetakes ??
            existing?.allowRetakes ??
            DEFAULT_SETTINGS.allowRetakes,
        trackTimeSpent:
            input?.trackTimeSpent ??
            existing?.trackTimeSpent ??
            DEFAULT_SETTINGS.trackTimeSpent,
    };
}

function buildMetadata(
    existing?: SaveCourseMetadataBody['metadata'],
    input?: SaveCourseMetadataBody['metadata'],
) {
    return {
        identifier: normalizeRequiredString(input?.identifier) ?? normalizeRequiredString(existing?.identifier),
        version: normalizeRequiredString(input?.version) ?? normalizeRequiredString(existing?.version),
        author: normalizeRequiredString(input?.author) ?? normalizeRequiredString(existing?.author),
        keywords: normalizeOptionalString(input?.keywords) ?? normalizeOptionalString(existing?.keywords),
        notes: normalizeOptionalString(input?.notes) ?? normalizeOptionalString(existing?.notes),
    };
}

function getMetadataValidationErrors(payload: {
    courseId?: string;
    courseInfo: ReturnType<typeof buildCourseInfo>;
    settings: ReturnType<typeof buildSettings>;
    metadata: ReturnType<typeof buildMetadata>;
}) {
    const errors: string[] = [];

    if (!normalizeRequiredString(payload.courseId)) {
        errors.push('courseId is required');
    }

    if (!payload.courseInfo.title) {
        errors.push('courseInfo.title is required');
    }

    if (!payload.metadata.identifier) {
        errors.push('metadata.identifier is required');
    }

    if (!payload.metadata.version) {
        errors.push('metadata.version is required');
    }

    if (!payload.metadata.author) {
        errors.push('metadata.author is required');
    }

    if (!['linear', 'free'].includes(payload.settings.navigationMode)) {
        errors.push('settings.navigationMode must be either linear or free');
    }

    if (payload.settings.passScore < 0 || payload.settings.passScore > 100) {
        errors.push('settings.passScore must be between 0 and 100');
    }

    return errors;
}

function buildCourseTags(keywords?: string): string[] {
    if (!keywords) {
        return [];
    }

    return Array.from(
        new Set(
            keywords
                .split(',')
                .map((keyword) => keyword.trim())
                .filter(Boolean)
        )
    );
}

function buildCourseThumbnail(chapters: CourseChapterInput[] = []): string | undefined {
    for (const chapter of chapters) {
        for (const asset of chapter.assets ?? []) {
            const fileUrl = normalizeAssetUrl(asset.fileUrl);
            if (fileUrl) {
                return fileUrl;
            }
        }
    }

    return undefined;
}

export async function saveCourseMetadata(req: AuthenticatedRequest, res: Response) {
    try {
        const teacherId = req.auth?.userId;
        const { courseId, courseInfo, settings, metadata } =
            req.body as SaveCourseMetadataBody;

        const normalizedCourseId = normalizeRequiredString(courseId);
        const existingDraft = normalizedCourseId
            ? await ScormCourseDraft.findOne({ courseId: normalizedCourseId }).lean()
            : null;

        const mergedCourseInfo = buildCourseInfo(existingDraft?.courseInfo, courseInfo);
        const mergedSettings = buildSettings(existingDraft?.settings, settings);
        const mergedMetadata = buildMetadata(existingDraft?.metadata, metadata);

        const validationErrors = getMetadataValidationErrors({
            courseId: normalizedCourseId,
            courseInfo: mergedCourseInfo,
            settings: mergedSettings,
            metadata: mergedMetadata,
        });

        if (validationErrors.length > 0) {
            return res.status(400).json({
                error: 'Missing or invalid course metadata.',
                details: validationErrors,
            });
        }

        if (!teacherId) {
            return res.status(401).json({
                error: 'Authentication is required to save course metadata.',
            });
        }

        const savedCourse = await ScormCourseDraft.findOneAndUpdate(
            { courseId: normalizedCourseId },
            {
                courseId: normalizedCourseId,
                teacherId,
                courseInfo: mergedCourseInfo,
                settings: mergedSettings,
                metadata: mergedMetadata,
                chapters: existingDraft?.chapters ?? [],
            },
            {
                new: true,
                upsert: true,
                runValidators: true,
                setDefaultsOnInsert: true,
            }
        );

        return res.status(existingDraft ? 200 : 201).json({
            message: existingDraft
                ? 'Course metadata updated successfully.'
                : 'Course metadata saved successfully.',
            course: savedCourse,
        });
    } catch (error) {
        console.error('Failed to save course metadata:', error);

        return res.status(500).json({
            error: 'Internal Server Error',
        });
    }
}

export async function getCourseMetadata(req: Request, res: Response) {
    try {
        const rawCourseId = Array.isArray(req.params.courseId)
            ? req.params.courseId[0]
            : req.params.courseId;
        const courseId = normalizeRequiredString(rawCourseId);

        if (!courseId) {
            return res.status(400).json({
                error: 'courseId is required.',
            });
        }

        const course = await ScormCourseDraft.findOne(
            { courseId },
            {
                _id: 0,
                courseId: 1,
                courseInfo: 1,
                settings: 1,
                metadata: 1,
                createdAt: 1,
                updatedAt: 1,
            }
        ).lean();

        if (!course) {
            return res.status(404).json({
                error: 'Course metadata not found.',
            });
        }

        return res.status(200).json({
            course,
        });
    } catch (error) {
        console.error('Failed to get course metadata:', error);

        return res.status(500).json({
            error: 'Internal Server Error',
        });
    }
}

export async function saveScormCourseDraft(req: AuthenticatedRequest, res: Response) {
    try {
        const teacherId = req.auth?.userId;
        const { courseId, courseInfo, settings, metadata, chapters } =
            req.body as SaveScormCourseBody;

        const normalizedCourseId = normalizeRequiredString(courseId);
        const mergedCourseInfo = buildCourseInfo(undefined, courseInfo);
        const mergedSettings = buildSettings(undefined, settings);
        const mergedMetadata = buildMetadata(undefined, metadata);

        const validationErrors = getMetadataValidationErrors({
            courseId: normalizedCourseId,
            courseInfo: mergedCourseInfo,
            settings: mergedSettings,
            metadata: mergedMetadata,
        });

        if (!Array.isArray(chapters)) {
            validationErrors.push('chapters must be an array');
        }

        if (Array.isArray(chapters)) {
            chapters.forEach((chapter, chapterIndex) => {
                (chapter.assets ?? []).forEach((asset, assetIndex) => {
                    if (!normalizeAssetUrl(asset.fileUrl)) {
                        validationErrors.push(
                            `chapters.${chapterIndex}.assets.${assetIndex}.fileUrl is required`
                        );
                    }
                });
            });
        }

        if (validationErrors.length > 0) {
            return res.status(400).json({
                error: 'Missing or invalid course fields.',
                details: validationErrors,
            });
        }

        if (!teacherId) {
            return res.status(401).json({
                error: 'Authentication is required to save a SCORM course.',
            });
        }

        const normalizedChapters = chapters!.map((chapter) => ({
            order: chapter.order ?? 1,
            title: normalizeRequiredString(chapter.title) ?? 'Untitled Chapter',
            description: normalizeOptionalString(chapter.description) ?? '',
            durationMinutes: chapter.durationMinutes ?? 1,
            assets: (chapter.assets ?? []).map((asset) => ({
                contentType: asset.contentType,
                fileName: asset.fileName,
                fileType: asset.fileType,
                fileSize: asset.fileSize,
                fileUrl: normalizeAssetUrl(asset.fileUrl)!,
                uploadedAt: asset.uploadedAt ? new Date(asset.uploadedAt) : new Date(),
            })),
            questions: (chapter.questions ?? []).map((question) => ({
                prompt: normalizeRequiredString(question.prompt) ?? '',
                explanation: normalizeOptionalString(question.explanation),
                options: question.options ?? [],
                correctOptionId: question.correctOptionId ?? '',
            })),
        }));

        const savedCourseDraft = await ScormCourseDraft.findOneAndUpdate(
            { courseId: normalizedCourseId },
            {
                courseId: normalizedCourseId,
                teacherId,
                courseInfo: mergedCourseInfo,
                settings: mergedSettings,
                metadata: mergedMetadata,
                chapters: normalizedChapters,
            },
            {
                new: true,
                upsert: true,
                runValidators: true,
                setDefaultsOnInsert: true,
            }
        );

        const savedCourse = await Course.findOneAndUpdate(
            { scormCourseId: normalizedCourseId },
            {
                title: mergedCourseInfo.title,
                slug: normalizedCourseId,
                instructor: teacherId,
                description: mergedCourseInfo.description,
                thumbnail: buildCourseThumbnail(chapters),
                price: 0,
                isPublished: false,
                tags: buildCourseTags(mergedMetadata.keywords),
                sourceType: 'scorm',
                scormCourseId: normalizedCourseId,
                curriculum: normalizedChapters.map((chapter) => ({
                    title: chapter.title,
                    lessons: [],
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
            course: savedCourseDraft,
            publishedCourse: savedCourse,
        });
    } catch (error) {
        console.error('Failed to save SCORM course draft:', error);

        return res.status(500).json({
            error: 'Internal Server Error',
        });
    }
}
