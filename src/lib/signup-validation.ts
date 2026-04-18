export type AccountType = 'teacher' | 'school' | 'student';

export interface SignupInput {
  accountType: AccountType;
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  schoolName: string;
}

export type SignupValidationResult =
  | { ok: true }
  | { ok: false; errorKey: string };

export function validateSignupInput(input: SignupInput): SignupValidationResult {
  if (input.password.length < 6) {
    return { ok: false, errorKey: 'signup.error_password_min' };
  }
  if (input.password !== input.confirmPassword) {
    return { ok: false, errorKey: 'signup.error_passwords_mismatch' };
  }
  if (input.accountType === 'school' && !input.schoolName.trim()) {
    return { ok: false, errorKey: 'signup.error_school_name_required' };
  }
  return { ok: true };
}
