import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import StickerCard from '../ui/StickerCard';
import Input from '../ui/Input';
import { signupSchema, type SignupFormData } from '../../schemas/validation';
import { authAPI, userAPI } from '../../services/api';
import { showErrorToast, showSuccessToast } from '../../utils/errorHandler';
import { sessionStorage } from '../../utils/storage';

export default function SignupView() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [emailAvailable, setEmailAvailable] = useState<boolean | null>(null);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    mode: 'onChange',
  });

  const username = watch('username');
  const email = watch('email');

  // Debounced username availability check
  useEffect(() => {
    if (!username || username.length < 3) {
      setUsernameAvailable(null);
      setIsCheckingUsername(false);
      return;
    }

    setIsCheckingUsername(true);
    const timer = setTimeout(async () => {
      try {
        const result = await userAPI.checkUsername(username);
        setUsernameAvailable(result.available);
      } catch (error) {
        console.error('Error checking username:', error);
        setUsernameAvailable(null);
      } finally {
        setIsCheckingUsername(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [username]);

  // Debounced email availability check
  useEffect(() => {
    if (!email || !email.includes('@')) {
      setEmailAvailable(null);
      setIsCheckingEmail(false);
      return;
    }

    setIsCheckingEmail(true);
    const timer = setTimeout(async () => {
      try {
        const result = await userAPI.checkEmail(email);
        setEmailAvailable(result.available);
      } catch (error) {
        console.error('Error checking email:', error);
        setEmailAvailable(null);
      } finally {
        setIsCheckingEmail(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [email]);

  const onSubmit = async (data: SignupFormData) => {
    if (usernameAvailable === false || emailAvailable === false) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await authAPI.signup(data);

      sessionStorage.setItem('verification_email', data.email.toLowerCase());

      showSuccessToast(response.message || 'Account created! Check your email for verification code.');
      navigate('/verify-email');
    } catch (error) {
      showErrorToast(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <StickerCard rotate="right" className="auth-container">
      <div className="auth-header">
        <h2>Join the Club</h2>
        <p>Claim your unique feedback link.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Input
          label="Username"
          type="text"
          placeholder="e.g. yourname"
          error={errors.username?.message}
          {...register('username')}
        />
        {isCheckingUsername && (
          <p style={{ color: '#666', fontSize: '0.875rem', marginTop: '-0.5rem' }}>
            Checking availability...
          </p>
        )}
        {!isCheckingUsername && usernameAvailable === false && (
          <p style={{ color: '#FF8B66', fontSize: '0.875rem', marginTop: '-0.5rem' }}>
            Username is already taken
          </p>
        )}
        {!isCheckingUsername && usernameAvailable === true && (
          <p style={{ color: '#4611CD', fontSize: '0.875rem', marginTop: '-0.5rem' }}>
            Username is available ✓
          </p>
        )}

        <Input
          label="Email Address"
          type="email"
          placeholder="you@example.com"
          error={errors.email?.message}
          {...register('email')}
        />
        {isCheckingEmail && (
          <p style={{ color: '#666', fontSize: '0.875rem', marginTop: '-0.5rem' }}>
            Checking availability...
          </p>
        )}
        {!isCheckingEmail && emailAvailable === false && (
          <p style={{ color: '#FF8B66', fontSize: '0.875rem', marginTop: '-0.5rem' }}>
            Email is already registered
          </p>
        )}
        {!isCheckingEmail && emailAvailable === true && (
          <p style={{ color: '#4611CD', fontSize: '0.875rem', marginTop: '-0.5rem' }}>
            Email is available ✓
          </p>
        )}

        <Input
          label="Password"
          type="password"
          placeholder="••••••••"
          error={errors.password?.message}
          {...register('password')}
        />

        <button
          type="submit"
          className="btn btn-ticket"
          style={{ width: '100%', marginTop: '1rem' }}
          disabled={
            isLoading ||
            isCheckingUsername ||
            isCheckingEmail ||
            usernameAvailable === false ||
            emailAvailable === false
          }
        >
          {isLoading ? 'Creating Account...' : 'Create Account'}
        </button>
      </form>

      <div className="toggle-auth">
        Already have an account? <Link to="/login">Log in here</Link>
      </div>
    </StickerCard>
  );
}
