import { NextFunction, Request, Response } from 'express';
import { AuthenticatedRequest } from './auth.middleware';

type OwnerResolver = (req: AuthenticatedRequest) => Promise<string | null>;

interface OwnershipOptions {
    getOwnerId: OwnerResolver;
    allowRoles?: string[];
}

export const requireRole = (...roles: string[]) => {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        if (!req.auth) {
            return res.status(401).json({ error: 'Authentication required.' });
        }

        if (!roles.includes(req.auth.role)) {
            return res.status(403).json({ error: 'Forbidden.' });
        }

        return next();
    };
};

export const requireOwnership = ({ getOwnerId, allowRoles = [] }: OwnershipOptions) => {
    return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        try {
            if (!req.auth) {
                return res.status(401).json({ error: 'Authentication required.' });
            }

            if (allowRoles.includes(req.auth.role)) {
                return next();
            }

            const ownerId = await getOwnerId(req);
            if (!ownerId) {
                return res.status(404).json({ error: 'Resource not found.' });
            }

            if (String(ownerId) !== String(req.auth.userId)) {
                return res.status(403).json({ error: 'Forbidden.' });
            }

            return next();
        } catch (error: any) {
            return res.status(500).json({ error: error.message || 'Server error.' });
        }
    };
};
