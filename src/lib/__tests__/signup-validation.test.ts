import { describe, it, expect } from 'vitest';
import { validateSignupInput, type SignupInput } from '../signup-validation';

describe('validateSignupInput', () => {
  const base: SignupInput = {
    accountType: 'teacher',
    fullName: 'Maria',
    email: 'maria@example.com',
    password: 'senha123',
    confirmPassword: 'senha123',
    schoolName: '',
  };

  it('accepts valid teacher signup', () => {
    expect(validateSignupInput(base)).toEqual({ ok: true });
  });

  it('accepts valid student signup without schoolName', () => {
    expect(validateSignupInput({ ...base, accountType: 'student' })).toEqual({ ok: true });
  });

  it('rejects password shorter than 6 chars', () => {
    const result = validateSignupInput({ ...base, password: 'abc', confirmPassword: 'abc' });
    expect(result).toEqual({ ok: false, errorKey: 'signup.error_password_min' });
  });

  it('rejects mismatched passwords', () => {
    const result = validateSignupInput({ ...base, confirmPassword: 'outra' });
    expect(result).toEqual({ ok: false, errorKey: 'signup.error_passwords_mismatch' });
  });

  it('rejects school signup without schoolName', () => {
    const result = validateSignupInput({ ...base, accountType: 'school', schoolName: '' });
    expect(result).toEqual({ ok: false, errorKey: 'signup.error_school_name_required' });
  });

  it('allows school signup with schoolName', () => {
    const result = validateSignupInput({ ...base, accountType: 'school', schoolName: 'Escola ABC' });
    expect(result).toEqual({ ok: true });
  });
});
