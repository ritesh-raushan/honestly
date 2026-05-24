import { Link } from 'react-router-dom';
import StickerCard from '../ui/StickerCard';
import { useAuthStore } from '../../stores/authStore';

export default function LandingView() {
  const { isAuthenticated } = useAuthStore();

  return (
    <>
      <div className="hero-content">
        <h1 className="hero-title">
          What do they<br />
          <span className="ticket-wrapper">really</span> think?
        </h1>
        <p className="hero-tagline">
          Join the club. Get your personal link. Receive anonymous feedback from friends, enemies, and everyone in between.
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '2rem' }}>
          {isAuthenticated ? (
            <Link to="/dashboard" className="btn btn-ticket">
              Go to Dashboard
            </Link>
          ) : (
            <Link to="/signup" className="btn btn-ticket">
              Create Your Link
            </Link>
          )}
          <Link
            to="/write"
            className="btn btn-ghost"
            style={{ border: '2px solid var(--ink-black)' }}
          >
            Write Feedback
          </Link>
        </div>
      </div>

      {/* Demo Sticker Cards */}
      <StickerCard
        rotate="left"
        style={{ position: 'absolute', bottom: '10%', left: '15%', width: '200px', padding: '1rem' }}
      >
        <div style={{ fontSize: '0.8rem', color: '#888', marginBottom: '0.5rem' }}>RECEIVED 2M AGO</div>
        <div style={{ fontWeight: 700, lineHeight: 1.3 }}>"You have the best playlist energy."</div>
      </StickerCard>

      <StickerCard
        rotate="right"
        style={{
          position: 'absolute',
          top: '30%',
          right: '10%',
          width: '220px',
          padding: '1rem',
          background: 'var(--primary-purple)',
          color: 'white'
        }}
      >
        <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', marginBottom: '0.5rem' }}>
          RECEIVED 5M AGO
        </div>
        <div style={{ fontWeight: 700, lineHeight: 1.3 }}>
          "Please stop microwaving fish at work."
        </div>
      </StickerCard>
    </>
  );
}
