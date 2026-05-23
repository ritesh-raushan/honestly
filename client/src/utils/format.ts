import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns';

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  
  if (isToday(date)) {
    return `Today ${format(date, 'h:mm a')}`;
  }
  
  if (isYesterday(date)) {
    return 'Yesterday';
  }
  
  // For dates within the current year, show month and day
  if (date.getFullYear() === new Date().getFullYear()) {
    return format(date, 'MMM d');
  }
  
  // For older dates, show full date
  return format(date, 'MMM d, yyyy');
};

export const formatRelativeTime = (dateString: string): string => {
  return formatDistanceToNow(new Date(dateString), { addSuffix: true });
};

export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      try {
        const successful = document.execCommand('copy');
        textArea.remove();
        return successful;
      } catch (err) {
        console.error('Fallback: Could not copy text', err);
        textArea.remove();
        return false;
      }
    }
  } catch (err) {
    console.error('Failed to copy text:', err);
    return false;
  }
};

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
};
