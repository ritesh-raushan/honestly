import { Toaster as SonnerToaster } from 'sonner';

export default function Toaster() {
  return (
    <SonnerToaster
      position="bottom-right"
      toastOptions={{
        style: {
          background: '#fff',
          color: '#1a1a1a',
          border: '2px solid #4611CD',
          padding: '16px',
          borderRadius: '12px',
          fontFamily: '"DM Sans", sans-serif',
        },
        className: 'honestly-toast',
      }}
      richColors
    />
  );
}
