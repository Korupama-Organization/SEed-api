import { NextFunction, Request, Response } from 'express';

const ALLOWED_REGISTRATION_ROLES = new Set(['student', 'teacher']);

export const enforceRegistrationRolePolicy = (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    const roleValue = req.body?.role;

    if (roleValue === undefined || roleValue === null || roleValue === '') {
        req.body = { ...req.body, role: 'student' };
        return next();
    }

    const normalizedRole = String(roleValue).trim().toLowerCase();

    if (normalizedRole === 'admin') {
        return res.status(403).json({ error: 'Không được phép đăng ký tài khoản admin.' });
    }

    if (!ALLOWED_REGISTRATION_ROLES.has(normalizedRole)) {
        return res.status(400).json({ error: 'Role không hợp lệ cho đăng ký công khai.' });
    }

    req.body = { ...req.body, role: normalizedRole };
    return next();
};
