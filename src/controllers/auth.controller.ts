import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User, IUser } from '../models/User';

export const registerUser = async (req: Request, res: Response) => {
    try {
        const {
            fullName,
            email,
            phone,
            password,
            role,
            avatar,
            authProvider,
            teacherProfile
        } = req.body;

        // 1. Kiểm tra field không được bỏ trống
        if (!fullName || !email || !phone || !password) {
            return res.status(400).json({ error: 'fullName, email, phone, and password are required' });
        }

        // 2. Validate email / phone qua Database
        const existingEmail = await User.findOne({ email: email.toLowerCase() });
        if (existingEmail) {
            return res.status(400).json({ error: 'Email already exists in system' });
        }

        const existingPhone = await User.findOne({ phone });
        if (existingPhone) {
            return res.status(400).json({ error: 'Phone number already exists in system' });
        }

        const assignRole = role || 'student';

        // 3. Xử lý các điều kiện dữ liệu của theo Role
        if ((assignRole === 'student' || assignRole === 'admin') && teacherProfile) {
            return res.status(400).json({
                error: `Teacher profile cannot be attached to a ${assignRole} account`,
            });
        }

        // 4. Hash Password an toàn (Dự phòng module chưa cài)
        let hashedPassword = password;
        if (bcrypt && bcrypt.hash) {
            const salt = await bcrypt.genSalt(10);
            hashedPassword = await bcrypt.hash(password, salt);
        }

        // 5. Chuẩn bị payload Data User Model
        const newUserData: Partial<IUser> = {
            fullName,
            email: email.toLowerCase(),
            phone,
            password: hashedPassword,
            role: assignRole,
            avatar,
            authProvider: authProvider || 'local',
            isBlocked: false,
        };

        if (assignRole === 'teacher' && teacherProfile) {
            newUserData.teacherProfile = teacherProfile;
        }

        // 6. Tạo record
        const newUser = await User.create(newUserData);

        // 7. Gen JWT (Json Web Token)
        let token = 'development-token';
        if (jwt && jwt.sign) {
            token = jwt.sign(
                { userId: newUser._id, role: newUser.role },
                process.env.JWT_SECRET || 'fallback_secret',
                { expiresIn: '7d' }
            );
        }

        // Return Data sạch không có Mật khẩu
        const userObj = newUser.toObject();
        const { password: _, ...safeUserData } = userObj as any;

        return res.status(201).json({
            message: 'User registered successfully',
            user: safeUserData,
            token
        });
    } catch (error: any) {
        return res.status(500).json({ error: error.message || 'Server Internal Error' });
    }
};
