import { requireAuth } from '../../../src/middlewares/auth.middleware';
import { User } from '../../../src/models/User';
import { getTokenIssuedAt, verifyAccessToken } from '../../../src/utils/jwt';

jest.mock('../../../src/models/User', () => ({
    User: {
        findById: jest.fn(),
    },
}));

jest.mock('../../../src/utils/jwt', () => ({
    getTokenIssuedAt: jest.fn(() => 100),
    verifyAccessToken: jest.fn(),
}));

const createRes = () => {
    const res: any = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};

describe('requireAuth middleware', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('returns 401 when authorization header is missing', async () => {
        const req: any = { headers: {} };
        const res = createRes();
        const next = jest.fn();

        await requireAuth(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(next).not.toHaveBeenCalled();
    });

    it('returns 401 when access token verification fails', async () => {
        const req: any = { headers: { authorization: 'Bearer bad-token' } };
        const res = createRes();
        const next = jest.fn();
        (verifyAccessToken as jest.Mock).mockImplementation(() => {
            throw new Error('invalid');
        });

        await requireAuth(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(next).not.toHaveBeenCalled();
    });

    it('calls next and sets req.auth for valid token and user', async () => {
        const req: any = { headers: { authorization: 'Bearer ok-token' } };
        const res = createRes();
        const next = jest.fn();

        (verifyAccessToken as jest.Mock).mockReturnValue({
            type: 'access',
            sub: 'u1',
            iat: 123,
        });
        (getTokenIssuedAt as jest.Mock).mockReturnValue(123);
        (User.findById as jest.Mock).mockResolvedValue({
            _id: 'u1',
            role: 'student',
            isBlocked: false,
            passwordUpdatedAt: new Date(0),
        });

        await requireAuth(req, res, next);

        expect(next).toHaveBeenCalled();
        expect(req.auth).toEqual(
            expect.objectContaining({ userId: 'u1', role: 'student' }),
        );
    });
});
