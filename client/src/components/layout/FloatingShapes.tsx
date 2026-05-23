import type { CSSProperties } from 'react';

export default function FloatingShapes() {
  return (
    <>
      <div className="floater" style={{ top: '20%', left: '10%', '--r': '-10deg' } as CSSProperties}>
        <div className="shape-star"></div>
      </div>
      <div className="floater" style={{ bottom: '20%', right: '10%', '--r': '10deg' } as CSSProperties}>
        <div className="shape-circle"></div>
      </div>
      <div className="floater" style={{ top: '15%', right: '25%', '--r': '5deg' } as CSSProperties}>
        <div style={{ width: '50px', height: '80px', background: 'var(--accent-lilac)', borderRadius: '40px' }}></div>
      </div>
    </>
  );
}
