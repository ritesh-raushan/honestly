interface StickerCardProps {
  children: React.ReactNode;
  rotate?: 'left' | 'right' | 'none';
  className?: string;
  style?: React.CSSProperties;
}

export default function StickerCard({ children, rotate = 'none', className = '', style }: StickerCardProps) {
  const rotateClass = rotate === 'left' ? 'sticker-rotate-left' : rotate === 'right' ? 'sticker-rotate-right' : '';
  
  return (
    <div className={`sticker-card ${rotateClass} ${className}`.trim()} style={style}>
      {children}
    </div>
  );
}
