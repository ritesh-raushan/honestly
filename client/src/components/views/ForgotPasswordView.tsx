import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import StickerCard from '../ui/StickerCard';
import Input from '../ui/Input';
import { forgotPasswordSchema, type ForgotPasswordFormData } from '../../schemas/validation';
import { authAPI } from '../../services/api';
import { showErrorToast, showSuccessToast } from '../../utils/errorHandler';
import { sessionStorage } from '../../utils/storage';

export default function ForgotPasswordView() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    try {
      setIsLoading(true);
      const response = await authAPI.forgotPassword({ email: data.email.toLowerCase() });

      sessionStorage.setItem('reset_password_email', data.email.toLowerCase());

      showSuccessToast(
        response.message || 'If the email exists, a password reset code has been sent.'
      );
      navigate('/reset-password');
    } catch (error) {
      showErrorToast(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <StickerCard rotate="right" className="auth-container">
      <div className="auth-header">
        <h2>Forgot Password</h2>
        <p className="subtitle">
          Enter your email and we'll send you a reset code.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Input
          label="Email Address"
          type="email"
          placeholder="you@example.com"
          error={errors.email?.message}
          {...register('email')}
        />

        <button
          type="submit"
          className="btn btn-ticket"
          style={{ width: '100%', marginTop: '1rem' }}
          disabled={isLoading}
        >
          {isLoading ? 'Sending...' : 'Send Reset Code'}
        </button>
      </form>

      <div className="toggle-auth">
        Remember your password? <Link to="/login">Log in here</Link>
      </div>
    </StickerCard>
  );
}
