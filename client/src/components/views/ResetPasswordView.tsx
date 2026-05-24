import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import StickerCard from '../ui/StickerCard';
import Input from '../ui/Input';
import { resetPasswordFieldsSchema, type ResetPasswordFieldsFormData } from '../../schemas/validation';
import { authAPI } from '../../services/api';
import { showErrorToast, showSuccessToast } from '../../utils/errorHandler';
import { sessionStorage } from '../../utils/storage';

export default function ResetPasswordView() {
  const navigate = useNavigate();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);
  const [isResending, setIsResending] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFieldsFormData>({
    resolver: zodResolver(resetPasswordFieldsSchema),
  });

  useEffect(() => {
    const storedEmail = sessionStorage.getItem('reset_password_email');
    if (!storedEmail) {
      showErrorToast(new Error('No email found. Please request a reset code first.'));
      navigate('/forgot-password');
      return;
    }
    setEmail(storedEmail);
  }, [navigate]);

  useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(() => setResendCountdown(resendCountdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCountdown]);

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return;
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      document.getElementById(`reset-otp-${index + 1}`)?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      document.getElementById(`reset-otp-${index - 1}`)?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();

    if (/^\d{6}$/.test(pastedData)) {
      setOtp(pastedData.split(''));
      document.getElementById('reset-otp-5')?.focus();
    }
  };

  const handleResend = async () => {
    if (resendCountdown > 0 || isResending || !email) return;

    setIsResending(true);

    try {
      const response = await authAPI.forgotPassword({ email });
      showSuccessToast(response.message || 'Reset code resent!');
      setResendCountdown(60);
      setOtp(['', '', '', '', '', '']);
      document.getElementById('reset-otp-0')?.focus();
    } catch (error) {
      showErrorToast(error);
    } finally {
      setIsResending(false);
    }
  };

  const onSubmit = async (data: ResetPasswordFieldsFormData) => {
    const otpCode = otp.join('');

    if (otpCode.length !== 6 || !/^\d{6}$/.test(otpCode)) {
      showErrorToast(new Error('Please enter all 6 digits'));
      return;
    }

    setIsLoading(true);

    try {
      await authAPI.verifyResetOTP({ email, otp: otpCode });
      await authAPI.resetPassword({ email, new_password: data.new_password });

      sessionStorage.removeItem('reset_password_email');

      showSuccessToast('Password reset successfully! You can now log in.');
      setTimeout(() => navigate('/login'), 1000);
    } catch (error) {
      showErrorToast(error);
    } finally {
      setIsLoading(false);
    }
  };

  const otpCode = otp.join('');

  return (
    <StickerCard rotate="right" className="auth-container" style={{ maxWidth: '480px' }}>
      <div className="auth-header">
        <h2>Reset Password</h2>
        <p className="subtitle">
          Enter the 6-digit code sent to <strong>{email}</strong> and choose a new password.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="otp-container" onPaste={handleOtpPaste}>
          {otp.map((digit, index) => (
            <input
              key={index}
              id={`reset-otp-${index}`}
              type="text"
              inputMode="numeric"
              pattern="[0-9]"
              maxLength={1}
              value={digit}
              onChange={(e) => handleOtpChange(index, e.target.value)}
              onKeyDown={(e) => handleOtpKeyDown(index, e)}
              className="otp-input"
              disabled={isLoading}
              autoFocus={index === 0}
            />
          ))}
        </div>

        <Input
          label="New Password"
          type="password"
          placeholder="••••••••"
          error={errors.new_password?.message}
          {...register('new_password')}
        />

        <Input
          label="Confirm Password"
          type="password"
          placeholder="••••••••"
          error={errors.confirm_password?.message}
          {...register('confirm_password')}
        />

        <button
          type="submit"
          className="btn btn-ticket"
          style={{ width: '100%', marginTop: '1rem' }}
          disabled={isLoading || otpCode.length !== 6}
        >
          {isLoading ? 'Resetting...' : 'Reset Password'}
        </button>
      </form>

      <div className="toggle-auth">
        Didn't receive the code?{' '}
        <button
          type="button"
          onClick={handleResend}
          disabled={resendCountdown > 0 || isResending}
          style={{
            background: 'none',
            border: 'none',
            padding: 0,
            color: 'var(--primary-purple)',
            fontWeight: 700,
            textDecoration: 'underline',
            cursor: resendCountdown > 0 || isResending ? 'not-allowed' : 'pointer',
            opacity: resendCountdown > 0 || isResending ? 0.5 : 1,
            fontFamily: 'inherit',
            fontSize: 'inherit',
          }}
        >
          {isResending ? 'Sending...' : resendCountdown > 0 ? `Resend (${resendCountdown}s)` : 'Resend'}
        </button>
      </div>

      <div style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.9rem', opacity: 0.6 }}>
        <Link to="/login" style={{ color: 'inherit' }}>
          ← Back to login
        </Link>
      </div>
    </StickerCard>
  );
}
