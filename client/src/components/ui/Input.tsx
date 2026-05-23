import { forwardRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, ...props }, ref) => {
    return (
      <div className="input-group">
        <label>{label}</label>
        <input ref={ref} {...props} style={error ? { borderColor: '#FF8B66' } : undefined} />
        {error && (
          <span style={{ color: '#FF8B66', fontSize: '0.875rem', marginTop: '0.25rem', display: 'block' }}>
            {error}
          </span>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
