import { useEffect, useState } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { messageAPI, userAPI } from '../../services/api';
import { showErrorToast, showSuccessToast } from '../../utils/errorHandler';
import { formatDate, copyToClipboard } from '../../utils/format';
import type { Message } from '../../types';

const PAGE_SIZE = 20;

export default function DashboardView() {
  const user = useAuthStore((state) => state.user);
  const updateUser = useAuthStore((state) => state.updateUser);
  const [messages, setMessages] = useState<Message[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isAcceptingMessages, setIsAcceptingMessages] = useState(true);
  const [isToggling, setIsToggling] = useState(false);

  const feedbackUrl = user ? `${window.location.origin}/u/${user.username}` : '';

  useEffect(() => {
    const loadInitial = async () => {
      try {
        setIsLoading(true);
        const page = await messageAPI.getMessages(PAGE_SIZE, 0);
        setMessages(page.items);
        setTotal(page.total);
      } catch (error) {
        showErrorToast(error);
      } finally {
        setIsLoading(false);
      }
    };

    loadInitial();
  }, []);

  const handleLoadMore = async () => {
    try {
      setIsLoadingMore(true);
      const page = await messageAPI.getMessages(PAGE_SIZE, messages.length);
      setMessages((prev) => [...prev, ...page.items]);
      setTotal(page.total);
    } catch (error) {
      showErrorToast(error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  useEffect(() => {
    if (user) {
      setIsAcceptingMessages(user.is_accepting_messages);
    }
  }, [user]);

  const handleCopyLink = async () => {
    const success = await copyToClipboard(feedbackUrl);
    if (success) {
      showSuccessToast('Link copied to clipboard!');
    } else {
      showErrorToast('Failed to copy link. Please try again.');
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!window.confirm('Are you sure you want to delete this message?')) {
      return;
    }

    try {
      await messageAPI.deleteMessage(messageId);
      setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
      setTotal((prev) => Math.max(0, prev - 1));
      showSuccessToast('Message deleted successfully');
    } catch (error) {
      showErrorToast(error);
    }
  };

  const handleToggleMessages = async () => {
    try {
      setIsToggling(true);
      const response = await userAPI.toggleMessages();
      setIsAcceptingMessages(response.is_accepting_messages);
      updateUser({ is_accepting_messages: response.is_accepting_messages });
      showSuccessToast(
        response.is_accepting_messages
          ? 'You are now accepting messages'
          : 'You are no longer accepting messages'
      );
    } catch (error) {
      showErrorToast(error);
    } finally {
      setIsToggling(false);
    }
  };

  const hasMore = messages.length < total;

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div className="dashboard-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div
            className="avatar-circle"
            style={{
              width: '80px',
              height: '80px',
              fontSize: '2rem',
              flexShrink: 0,
            }}
          >
            {user?.username[0]?.toUpperCase()}
          </div>
          <div>
            <h2 style={{ fontSize: '2.5rem', marginBottom: '0.25rem' }}>
              Hello, <span className="text-purple">{user?.username}</span>
            </h2>
            <p style={{ margin: 0 }}>Here is the truth you asked for.</p>
          </div>
        </div>
        <div className="link-box">
          <span>{feedbackUrl}</span>
          <button
            className="btn-ticket"
            style={{ padding: '8px 16px', fontSize: '0.8rem' }}
            onClick={handleCopyLink}
          >
            COPY
          </button>
        </div>
      </div>

      <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
        <button
          className="btn btn-ticket"
          onClick={handleToggleMessages}
          disabled={isToggling}
          style={{
            backgroundColor: isAcceptingMessages ? '#4611CD' : '#999',
          }}
        >
          {isToggling
            ? 'Updating...'
            : isAcceptingMessages
              ? 'Accepting Messages'
              : 'Not Accepting Messages'}
        </button>
      </div>

      {isLoading ? (
        <div className="feed-grid">
          {[1, 2, 3].map((i) => (
            <div key={i} className="message-sticker" style={{ opacity: 0.5 }}>
              <div className="msg-body">Loading messages...</div>
            </div>
          ))}
        </div>
      ) : messages.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#666' }}>
          <p style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>No messages yet</p>
          <p>Share your link to start receiving anonymous feedback!</p>
        </div>
      ) : (
        <>
          <div className="feed-grid">
            {messages.map((message) => (
              <div key={message.id} className="message-sticker">
                <div className="msg-body">"{message.content}"</div>
                <div
                  className="msg-date"
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <span>{formatDate(message.created_at)}</span>
                  <button
                    onClick={() => handleDeleteMessage(message.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#ff4444',
                      cursor: 'pointer',
                      padding: '0.25rem 0.5rem',
                      fontSize: '0.9rem',
                      fontWeight: 'bold',
                    }}
                    title="Delete message"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>

          {hasMore && (
            <button
              className="btn btn-ghost"
              onClick={handleLoadMore}
              disabled={isLoadingMore}
              style={{
                marginTop: '2rem',
                border: '2px solid var(--ink-black)',
              }}
            >
              {isLoadingMore ? 'Loading...' : 'Load More'}
            </button>
          )}
        </>
      )}
    </div>
  );
}
