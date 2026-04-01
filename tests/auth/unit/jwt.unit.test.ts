import {
    generateAccessToken,
    generateRefreshToken,
    generateResetPasswordToken,
    getTokenIssuedAt,
    verifyAccessToken,
    verifyRefreshToken,
    verifyResetPasswordToken,
} from '../../../src/utils/jwt';

describe('jwt utility', () => {
    it('generates and verifies access token payload', () => {
        const token = generateAccessToken('user-1', 'teacher');
        const payload = verifyAccessToken(token);

        expect(payload.sub).toBe('user-1');
        expect(payload.type).toBe('access');
        expect(payload.role).toBe('teacher');
    });

    it('generates and verifies refresh/reset tokens', () => {
        const refreshToken = generateRefreshToken('user-2');
        const resetToken = generateResetPasswordToken('user-3');

        const refreshPayload = verifyRefreshToken(refreshToken);
        const resetPayload = verifyResetPasswordToken(resetToken);

        expect(refreshPayload.sub).toBe('user-2');
        expect(refreshPayload.type).toBe('refresh');
        expect(resetPayload.sub).toBe('user-3');
        expect(resetPayload.type).toBe('reset_password');
    });

    it('throws for invalid token signature and handles missing iat', () => {
        expect(() => verifyAccessToken('invalid.token.value')).toThrow();
        expect(getTokenIssuedAt({} as any)).toBe(0);
    });
});
