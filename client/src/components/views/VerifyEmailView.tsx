import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import StickerCard from '../ui/StickerCard';
import { authAPI } from '../../services/api';
import { showErrorToast, showSuccessToast } from '../../utils/errorHandler';
import { sessionStorage } from '../../utils/storage';

export default function VerifyEmailView() {
  const navigate = useNavigate();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    const storedEmail = sessionStorage.getItem('verification_email');
    if (!storedEmail) {
      showErrorToast(new Error('No email found. Please sign up again.'));
      navigate('/signup');
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

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) return;
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();

    if (/^\d{6}$/.test(pastedData)) {
      const newOtp = pastedData.split('');
      setOtp(newOtp);
      const lastInput = document.getElementById('otp-5');
      lastInput?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpCode = otp.join('');

    if (otpCode.length !== 6) {
      showErrorToast(new Error('Please enter all 6 digits'));
      return;
    }

    setIsLoading(true);

    try {
      const response = await authAPI.verifyEmail({
        email,
        otp: otpCode,
      });

      showSuccessToast(response.message || 'Email verified successfully!');

      sessionStorage.removeItem('verification_email');

      setTimeout(() => navigate('/login'), 1000);
    } catch (error) {
      showErrorToast(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCountdown > 0 || isResending) return;

    setIsResending(true);

    try {
      const response = await authAPI.resendVerification({ email });
      showSuccessToast(response.message || 'Verification code resent!');
      setResendCountdown(60);
      setOtp(['', '', '', '', '', '']);

      const firstInput = document.getElementById('otp-0');
      firstInput?.focus();
    } catch (error) {
      showErrorToast(error);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <StickerCard rotate="right" className="auth-container" style={{ maxWidth: '480px' }}>
      <div className="auth-header">
        <h2>Verify Your Email</h2>
        <p className="subtitle">
          We sent a 6-digit code to <strong>{email}</strong>.<br />
          Enter it below to verify your account.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="otp-container" onPaste={handlePaste}>
          {otp.map((digit, index) => (
            <input
              key={index}
              id={`otp-${index}`}
              type="text"
              inputMode="numeric"
              pattern="[0-9]"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              className="otp-input"
              disabled={isLoading}
              autoFocus={index === 0}
            />
          ))}
        </div>

        <button
          type="submit"
          className="btn btn-ticket"
          style={{ width: '100%', marginTop: '2rem' }}
          disabled={isLoading || otp.join('').length !== 6}
        >
          {isLoading ? 'Verifying...' : 'Verify & Continue'}
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
        <Link to="/signup" style={{ color: 'inherit' }}>
          ← Back to signup
        </Link>
      </div>
    </StickerCard>
  );
}
