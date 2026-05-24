import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import axios from 'axios';
import StickerCard from '../ui/StickerCard';
import Input from '../ui/Input';
import { loginSchema, type LoginFormData } from '../../schemas/validation';
import { authAPI } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';
import { showErrorToast, showSuccessToast } from '../../utils/errorHandler';
import { sessionStorage } from '../../utils/storage';

export default function LoginView() {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      setIsLoading(true);
      const response = await authAPI.login(data.identifier, data.password);

      login(response.user, response.access_token);

      showSuccessToast('Welcome back!');
      navigate('/dashboard');
    } catch (error) {
      // Unverified email — send them to the OTP screen if we know their email
      if (axios.isAxiosError(error) && error.response?.status === 403) {
        const detail = error.response.data?.detail ?? '';
        if (typeof detail === 'string' && detail.toLowerCase().includes('verify')) {
          if (data.identifier.includes('@')) {
            sessionStorage.setItem('verification_email', data.identifier.toLowerCase());
          }
          showErrorToast('Please verify your email before logging in. Check your inbox for the verification code.');
          navigate('/verify-email');
          return;
        }
      }

      showErrorToast(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <StickerCard rotate="right" className="auth-container">
      <div className="auth-header">
        <h2>Welcome Back</h2>
        <p className="subtitle">Log in to see the latest tea.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Input
          label="Username or Email"
          type="text"
          id="identifier"
          placeholder="e.g. truthseeker"
          error={errors.identifier?.message}
          {...register('identifier')}
        />

        <Input
          label="Password"
          type="password"
          id="password"
          placeholder="••••••••"
          error={errors.password?.message}
          {...register('password')}
        />

        <div className="helper-links">
          <Link to="/forgot-password" className="link-text">
            Forgot password?
          </Link>
        </div>

        <button
          type="submit"
          className="btn btn-ticket"
          style={{ width: '100%', marginTop: '1rem' }}
          disabled={isLoading}
        >
          {isLoading ? 'Logging in...' : 'Let Me In'}
        </button>
      </form>

      <div className="signup-prompt">
        New here? <Link to="/signup">Join the Club</Link>
      </div>
    </StickerCard>
  );
}
