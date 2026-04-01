import { Course } from '../models/Course';
import { Enrollment, ICompletedInteraction } from '../models/Enrollment';
import { Lesson } from '../models/Lesson';

class DomainLogicError extends Error {
    statusCode: number;

    constructor(message: string, statusCode: number) {
        super(message);
        this.statusCode = statusCode;
    }
}

interface CreateEnrollmentInput {
    userId: string;
    courseId: string;
}

interface UpdateProgressInput {
    enrollmentId: string;
    lessonId: string;
    lastPosition?: number;
    markCompleted?: boolean;
    completedInteraction?: ICompletedInteraction;
}

const normalizeProgress = (lessonProgress: any[]) => {
    const total = lessonProgress.length;
    const completed = lessonProgress.filter((item) => item.status === 'completed').length;
    const overallProgress = total === 0 ? 0 : Math.round((completed / total) * 100);

    return {
        overallProgress,
        isCompleted: total > 0 && completed === total,
    };
};

export const createEnrollmentWithLessons = async ({ userId, courseId }: CreateEnrollmentInput) => {
    const course = await Course.findById(courseId).lean();
    if (!course) {
        throw new DomainLogicError('Course not found.', 404);
    }

    if (!course.isPublished) {
        throw new DomainLogicError('Course is not published.', 403);
    }

    const lessons = await Lesson.find({ courseId }).sort({ createdAt: 1, _id: 1 }).lean();

    const lessonProgress = lessons.map((lesson, index) => ({
        lessonId: lesson._id,
        status: index === 0 ? 'in-progress' : 'locked',
        lastPosition: 0,
        completedInteractions: [],
    }));

    return Enrollment.create({
        userId,
        courseId,
        lessonProgress,
        overallProgress: 0,
        isCompleted: false,
    });
};

export const updateEnrollmentLessonProgress = async ({
    enrollmentId,
    lessonId,
    lastPosition,
    markCompleted,
    completedInteraction,
}: UpdateProgressInput) => {
    const enrollment: any = await Enrollment.findById(enrollmentId);
    if (!enrollment) {
        throw new DomainLogicError('Enrollment not found.', 404);
    }

    const index = enrollment.lessonProgress.findIndex(
        (item: any) => String(item.lessonId) === String(lessonId),
    );

    if (index === -1) {
        throw new DomainLogicError('Lesson progress not found for enrollment.', 404);
    }

    const current = enrollment.lessonProgress[index];
    if (current.status === 'locked') {
        throw new DomainLogicError('Lesson is locked. Complete previous lessons first.', 409);
    }

    if (typeof lastPosition === 'number' && lastPosition >= 0) {
        current.lastPosition = Math.max(current.lastPosition || 0, lastPosition);
    }

    if (completedInteraction) {
        const exists = (current.completedInteractions || []).some(
            (item: any) => String(item.pointId) === String(completedInteraction.pointId),
        );

        if (!exists) {
            current.completedInteractions.push(completedInteraction);
        }
    }

    if (markCompleted) {
        current.status = 'completed';
        if (index + 1 < enrollment.lessonProgress.length) {
            const next = enrollment.lessonProgress[index + 1];
            if (next.status === 'locked') {
                next.status = 'in-progress';
            }
        }
    }

    const computed = normalizeProgress(enrollment.lessonProgress);
    enrollment.overallProgress = computed.overallProgress;
    enrollment.isCompleted = computed.isCompleted;

    await enrollment.save();
    return enrollment;
};

export const enrollmentDomainErrors = {
    DomainLogicError,
};
