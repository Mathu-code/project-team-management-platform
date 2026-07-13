import { describe, it, expect } from 'vitest';
import { hashPassword, comparePassword } from '../src/utils/password.js';
import { signToken, verifyToken } from '../src/utils/jwt.js';
import { loginSchema } from '../src/validators/schemas.js';
import { createUserSchema } from '../src/validators/schemas.js';

describe('password utils', () => {
  it('hashes and verifies a password', async () => {
    const hash = await hashPassword('Password123!');
    expect(hash).not.toBe('Password123!');
    expect(await comparePassword('Password123!', hash)).toBe(true);
    expect(await comparePassword('wrong', hash)).toBe(false);
  });
});

describe('jwt utils', () => {
  it('round-trips a token payload', () => {
    const token = signToken({ userId: 'u1', role: 'ADMIN' });
    const payload = verifyToken(token);
    expect(payload.userId).toBe('u1');
    expect(payload.role).toBe('ADMIN');
  });

  it('rejects a tampered token', () => {
    expect(() => verifyToken('not-a-real-token')).toThrow();
  });
});

describe('validators', () => {
  it('rejects an invalid login email', () => {
    const result = loginSchema.safeParse({ email: 'bad', password: 'x' });
    expect(result.success).toBe(false);
  });

  it('accepts a valid login', () => {
    const result = loginSchema.safeParse({ email: 'a@b.com', password: 'x' });
    expect(result.success).toBe(true);
  });

  it('enforces password strength for user creation', () => {
    const weak = createUserSchema.safeParse({
      email: 'a@b.com',
      name: 'Test',
      password: 'weak',
      role: 'TEAM_MEMBER',
    });
    expect(weak.success).toBe(false);
  });
});
