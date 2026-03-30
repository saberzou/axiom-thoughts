import React, { memo, useRef, useCallback } from 'react';
import type { PostData } from './InfiniteCanvas';
import { PAINTING_HEIGHTS } from '../data/paintingHeights';

interface PaintingCardProps {
  post: PostData & { x: number; y: number; cardWidth: number };
  basePath: string;
  lang: string;
  onClick: () => void;
}

const FRAME_PAD = 5;
const MAT_PAD = 12;
const SRC_WIDTH = 800;

// Pure CSS hover — no React state, no re-renders
const PaintingCard = memo(function PaintingCard({ post, basePath, lang, onClick }: PaintingCardProps) {
  const imgUrl = `${basePath}/paintings/${post.painting_id}.jpg`;
  const title = lang === 'en' && post.title_en ? post.title_en : post.title;

  const frameW = post.cardWidth;
  const imgW = frameW - FRAME_PAD * 2 - MAT_PAD * 2;
  const srcH = PAINTING_HEIGHTS[post.painting_id] || 600;
  const imgH = Math.round(imgW * (srcH / SRC_WIDTH));

  return (
    <div
      className="canvas-card"
      data-card="true"
      data-post-id={post.id}
      onClick={onClick}
      style={{
        position: 'absolute',
        left: `${post.x}px`,
        top: `${post.y}px`,
        transform: 'translate(-50%, -50%)',
        cursor: 'pointer',
        zIndex: 1,
      }}
    >
      {/* Dark frame */}
      <div style={{
        width: `${frameW}px`,
        padding: `${FRAME_PAD}px`,
        background: '#1a1a1a',
        boxShadow: '0 4px 12px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.06)',
      }}>
        {/* White mat */}
        <div style={{
          padding: `${MAT_PAD}px`,
          background: '#faf9f6',
          boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.04)',
        }}>
          {/* Image + glass glare */}
          <div style={{
            position: 'relative',
            overflow: 'hidden',
            lineHeight: 0,
            background: '#f0ede8',
          }}>
            <img
              src={imgUrl}
              alt={`${post.painting_title} — ${post.painting_artist}`}
              loading="lazy"
              decoding="async"
              draggable={false}
              style={{
                width: '100%',
                height: `${imgH}px`,
                objectFit: 'cover',
                display: 'block',
                opacity: 0.92,
              }}
            />
            {/* Glass glare — static, no blend mode change */}
            <div style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(135deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.06) 25%, transparent 50%, rgba(255,255,255,0.03) 75%, rgba(255,255,255,0.12) 100%)',
              pointerEvents: 'none',
              mixBlendMode: 'screen',
            }} />
            <div style={{
              position: 'absolute',
              inset: 0,
              boxShadow: 'inset 1px 1px 3px rgba(255,255,255,0.15), inset -1px -1px 2px rgba(0,0,0,0.05)',
              pointerEvents: 'none',
            }} />
          </div>
        </div>
      </div>

      {/* Hover label — CSS-driven visibility */}
      <div className="canvas-card-label" style={{
        paddingTop: '10px',
        opacity: 0,
        transform: 'translateY(4px)',
        pointerEvents: 'none',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
          <span style={{
            fontSize: '10px', letterSpacing: '0.15em',
            color: 'var(--color-accent, #c44)', fontWeight: 500, whiteSpace: 'nowrap',
          }}>
            {post.series ? post.series.toUpperCase() : post.date}
          </span>
          <span style={{
            flex: 1, height: '1px',
            background: 'var(--color-accent, #c44)', opacity: 0.3, minWidth: '12px',
          }} />
        </div>
        <p style={{
          fontSize: '12px', color: '#2a2a2a', fontWeight: 500,
          margin: 0, lineHeight: 1.35, maxWidth: `${frameW}px`,
        }}>
          {title}
        </p>
      </div>
    </div>
  );
});

export default PaintingCard;
