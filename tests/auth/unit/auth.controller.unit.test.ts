import bcrypt from 'bcrypt';
import {
    loginUser,
    refreshAccessToken,
    registerUser,
} from '../../../src/controllers/auth.controller';
import { User } from '../../../src/models/User';
import {
    generateAccessToken,
    generateRefreshToken,
    verifyRefreshToken,
} from '../../../src/utils/jwt';

jest.mock('../../../src/models/User', () => ({
    User: {
        findOne: jest.fn(),
        create: jest.fn(),
        findByIdAndDelete: jest.fn(),
        findById: jest.fn(),
    },
}));

jest.mock('bcrypt');

jest.mock('../../../src/utils/redis', () => ({
    deleteTempValue: jest.fn(),
    existsTempValue: jest.fn().mockResolvedValue(false),
    getTempValue: jest.fn(),
    setTempValue: jest.fn(),
}));

jest.mock('../../../src/utils/email', () => ({
    sendOtpEmail: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../../../src/utils/otp', () => ({
    generateOtpCode: jest.fn(() => '123456'),
}));

jest.mock('../../../src/utils/jwt', () => ({
    generateAccessToken: jest.fn(() => 'access-token'),
    generateRefreshToken: jest.fn(() => 'refresh-token'),
    generateResetPasswordToken: jest.fn(() => 'reset-token'),
    getTokenIssuedAt: jest.fn(() => 0),
    verifyRefreshToken: jest.fn(),
    verifyResetPasswordToken: jest.fn(),
}));

const createRes = () => {
    const res: any = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};

describe('auth.controller unit', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('registerUser returns 400 for missing required fields', async () => {
        const req: any = { body: { email: 'a@b.com' } };
        const res = createRes();

        await registerUser(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalled();
    });

    it('loginUser returns 400 when email/password missing', async () => {
        const req: any = { body: { email: '' } };
        const res = createRes();

        await loginUser(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
    });

    it('loginUser returns 200 with tokens on valid credentials', async () => {
        const req: any = {
            body: { email: 'teacher@example.com', password: 'secret123' },
        };
        const res = createRes();

        const fakeUser: any = {
            _id: 'u-1',
            role: 'teacher',
            password: 'hashed',
            emailVerified: true,
            isBlocked: false,
            toObject: () => ({
                _id: 'u-1',
                role: 'teacher',
                email: 'teacher@example.com',
                password: 'hashed',
            }),
        };

        (User.findOne as jest.Mock).mockReturnValue({
            select: jest.fn().mockResolvedValue(fakeUser),
        });
        (bcrypt.compare as jest.Mock).mockResolvedValue(true);

        await loginUser(req, res);

        expect(User.findOne).toHaveBeenCalled();
        expect(generateAccessToken).toHaveBeenCalledWith('u-1', 'teacher');
        expect(generateRefreshToken).toHaveBeenCalledWith('u-1');
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                access_token: 'access-token',
                refresh_token: 'refresh-token',
            }),
        );
    });

    it('refreshAccessToken returns 400 when refresh token missing', async () => {
        const req: any = { body: {} };
        const res = createRes();

        await refreshAccessToken(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(verifyRefreshToken).not.toHaveBeenCalled();
    });
});
