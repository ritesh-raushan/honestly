// User Types
export interface User {
  id: string;
  username: string;
  email: string;
  is_verified: boolean;
  is_accepting_messages: boolean;
  created_at: string;
}

// Auth Types
export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: User;
}

export interface SignupData {
  username: string;
  email: string;
  password: string;
}

export interface LoginData {
  identifier: string;
  password: string;
}

// Backend expects the OTP under the key "otp" (see VerifyOTP schema)
export interface VerifyOTPData {
  email: string;
  otp: string;
}

export interface ResendVerificationData {
  email: string;
}

export interface ForgotPasswordData {
  email: string;
}

export interface VerifyResetOTPData {
  email: string;
  otp: string;
}

export interface ResetPasswordData {
  email: string;
  new_password: string;
}

export interface ChangePasswordData {
  current_password: string;
  new_password: string;
}

// Message Types
export interface Message {
  id: string;
  content: string;
  created_at: string;
}

// Paginated wrapper around messages (matches MessagesPage on the backend)
export interface MessagesPage {
  items: Message[];
  total: number;
  limit: number;
  offset: number;
}

export interface MessageCreateData {
  content: string;
}

// API Response Types
export interface ApiResponse<T = unknown> {
  message?: string;
  success?: boolean;
  data?: T;
}

export interface ApiError {
  detail: string;
}

// User Status Type (for the anonymous feedback landing page)
export interface UserStatus {
  username: string;
  exists: boolean;
  is_accepting_messages: boolean;
}
