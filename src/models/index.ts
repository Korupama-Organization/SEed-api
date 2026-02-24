/**
 * Barrel export for all Mongoose models.
 * Import from here to keep imports clean across the codebase:
 *   import { User, Course, Lesson } from '@/models';
 */

export { User } from './User';
export type { IUser, ITeacherProfile } from './User';

export { Course } from './Course';
export type { ICourse, IModule, ILessonRef } from './Course';

export { Lesson } from './Lesson';
export type { ILesson, IInteractivePoint, IQuizData, IVideoConfig } from './Lesson';

export { Enrollment } from './Enrollment';
export type { IEnrollment, ILessonProgress, ICompletedInteraction } from './Enrollment';

export { Order } from './Order';
export type { IOrder, IOrderItem } from './Order';

export { CreditTransaction } from './CreditTransaction';
export type {
	ICreditTransaction,
	CreditTransactionType,
	CreditTransactionDirection,
	CreditTransactionStatus,
} from './CreditTransaction';

export { AILog } from './AILog';
export type { IAILog, AIAction } from './AILog';
