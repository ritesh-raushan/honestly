import { useNavigate, useParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import StickerCard from '../ui/StickerCard';
import Textarea from '../ui/Textarea';
import Input from '../ui/Input';
import { messageSchema, type MessageFormData } from '../../schemas/validation';
import { messageAPI, userAPI } from '../../services/api';
import { showErrorToast, showSuccessToast } from '../../utils/errorHandler';
import type { UserStatus } from '../../types';

export default function WriteView() {
  const navigate = useNavigate();
  const { username } = useParams<{ username: string }>();
  const [userStatus, setUserStatus] = useState<UserStatus | null>(null);
  const [isLoading, setIsLoading] = useState(!!username);
  const [isSending, setIsSending] = useState(false);
  const [lookupUsername, setLookupUsername] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset,
  } = useForm<MessageFormData>({
    resolver: zodResolver(messageSchema),
  });

  const messageContent = watch('content', '');
  const charCount = messageContent?.length || 0;
  const maxChars = 1000;

  const fetchUserStatus = useCallback(async () => {
    if (!username) {
      return;
    }

    try {
      setIsLoading(true);
      const status = await userAPI.getUserStatus(username);

      if (!status.exists) {
        showErrorToast('User not found');
        navigate('/');
        return;
      }

      setUserStatus(status);
    } catch (error) {
      showErrorToast(error);
      navigate('/');
    } finally {
      setIsLoading(false);
    }
  }, [username, navigate]);

  useEffect(() => {
    fetchUserStatus();
  }, [fetchUserStatus]);

  const handleLookupSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = lookupUsername.trim().toLowerCase();

    if (!trimmed) {
      showErrorToast('Please enter a username');
      return;
    }

    navigate(`/u/${encodeURIComponent(trimmed)}`);
  };

  const onSubmit = async (data: MessageFormData) => {
    if (!username || !userStatus?.is_accepting_messages) {
      return;
    }

    try {
      setIsSending(true);
      await messageAPI.sendMessage(username, { content: data.content });
      showSuccessToast('Message sent anonymously!');
      reset();
      setTimeout(() => navigate('/'), 1500);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 403) {
        showErrorToast('This user is not accepting messages right now');
        await fetchUserStatus();
      } else {
        showErrorToast(error);
      }
    } finally {
      setIsSending(false);
    }
  };

  // /write with no username — prompt for who to send feedback to
  if (!username) {
    return (
      <StickerCard
        className="auth-container"
        style={{ maxWidth: '500px', transform: 'rotate(-1deg)' }}
      >
        <div className="auth-header">
          <h2>Write feedback.</h2>
          <p>Enter the username of the person you want to message.</p>
        </div>

        <form onSubmit={handleLookupSubmit}>
          <Input
            label="Username"
            placeholder="e.g. jane_doe"
            value={lookupUsername}
            onChange={(event) => setLookupUsername(event.target.value)}
            autoComplete="off"
          />
          <button type="submit" className="btn btn-ticket" style={{ width: '100%' }}>
            Continue
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.9rem' }}>
          <Link to="/signup" className="text-purple" style={{ fontWeight: 'bold' }}>
            Get your own anonymous feedback link →
          </Link>
        </div>
      </StickerCard>
    );
  }

  if (isLoading) {
    return (
      <StickerCard
        className="auth-container"
        style={{ maxWidth: '500px', transform: 'rotate(-1deg)' }}
      >
        <div className="public-profile">
          <div className="avatar-circle">...</div>
          <h2>Loading...</h2>
        </div>
      </StickerCard>
    );
  }

  if (!userStatus?.is_accepting_messages) {
    return (
      <StickerCard
        className="auth-container"
        style={{ maxWidth: '500px', transform: 'rotate(-1deg)' }}
      >
        <div className="public-profile">
          <div className="avatar-circle">{username[0]?.toUpperCase() || 'U'}</div>
          <h2>
            <span className="text-purple">@{username}</span>
          </h2>
          <p style={{ color: '#ff4444', fontWeight: 'bold' }}>
            This user is not accepting messages at the moment.
          </p>
        </div>

        <div style={{ textAlign: 'center', marginTop: '2rem', fontSize: '0.9rem' }}>
          <Link to="/signup" className="text-purple" style={{ fontWeight: 'bold' }}>
            Get your own anonymous feedback link →
          </Link>
        </div>
      </StickerCard>
    );
  }

  return (
    <StickerCard
      className="auth-container"
      style={{ maxWidth: '500px', transform: 'rotate(-1deg)' }}
    >
      <div className="public-profile">
        <div className="avatar-circle">{username[0]?.toUpperCase() || 'U'}</div>
        <h2>
          Send message to <span className="text-purple">@{username}</span>
        </h2>
        <p>It's 100% anonymous. Be honest.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div style={{ position: 'relative' }}>
          <Textarea
            rows={6}
            placeholder="Type your message here..."
            error={errors.content?.message}
            {...register('content')}
          />
          <div
            style={{
              textAlign: 'right',
              fontSize: '0.75rem',
              marginTop: '0.25rem',
              color: charCount > maxChars ? '#ff4444' : '#666'
            }}
          >
            {charCount}/{maxChars}
          </div>
        </div>

        <button
          type="submit"
          className="btn btn-ticket"
          style={{ width: '100%', marginTop: '0.5rem' }}
          disabled={isSending || charCount === 0 || charCount > maxChars}
        >
          {isSending ? 'Sending...' : 'Send Anonymously'}
        </button>
      </form>

      <div style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.8rem', opacity: 0.6 }}>
        <Link to="/signup" style={{ color: 'inherit' }}>
          Get your own link
        </Link>
      </div>
    </StickerCard>
  );
}
