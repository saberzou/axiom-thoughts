import React, { useEffect, useRef } from 'react';
import type { PostData } from './InfiniteCanvas';

interface SideDrawerProps {
  post: PostData | null;
  basePath: string;
  lang: string;
  onClose: () => void;
  onLangToggle: () => void;
  onSetLang?: (lang: string) => void;
}

// Minimal safe markdown → HTML (trusted content, our own markdown files)
function mdToHtml(md: string): string {
  const lines = md.split('\n');
  const out: string[] = [];
  let inPara = false;

  const inline = (text: string) =>
    text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>');

  const closePara = () => { if (inPara) { out.push('</p>'); inPara = false; } };

  for (const raw of lines) {
    if (raw.startsWith('### ')) {
      closePara();
      out.push(`<h3>${inline(raw.slice(4))}</h3>`);
    } else if (raw.startsWith('## ')) {
      closePara();
      out.push(`<h2>${inline(raw.slice(3))}</h2>`);
    } else if (raw.startsWith('# ')) {
      closePara();
      out.push(`<h1>${inline(raw.slice(2))}</h1>`);
    } else if (raw.startsWith('> ')) {
      closePara();
      out.push(`<blockquote>${inline(raw.slice(2))}</blockquote>`);
    } else if (raw.trim() === '---') {
      closePara();
      out.push('<hr>');
    } else if (raw.trim() === '') {
      closePara();
    } else {
      if (!inPara) { out.push('<p>'); inPara = true; }
      out.push(inline(raw));
    }
  }
  closePara();
  return out.join('\n');
}

export default function SideDrawer({ post, basePath, lang, onClose, onLangToggle, onSetLang }: SideDrawerProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (post && scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [post?.id]);

  const isOpen = post !== null;
  const title = lang === 'en' && post?.title_en ? post.title_en : post?.title ?? '';
  const body = lang === 'en' && post?.body_en ? post.body_en : post?.body ?? '';
  const bodyHtml = body ? mdToHtml(body) : '';
  const imgUrl = post ? `${basePath}/paintings/${post.painting_id}.jpg` : '';
  const slug = post?.id ?? '';

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.15)',
          zIndex: 150,
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? 'auto' : 'none',
          transition: 'opacity 0.3s ease',
        }}
      />

      {/* Drawer panel — slides from left, ~50% width on desktop */}
      <div
        ref={scrollRef}
        className="axiom-drawer-panel"
        style={{
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          width: 'min(50vw, 100vw)',
          transform: `translateX(${isOpen ? '0' : '-100%'})`,
          transition: 'transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
          background: '#fff',
          borderRight: '1px solid rgba(0, 0, 0, 0.08)',
          zIndex: 200,
          overflowY: 'auto',
          overflowX: 'hidden',
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(0,0,0,0.15) transparent',
        }}
      >
        {/* Header bar */}
        <div style={{
          position: 'sticky',
          top: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.75rem 1rem',
          background: 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(8px)',
          borderBottom: '1px solid rgba(0,0,0,0.06)',
          zIndex: 10,
        }}>
          {/* Lang buttons — direct set, not toggle */}
          <div style={{ display: 'flex', gap: '0.25rem' }}>
            {(['zh', 'en'] as const).map(l => (
              <button
                key={l}
                onClick={() => onSetLang ? onSetLang(l) : onLangToggle()}
                style={{
                  padding: '0.2rem 0.6rem',
                  borderRadius: '4px',
                  border: '1px solid rgba(0,0,0,0.1)',
                  background: lang === l ? 'rgba(0,0,0,0.06)' : 'transparent',
                  color: lang === l ? '#1a1a1a' : '#999',
                  fontSize: '0.7rem',
                  cursor: 'pointer',
                  letterSpacing: '0.05em',
                  transition: 'all 0.2s',
                }}
              >
                {l.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Close */}
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#bbb',
              fontSize: '1.2rem',
              cursor: 'pointer',
              lineHeight: 1,
              padding: '0.2rem 0.4rem',
              borderRadius: '4px',
              transition: 'color 0.2s',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = '#333')}
            onMouseLeave={e => (e.currentTarget.style.color = '#bbb')}
          >
            ×
          </button>
        </div>

        {post && (
          <>
            {/* Painting */}
            <div style={{
              position: 'relative',
              width: '100%',
              paddingBottom: '60%',
              overflow: 'hidden',
              background: '#f5f3ef',
            }}>
              <img
                src={imgUrl}
                alt={`${post.painting_title} — ${post.painting_artist}`}
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  objectPosition: 'center 40%',
                }}
              />
              {/* Gradient overlay at bottom */}
              <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: '50%',
                background: 'linear-gradient(to bottom, transparent, #fff)',
              }} />
              {/* Painting credit */}
              <div style={{
                position: 'absolute',
                bottom: '0.6rem',
                right: '0.75rem',
                color: 'rgba(0,0,0,0.35)',
                fontSize: '0.6rem',
                letterSpacing: '0.07em',
                textAlign: 'right',
              }}>
                <div>{post.painting_title}</div>
                <div>{post.painting_artist}</div>
              </div>
            </div>

            {/* Post metadata */}
            <div style={{ padding: '1.25rem 1.25rem 0' }}>
              <div style={{
                color: '#999',
                fontSize: '0.65rem',
                letterSpacing: '0.1em',
                marginBottom: '0.5rem',
                fontFamily: "'Google Sans', system-ui, sans-serif",
              }}>
                {post.date}
                {post.series && (
                  <span style={{ marginLeft: '0.75rem', color: '#666', borderLeft: '1px solid #ddd', paddingLeft: '0.75rem' }}>
                    {post.series}
                  </span>
                )}
              </div>

              <h2 style={{
                color: '#1a1a1a',
                fontSize: '1.1rem',
                fontWeight: 500,
                lineHeight: 1.4,
                margin: '0 0 1.25rem',
                letterSpacing: '0.02em',
              }}>
                {title}
              </h2>
            </div>

            {/* Article content */}
            <div
              className="drawer-body"
              dangerouslySetInnerHTML={{ __html: bodyHtml }}
              style={{
                padding: '0 1.25rem 2rem',
                color: '#444',
                fontSize: '0.875rem',
                lineHeight: 1.85,
                fontFamily: lang === 'zh' ? "'Noto Sans SC', serif" : "'Georgia', serif",
              }}
            />

            {/* Footer: read full link */}
            <div style={{
              padding: '1rem 1.25rem 2rem',
              borderTop: '1px solid rgba(0,0,0,0.06)',
            }}>
              <a
                href={`${basePath}/${slug}`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  color: '#1a1a1a',
                  fontSize: '0.75rem',
                  letterSpacing: '0.07em',
                  textDecoration: 'none',
                  opacity: 0.5,
                  transition: 'opacity 0.2s',
                }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '0.5')}
              >
                Read full page →
              </a>
            </div>
          </>
        )}
      </div>

      <style>{`
        .drawer-body h1, .drawer-body h2, .drawer-body h3 {
          color: #1a1a1a;
          font-weight: 500;
          margin: 1.5em 0 0.5em;
        }
        .drawer-body blockquote {
          border-left: 2px solid rgba(0,0,0,0.12);
          margin: 1em 0;
          padding-left: 1em;
          color: #666;
          font-style: italic;
        }
        .drawer-body hr {
          border: none;
          border-top: 1px solid rgba(0,0,0,0.08);
          margin: 1.5em 0;
        }
        @media (max-width: 768px) {
          .axiom-drawer-panel { width: 100vw !important; }
        }
      `}</style>
    </>
  );
}
