import React, { useState } from 'react';
import type { PostData } from './InfiniteCanvas';

interface PaintingCardProps {
  post: PostData & { x: number; y: number; size: 'small' | 'medium' | 'large' };
  basePath: string;
  lang: string;
  onClick: () => void;
}

// img = frame - 2*padding(5) = frame - 10; imgH = img * 0.75
const SIZE_MAP = {
  small:  { frame: 150, img: 140, imgH: 105 },
  medium: { frame: 180, img: 170, imgH: 128 },
  large:  { frame: 216, img: 206, imgH: 155 },
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
        transform: `translate(-50%, -50%) scale(${hovered ? 1.03 : 1})`,
        transition: 'transform 0.3s cubic-bezier(0.25, 1, 0.5, 1), box-shadow 0.3s ease',
        cursor: 'pointer',
        zIndex: hovered ? 10 : 1,
      }}
    >
      {/* Simple modern black frame */}
      <div style={{
        width: `${frame}px`,
        padding: '5px',
        background: '#1a1a1a',
        boxShadow: hovered
          ? '0 8px 24px rgba(0,0,0,0.15), 0 2px 8px rgba(0,0,0,0.1)'
          : '0 4px 12px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.06)',
      }}>
        {/* Image */}
        <div style={{
          overflow: 'hidden',
          lineHeight: 0,
          background: '#f0ede8',
        }}>
          <img
            src={imgUrl}
            alt={`${post.painting_title} — ${post.painting_artist}`}
            loading="lazy"
            style={{
              width: '100%',
              height: `${imgH}px`,
              objectFit: 'cover',
              objectPosition: 'center 40%',
              display: 'block',
              opacity: hovered ? 1 : 0.92,
              transition: 'opacity 0.3s ease',
            }}
          />
        </div>
      </div>

      {/* Hover label */}
      <div style={{
        paddingTop: '10px',
        opacity: hovered ? 1 : 0,
        transform: `translateY(${hovered ? '0' : '4px'})`,
        transition: 'opacity 0.2s ease, transform 0.2s cubic-bezier(0.25, 1, 0.5, 1)',
        pointerEvents: 'none',
      }}>
        <div className="flex items-center gap-2" style={{ marginBottom: '3px' }}>
          <span style={{
            fontSize: '10px',
            letterSpacing: '0.15em',
            color: 'var(--color-accent, #c44)',
            fontWeight: 500,
            whiteSpace: 'nowrap',
          }}>
            {post.series ? post.series.toUpperCase() : post.date}
          </span>
          <span style={{
            flex: 1,
            height: '1px',
            background: 'var(--color-accent, #c44)',
            opacity: 0.3,
            minWidth: '12px',
          }} />
        </div>
        <p style={{
          fontSize: '12px',
          color: '#2a2a2a',
          fontWeight: 500,
          margin: 0,
          lineHeight: 1.35,
          maxWidth: `${frame}px`,
        }}>
          {title}
        </p>
      </div>
    </div>
  );
}
