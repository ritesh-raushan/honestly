import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import StickerCard from '../ui/StickerCard';
import Input from '../ui/Input';
import { changePasswordSchema, type ChangePasswordFormData } from '../../schemas/validation';
import { authAPI } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';
import { showErrorToast, showSuccessToast } from '../../utils/errorHandler';

export default function SettingsView() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
  });

  const onChangePassword = async (data: ChangePasswordFormData) => {
    try {
      setIsChangingPassword(true);
      const response = await authAPI.changePassword({
        current_password: data.current_password,
        new_password: data.new_password,
      });
      showSuccessToast(response.message || 'Password changed successfully');
      reset();
    } catch (error) {
      showErrorToast(error);
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      'This will permanently delete your account and all messages. This cannot be undone.\n\nAre you sure?'
    );

    if (!confirmed) {
      return;
    }

    const typedUsername = window.prompt(
      `Type your username "${user?.username}" to confirm deletion:`
    );

    if (typedUsername?.toLowerCase() !== user?.username.toLowerCase()) {
      showErrorToast('Username did not match. Account was not deleted.');
      return;
    }

    try {
      setIsDeletingAccount(true);
      await authAPI.deleteAccount();
      await logout();
      showSuccessToast('Account deleted successfully');
      navigate('/');
    } catch (error) {
      showErrorToast(error);
    } finally {
      setIsDeletingAccount(false);
    }
  };

  return (
    <div style={{ width: '100%', maxWidth: '480px' }}>
      <StickerCard rotate="right" className="auth-container" style={{ marginBottom: '2rem' }}>
        <div className="auth-header">
          <h2>Change Password</h2>
          <p className="subtitle">Update your login credentials.</p>
        </div>

        <form onSubmit={handleSubmit(onChangePassword)}>
          <Input
            label="Current Password"
            type="password"
            placeholder="••••••••"
            error={errors.current_password?.message}
            {...register('current_password')}
          />

          <Input
            label="New Password"
            type="password"
            placeholder="••••••••"
            error={errors.new_password?.message}
            {...register('new_password')}
          />

          <Input
            label="Confirm New Password"
            type="password"
            placeholder="••••••••"
            error={errors.confirm_password?.message}
            {...register('confirm_password')}
          />

          <button
            type="submit"
            className="btn btn-ticket"
            style={{ width: '100%', marginTop: '0.5rem' }}
            disabled={isChangingPassword}
          >
            {isChangingPassword ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </StickerCard>

      <StickerCard
        rotate="left"
        className="auth-container"
        style={{ border: '2px solid #ff4444' }}
      >
        <div className="auth-header">
          <h2 style={{ color: '#ff4444' }}>Danger Zone</h2>
          <p className="subtitle">
            Permanently delete your account and all received messages.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-ticket"
          onClick={handleDeleteAccount}
          disabled={isDeletingAccount}
          style={{
            width: '100%',
            backgroundColor: '#ff4444',
            boxShadow: '0 10px 20px rgba(255, 68, 68, 0.3)',
          }}
        >
          {isDeletingAccount ? 'Deleting...' : 'Delete Account'}
        </button>
      </StickerCard>

      <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.9rem', opacity: 0.6 }}>
        <Link to="/dashboard" style={{ color: 'inherit' }}>
          ← Back to dashboard
        </Link>
      </div>
    </div>
  );
}
