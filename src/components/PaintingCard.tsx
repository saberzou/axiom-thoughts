import React, { useState } from 'react';
import type { PostData } from './InfiniteCanvas';
import { PAINTING_HEIGHTS } from '../data/paintingHeights';

interface PaintingCardProps {
  post: PostData & { x: number; y: number; cardWidth: number };
  basePath: string;
  lang: string;
  onClick: () => void;
}

const FRAME_PAD = 5; // px padding inside black frame
const SRC_WIDTH = 800; // all source images are 800px wide

export default function PaintingCard({ post, basePath, lang, onClick }: PaintingCardProps) {
  const [hovered, setHovered] = useState(false);
  const imgUrl = `${basePath}/paintings/${post.painting_id}.jpg`;
  const title = lang === 'en' && post.title_en ? post.title_en : post.title;

  const frameW = post.cardWidth;
  const imgW = frameW - FRAME_PAD * 2;
  // Natural height from real image dimensions
  const srcH = PAINTING_HEIGHTS[post.painting_id] || 600;
  const imgH = Math.round(imgW * (srcH / SRC_WIDTH));

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
        width: `${frameW}px`,
        padding: `${FRAME_PAD}px`,
        background: '#1a1a1a',
        boxShadow: hovered
          ? '0 8px 24px rgba(0,0,0,0.15), 0 2px 8px rgba(0,0,0,0.1)'
          : '0 4px 12px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.06)',
      }}>
        <div style={{ overflow: 'hidden', lineHeight: 0, background: '#f0ede8' }}>
          <img
            src={imgUrl}
            alt={`${post.painting_title} — ${post.painting_artist}`}
            loading="lazy"
            draggable={false}
            style={{
              width: '100%',
              height: `${imgH}px`,
              objectFit: 'cover',
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
}
