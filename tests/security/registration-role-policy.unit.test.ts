import { enforceRegistrationRolePolicy } from '../../src/middlewares/registration-role-policy.middleware';

describe('enforceRegistrationRolePolicy', () => {
  it('rejects admin role with 403', () => {
    const req: any = { body: { role: 'admin' } };
    const json = jest.fn();
    const res: any = { status: jest.fn(() => ({ json })) };
    const next = jest.fn();

    enforceRegistrationRolePolicy(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('allows teacher role', () => {
    const req: any = { body: { role: 'teacher' } };
    const res: any = { status: jest.fn() };
    const next = jest.fn();

    enforceRegistrationRolePolicy(req, res, next);

    expect(req.body.role).toBe('teacher');
    expect(next).toHaveBeenCalled();
  });

  it('defaults empty role to student', () => {
    const req: any = { body: {} };
    const res: any = { status: jest.fn() };
    const next = jest.fn();

    enforceRegistrationRolePolicy(req, res, next);

    expect(req.body.role).toBe('student');
    expect(next).toHaveBeenCalled();
  });
});
