import { forwardRef } from 'react';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, ...props }, ref) => {
    return (
      <div className="input-group">
        {label && <label>{label}</label>}
        <textarea ref={ref} {...props} style={error ? { borderColor: '#FF8B66' } : undefined} />
        {error && (
          <span style={{ color: '#FF8B66', fontSize: '0.875rem', marginTop: '0.25rem', display: 'block' }}>
            {error}
          </span>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

export default Textarea;
