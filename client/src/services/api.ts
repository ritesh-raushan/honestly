import apiClient from '../lib/axios';
import type {
  LoginResponse,
  SignupData,
  VerifyOTPData,
  ResendVerificationData,
  ForgotPasswordData,
  VerifyResetOTPData,
  ResetPasswordData,
  ChangePasswordData,
  User,
  Message,
  MessageCreateData,
  MessagesPage,
  ApiResponse,
  UserStatus,
} from '../types';

// ============= Auth API =============
// All credential / account-lifecycle flows live here.
export const authAPI = {
  // Register new user (triggers a verification OTP email)
  signup: async (data: SignupData): Promise<ApiResponse> => {
    const response = await apiClient.post('/auth/register', data);
    return response.data;
  },

  // Login with email-or-username + password
  login: async (identifier: string, password: string): Promise<LoginResponse> => {
    const response = await apiClient.post('/auth/login', { identifier, password });
    return response.data;
  },

  // Verify email OTP (backend route: /auth/verify-email, body field: "otp")
  verifyEmail: async (data: VerifyOTPData): Promise<ApiResponse> => {
    const response = await apiClient.post('/auth/verify-email', data);
    return response.data;
  },

  // Resend verification code (rate-limited, always returns a generic response)
  resendVerification: async (data: ResendVerificationData): Promise<ApiResponse> => {
    const response = await apiClient.post('/auth/resend-verification', data);
    return response.data;
  },

  // Step 1 of forgot password — request a reset OTP via email
  forgotPassword: async (data: ForgotPasswordData): Promise<ApiResponse> => {
    const response = await apiClient.post('/auth/forgot-password', data);
    return response.data;
  },

  // Step 2 — verify the reset OTP (must be called before resetPassword)
  verifyResetOTP: async (data: VerifyResetOTPData): Promise<ApiResponse> => {
    const response = await apiClient.post('/auth/verify-reset-otp', data);
    return response.data;
  },

  // Step 3 — actually reset the password (requires the OTP to have been verified)
  resetPassword: async (data: ResetPasswordData): Promise<ApiResponse> => {
    const response = await apiClient.post('/auth/reset-password', data);
    return response.data;
  },

  // Change password for an already-authenticated user (requires current password)
  changePassword: async (data: ChangePasswordData): Promise<ApiResponse> => {
    const response = await apiClient.post('/auth/change-password', data);
    return response.data;
  },

  // Logout — clears the refresh-token cookie server-side
  logout: async (): Promise<ApiResponse> => {
    const response = await apiClient.post('/auth/logout');
    return response.data;
  },

  // Refresh access token using the httpOnly refresh-token cookie
  refreshToken: async (): Promise<{ access_token: string; refresh_token: string }> => {
    const response = await apiClient.post('/auth/refresh');
    return response.data;
  },

  // Hydrate the current user on app boot
  me: async (): Promise<User> => {
    const response = await apiClient.get('/auth/me');
    return response.data;
  },

  // Permanently delete the authenticated account
  deleteAccount: async (): Promise<ApiResponse> => {
    const response = await apiClient.delete('/auth/me');
    return response.data;
  },
};

// ============= User API =============
// Lookup endpoints used during signup and on the public feedback page.
export const userAPI = {
  // Check if username is available (used while typing on the signup form)
  checkUsername: async (username: string): Promise<{ available: boolean; message: string }> => {
    const response = await apiClient.get(`/auth/check-username?username=${encodeURIComponent(username)}`);
    return response.data;
  },

  // Check if email is available
  checkEmail: async (email: string): Promise<{ available: boolean; message: string }> => {
    const response = await apiClient.get(`/auth/check-email?email=${encodeURIComponent(email)}`);
    return response.data;
  },

  // Toggle message acceptance (requires auth)
  toggleMessages: async (): Promise<User> => {
    const response = await apiClient.post('/toggle-messages');
    return response.data;
  },

  // Get public user status (used by the anonymous feedback page)
  getUserStatus: async (username: string): Promise<UserStatus> => {
    const response = await apiClient.get(`/u/${encodeURIComponent(username)}/status`);
    return response.data;
  },
};

// ============= Message API =============
export const messageAPI = {
  // Paginated list of messages received by the authenticated user
  getMessages: async (limit: number = 20, offset: number = 0): Promise<MessagesPage> => {
    const response = await apiClient.get(`/messages?limit=${limit}&offset=${offset}`);
    return response.data;
  },

  // Total message count (used for dashboard header / empty state)
  getMessageCount: async (): Promise<{ count: number }> => {
    const response = await apiClient.get('/messages/count');
    return response.data;
  },

  // Send anonymous message to a user
  sendMessage: async (username: string, data: MessageCreateData): Promise<ApiResponse> => {
    const response = await apiClient.post(`/u/${encodeURIComponent(username)}`, data);
    return response.data;
  },

  // Delete one of your own messages
  deleteMessage: async (messageId: string): Promise<ApiResponse> => {
    const response = await apiClient.delete(`/messages/${messageId}`);
    return response.data;
  },
};

// Re-export Message for views that want a single import surface
export type { Message };
