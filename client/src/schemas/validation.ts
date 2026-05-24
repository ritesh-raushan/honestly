import { z } from 'zod';

// Signup Schema (matches backend: 3-20 alphanumeric/_, 8-72 char password)
export const signupSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be at most 20 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  email: z
    .string()
    .email('Please enter a valid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(72, 'Password must be at most 72 characters'),
});

export type SignupFormData = z.infer<typeof signupSchema>;

// Login Schema (identifier is email or username, password kept lenient so users can submit their existing creds)
export const loginSchema = z.object({
  identifier: z
    .string()
    .min(1, 'Username or email is required'),
  password: z
    .string()
    .min(1, 'Password is required'),
});

export type LoginFormData = z.infer<typeof loginSchema>;

// OTP Verification Schema (backend field name is "otp")
export const otpSchema = z.object({
  email: z
    .string()
    .email('Please enter a valid email address'),
  otp: z
    .string()
    .length(6, 'OTP must be exactly 6 digits')
    .regex(/^\d{6}$/, 'OTP must contain only digits'),
});

export type OTPFormData = z.infer<typeof otpSchema>;

// Message Schema
export const messageSchema = z.object({
  content: z
    .string()
    .min(1, 'Message cannot be empty')
    .max(1000, 'Message cannot exceed 1000 characters'),
});

export type MessageFormData = z.infer<typeof messageSchema>;

// Resend Verification Schema
export const resendVerificationSchema = z.object({
  email: z
    .string()
    .email('Please enter a valid email address'),
});

export type ResendVerificationFormData = z.infer<typeof resendVerificationSchema>;

// Forgot Password Schema (just the email — the OTP is collected on the next step)
export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .email('Please enter a valid email address'),
});

export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

// Reset Password Schema (OTP + new password, with a confirm field for UX)
// The email itself is carried across views via sessionStorage so it stays out of the form.
export const resetPasswordSchema = z
  .object({
    otp: z
      .string()
      .length(6, 'OTP must be exactly 6 digits')
      .regex(/^\d{6}$/, 'OTP must contain only digits'),
    new_password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(72, 'Password must be at most 72 characters'),
    confirm_password: z.string(),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: 'Passwords do not match',
    path: ['confirm_password'],
  });

export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

// Password fields only — OTP is managed as separate digit inputs in ResetPasswordView
export const resetPasswordFieldsSchema = z
  .object({
    new_password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(72, 'Password must be at most 72 characters'),
    confirm_password: z.string(),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: 'Passwords do not match',
    path: ['confirm_password'],
  });

export type ResetPasswordFieldsFormData = z.infer<typeof resetPasswordFieldsSchema>;

// Change Password Schema (used in Settings — requires the current password as a confirmation step)
export const changePasswordSchema = z
  .object({
    current_password: z
      .string()
      .min(1, 'Current password is required'),
    new_password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(72, 'Password must be at most 72 characters'),
    confirm_password: z.string(),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: 'Passwords do not match',
    path: ['confirm_password'],
  })
  .refine((data) => data.current_password !== data.new_password, {
    message: 'New password must be different from the current password',
    path: ['new_password'],
  });

export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;
