import React, { useState } from 'react';
import type { PostData } from './InfiniteCanvas';

interface PaintingCardProps {
  post: PostData & { x: number; y: number; size: 'small' | 'medium' | 'large' };
  basePath: string;
  lang: string;
  onClick: () => void;
}

const SIZE_MAP = {
  small:  { frame: 164, img: 140, imgH: 105 },
  medium: { frame: 199, img: 175, imgH: 131 },
  large:  { frame: 234, img: 210, imgH: 158 },
};

export default function PaintingCard({ post, basePath, lang, onClick }: PaintingCardProps) {
  const [hovered, setHovered] = useState(false);
  const { frame, img, imgH } = SIZE_MAP[post.size];
  const imgUrl = `${basePath}/paintings/${post.painting_id}.jpg`;
  const title = lang === 'en' && post.title_en ? post.title_en : post.title;

  return (
    <div
      data-card="true"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'absolute',
        left: `${post.x}px`,
        top: `${post.y}px`,
        transform: `translate(-50%, -50%) scale(${hovered ? 1.04 : 1})`,
        transition: 'transform 0.25s ease, box-shadow 0.25s ease',
        cursor: 'pointer',
        zIndex: hovered ? 10 : 1,
      }}
    >
      {/* Outer ornate frame */}
      <div style={{
        width: `${frame}px`,
        padding: '11px',
        background: 'linear-gradient(145deg, #b8952a 0%, #f0d878 18%, #c8a040 35%, #8b6914 50%, #d4a843 65%, #f0d878 82%, #b8952a 100%)',
        boxShadow: hovered
          ? 'inset 0 2px 4px rgba(255,240,180,0.6), inset 0 -2px 4px rgba(0,0,0,0.5), inset 2px 0 4px rgba(255,240,180,0.3), inset -2px 0 4px rgba(0,0,0,0.5), 0 0 0 1px #2a1800, 0 8px 16px rgba(0,0,0,0.7), 0 20px 50px rgba(212,175,135,0.15), 0 24px 60px rgba(0,0,0,0.5)'
          : 'inset 0 2px 4px rgba(255,240,180,0.6), inset 0 -2px 4px rgba(0,0,0,0.5), inset 2px 0 4px rgba(255,240,180,0.3), inset -2px 0 4px rgba(0,0,0,0.5), 0 0 0 1px #2a1800, 0 6px 12px rgba(0,0,0,0.6), 0 12px 30px rgba(0,0,0,0.4)',
        position: 'relative',
      }}>
        {/* Inner liner */}
        <div style={{
          border: '1px solid rgba(200,160,50,0.4)',
          boxShadow: 'inset 0 0 8px rgba(0,0,0,0.6)',
          overflow: 'hidden',
          lineHeight: 0,
        }}>
          <img
            src={imgUrl}
            alt={`${post.painting_title} — ${post.painting_artist}`}
            width={img}
            height={imgH}
            loading="lazy"
            style={{
              width: `${img}px`,
              height: `${imgH}px`,
              objectFit: 'cover',
              objectPosition: 'center 40%',
              display: 'block',
              filter: hovered ? 'brightness(1.05)' : 'brightness(0.92)',
              transition: 'filter 0.25s ease',
            }}
          />
        </div>

        {/* Corner ornaments (pure CSS dots) */}
        {[
          { top: '4px', left: '4px' },
          { top: '4px', right: '4px' },
          { bottom: '4px', left: '4px' },
          { bottom: '4px', right: '4px' },
        ].map((pos, i) => (
          <div key={i} style={{
            position: 'absolute',
            width: '4px',
            height: '4px',
            borderRadius: '50%',
            background: 'rgba(255,240,160,0.7)',
            ...pos,
          }} />
        ))}
      </div>

      {/* Hover label */}
      <div style={{
        position: 'absolute',
        bottom: '-2px',
        left: '50%',
        transform: `translateX(-50%) translateY(${hovered ? '0' : '4px'})`,
        opacity: hovered ? 1 : 0,
        transition: 'opacity 0.2s ease, transform 0.2s ease',
        background: 'rgba(10, 9, 7, 0.9)',
        border: '1px solid rgba(212, 175, 135, 0.2)',
        borderRadius: '4px',
        padding: '5px 10px',
        whiteSpace: 'nowrap',
        pointerEvents: 'none',
        backdropFilter: 'blur(8px)',
        zIndex: 20,
      }}>
        <div style={{ color: '#e8dcc8', fontSize: '0.72rem', letterSpacing: '0.02em', marginBottom: '2px' }}>
          {title}
        </div>
        <div style={{ color: '#7a6a58', fontSize: '0.62rem', letterSpacing: '0.05em' }}>
          {post.date}
        </div>
      </div>
    </div>
  );
}
