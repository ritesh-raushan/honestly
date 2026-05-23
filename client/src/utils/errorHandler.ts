import axios, { AxiosError } from 'axios';
import { toast } from 'sonner';
import type { ApiError } from '../types';

export const handleApiError = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<ApiError>;
    
    // Server responded with error
    if (axiosError.response) {
      const status = axiosError.response.status;
      const errorDetail = axiosError.response.data?.detail;
      
      switch (status) {
        case 400:
          return errorDetail || 'Bad request. Please check your input.';
        case 401:
          return errorDetail || 'Unauthorized. Please login again.';
        case 403:
          return errorDetail || 'Access forbidden. You don\'t have permission.';
        case 404:
          return errorDetail || 'Resource not found.';
        case 409:
          return errorDetail || 'Conflict. The resource already exists.';
        case 422:
          return errorDetail || 'Validation error. Please check your input.';
        case 429:
          return errorDetail || 'Too many requests. Please slow down and try again.';
        case 500:
          return 'Server error. Please try again later.';
        default:
          return errorDetail || `An error occurred (${status}).`;
      }
    }
    
    // Request made but no response received
    if (axiosError.request) {
      return 'No response from server. Please check your connection.';
    }
  }
  
  // Something else happened
  if (error instanceof Error) {
    return error.message;
  }
  
  return 'An unexpected error occurred.';
};

export const showErrorToast = (error: unknown): void => {
  const errorMessage = handleApiError(error);
  toast.error(errorMessage);
};

export const showSuccessToast = (message: string): void => {
  toast.success(message);
};

export const showInfoToast = (message: string): void => {
  toast.info(message);
};
