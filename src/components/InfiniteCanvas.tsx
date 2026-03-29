import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import PaintingCard from './PaintingCard';
import SideDrawer from './SideDrawer';
import FilterBar from './FilterBar';

export interface PostData {
  id: string;
  title: string;
  title_en: string;
  date: string;
  tags: string[];
  series?: string;
  painting_id: string;
  painting_title: string;
  painting_artist: string;
  body: string;
  body_en: string;
  excerpt: string;
  excerpt_en: string;
}

interface LayoutedPost extends PostData {
  x: number;
  y: number;
  size: 'small' | 'medium' | 'large';
}

// --- Layout helpers ---

function hashStr(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(31, h) + str.charCodeAt(i) | 0;
  }
  return Math.abs(h);
}

function seededRng(seed: number) {
  let s = seed | 1;
  return () => {
    s ^= s << 13;
    s ^= s >> 17;
    s ^= s << 5;
    return (s >>> 0) / 0x100000000;
  };
}

const WORLD_CENTER = { x: 3000, y: 2400 };
const SIZES: ('small' | 'medium' | 'large')[] = ['small', 'medium', 'large'];

function layoutPosts(posts: PostData[]): LayoutedPost[] {
  const rings = [
    { count: 8,  baseRadius: 480,  yScale: 0.65 },
    { count: 10, baseRadius: 860,  yScale: 0.65 },
    { count: 13, baseRadius: 1240, yScale: 0.65 },
  ];

  const result: LayoutedPost[] = [];
  let idx = 0;

  for (const ring of rings) {
    for (let i = 0; i < ring.count && idx < posts.length; i++, idx++) {
      const post = posts[idx];
      const rng = seededRng(hashStr(post.id));
      const baseAngle = (i / ring.count) * Math.PI * 2 - Math.PI / 2;
      const angleJitter = (rng() - 0.5) * (Math.PI * 2 / ring.count) * 0.6;
      const angle = baseAngle + angleJitter;
      const radiusJitter = (rng() - 0.5) * 140;
      const radius = ring.baseRadius + radiusJitter;
      const x = WORLD_CENTER.x + Math.cos(angle) * radius;
      const y = WORLD_CENTER.y + Math.sin(angle) * radius * ring.yScale;
      const size = SIZES[Math.floor(rng() * 3)];
      result.push({ ...post, x, y, size });
    }
  }

  while (idx < posts.length) {
    const post = posts[idx];
    const rng = seededRng(hashStr(post.id));
    const i = idx - 31;
    const total = Math.max(posts.length - 31, 1);
    const angle = (i / total) * Math.PI * 2 - Math.PI / 2;
    const radius = 1620 + (rng() - 0.5) * 180;
    const x = WORLD_CENTER.x + Math.cos(angle) * radius;
    const y = WORLD_CENTER.y + Math.sin(angle) * radius * 0.62;
    const size = SIZES[Math.floor(rng() * 3)];
    result.push({ ...post, x, y, size });
    idx++;
  }

  return result;
}

// --- List view ---
function ListView({
  posts, basePath, lang, onSelect,
}: {
  posts: PostData[];
  basePath: string;
  lang: string;
  onSelect: (p: PostData) => void;
}) {
  const sorted = [...posts].sort((a, b) => b.date.localeCompare(a.date));
  return (
    <div style={{
      position: 'fixed', inset: 0, background: '#f5f3ef',
      overflowY: 'auto', padding: '3rem 1.5rem 6rem', zIndex: 50,
    }}>
      <div style={{ maxWidth: '640px', margin: '0 auto' }}>
        <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
          <h1 style={{ color: '#1a1a1a', fontWeight: 300, letterSpacing: '0.25em', fontSize: '1.5rem', margin: '0 0 0.4rem' }}>
            Axiom Thoughts
          </h1>
          <p style={{ color: '#999', fontSize: '0.8rem', letterSpacing: '0.15em' }}>
            一只狐狸读书时留下的脚印
          </p>
        </div>
        {sorted.map(post => {
          const title = lang === 'en' && post.title_en ? post.title_en : post.title;
          const excerpt = lang === 'en' && post.excerpt_en ? post.excerpt_en : post.excerpt;
          return (
            <div key={post.id} onClick={() => onSelect(post)} style={{
              display: 'flex', gap: '1rem', padding: '1rem 0',
              borderBottom: '1px solid rgba(0,0,0,0.06)', cursor: 'pointer',
            }}>
              <img src={`${basePath}/paintings/${post.painting_id}.jpg`} alt=""
                style={{ width: '60px', height: '45px', objectFit: 'cover', flexShrink: 0, opacity: 0.9 }} />
              <div>
                <div style={{ color: '#999', fontSize: '0.65rem', letterSpacing: '0.08em', marginBottom: '0.25rem', fontFamily: 'monospace' }}>
                  {post.date}
                </div>
                <div style={{ color: '#2a2a2a', fontSize: '0.88rem', fontWeight: 400, lineHeight: 1.4, marginBottom: '0.3rem' }}>
                  {title}
                </div>
                <div style={{ color: '#888', fontSize: '0.75rem', lineHeight: 1.4 }}>
                  {excerpt}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// --- Tile key from tile indices ---
function tileKey(tx: number, ty: number) { return `${tx},${ty}`; }

// --- Main component ---
interface InfiniteCanvasProps {
  posts: PostData[];
  basePath: string;
}

export default function InfiniteCanvas({ posts, basePath }: InfiniteCanvasProps) {
  const isDragging = useRef(false);
  const hasDragged = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });
  const dragStart = useRef({ x: 0, y: 0 });
  const viewportRef = useRef<HTMLDivElement>(null);
  const worldRef = useRef<HTMLDivElement>(null);

  // offset lives in ref for perf — DOM updated directly via rAF
  const offsetRef = useRef({ x: 0, y: 0 });
  const rafId = useRef(0);

  const [selectedPost, setSelectedPost] = useState<PostData | null>(null);
  const [activeFilter, setActiveFilter] = useState('all');
  const [view, setView] = useState<'canvas' | 'list'>('canvas');
  const [lang, setLang] = useState('zh');

  // Tile state — only re-render when visible tile set changes
  const [tiles, setTiles] = useState<{ tx: number; ty: number }[]>([{ tx: 0, ty: 0 }]);
  const lastTileKey = useRef('0,0');

  useEffect(() => {
    try {
      const saved = localStorage.getItem('axiom-lang');
      if (saved === 'en' || saved === 'zh') setLang(saved);
    } catch {}
  }, []);

  const handleLangToggle = useCallback(() => {
    setLang(prev => {
      const next = prev === 'zh' ? 'en' : 'zh';
      try { localStorage.setItem('axiom-lang', next); } catch {}
      return next;
    });
  }, []);

  // Center viewport on WORLD_CENTER
  useEffect(() => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    offsetRef.current = { x: vw / 2 - WORLD_CENTER.x, y: vh / 2 - WORLD_CENTER.y };
    applyTransform();
    recalcTiles();
  }, []);

  useEffect(() => {
    if (window.innerWidth < 768) setView('list');
  }, []);

  const layoutedPosts = useMemo(() => layoutPosts(posts), [posts]);

  const series = useMemo(() =>
    [...new Set(posts.map(p => p.series).filter((s): s is string => !!s))],
    [posts]
  );

  const filteredPosts = useMemo(() => {
    if (activeFilter === 'all') return layoutedPosts;
    return layoutedPosts.filter(p => p.series === activeFilter);
  }, [layoutedPosts, activeFilter]);

  // Bounding box of all laid-out posts
  const worldBounds = useMemo(() => {
    if (filteredPosts.length === 0) return { minX: 0, maxX: 6000, minY: 0, maxY: 4800, w: 6000, h: 4800 };
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const p of filteredPosts) {
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.y > maxY) maxY = p.y;
    }
    const margin = 300;
    minX -= margin; maxX += margin; minY -= margin; maxY += margin;
    return { minX, maxX, minY, maxY, w: maxX - minX, h: maxY - minY };
  }, [filteredPosts]);

  // Store worldBounds in ref so recalcTiles can access without dependency
  const worldBoundsRef = useRef(worldBounds);
  worldBoundsRef.current = worldBounds;

  // Apply transform directly to DOM — no React re-render
  const applyTransform = useCallback(() => {
    if (worldRef.current) {
      const { x, y } = offsetRef.current;
      worldRef.current.style.transform = `translate(${x}px, ${y}px)`;
    }
  }, []);

  // Recalc visible tiles — only triggers setState if tile set actually changed
  const recalcTiles = useCallback(() => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const bounds = worldBoundsRef.current;
    const { w, h } = bounds;
    if (w <= 0 || h <= 0) return;

    const { x: ox, y: oy } = offsetRef.current;
    const viewMinX = -ox;
    const viewMaxX = -ox + vw;
    const viewMinY = -oy;
    const viewMaxY = -oy + vh;

    const startTileX = Math.floor((viewMinX - bounds.maxX) / w);
    const endTileX = Math.ceil((viewMaxX - bounds.minX) / w);
    const startTileY = Math.floor((viewMinY - bounds.maxY) / h);
    const endTileY = Math.ceil((viewMaxY - bounds.minY) / h);

    const newTiles: { tx: number; ty: number }[] = [];
    for (let tx = startTileX; tx <= endTileX; tx++) {
      for (let ty = startTileY; ty <= endTileY; ty++) {
        newTiles.push({ tx, ty });
      }
    }

    const key = newTiles.map(t => tileKey(t.tx, t.ty)).join('|');
    if (key !== lastTileKey.current) {
      lastTileKey.current = key;
      setTiles(newTiles);
    }
  }, []);

  // Move offset + schedule a single rAF for DOM update + tile check
  const moveOffset = useCallback((dx: number, dy: number) => {
    offsetRef.current.x += dx;
    offsetRef.current.y += dy;

    if (rafId.current) cancelAnimationFrame(rafId.current);
    rafId.current = requestAnimationFrame(() => {
      applyTransform();
      recalcTiles();
    });
  }, [applyTransform, recalcTiles]);

  // --- Drag handlers ---
  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('[data-card]')) return;
    isDragging.current = true;
    hasDragged.current = false;
    dragStart.current = { x: e.clientX, y: e.clientY };
    lastPos.current = { x: e.clientX, y: e.clientY };
    (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging.current) return;
    const dx = e.clientX - lastPos.current.x;
    const dy = e.clientY - lastPos.current.y;
    const totalDx = e.clientX - dragStart.current.x;
    const totalDy = e.clientY - dragStart.current.y;
    if (Math.sqrt(totalDx * totalDx + totalDy * totalDy) > 5) hasDragged.current = true;
    lastPos.current = { x: e.clientX, y: e.clientY };
    moveOffset(dx, dy);
  }, [moveOffset]);

  const handlePointerUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  // Trackpad 2-finger swipe / mouse wheel panning
  useEffect(() => {
    const el = viewportRef.current;
    if (!el || view !== 'canvas') return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      moveOffset(-e.deltaX, -e.deltaY);
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [view, moveOffset]);

  const handleCardClick = useCallback((post: PostData) => {
    if (hasDragged.current) return;
    setSelectedPost(post);
  }, []);

  return (
    <>
      <style>{`
        html, body { margin: 0; padding: 0; overflow: hidden; background: #f5f3ef; }
      `}</style>

      <div style={{ position: 'fixed', inset: 0, background: '#f5f3ef', overflow: 'hidden' }}>

        {view === 'canvas' && (
          <div
            ref={viewportRef}
            style={{ width: '100%', height: '100%', cursor: 'grab', userSelect: 'none', touchAction: 'none', position: 'relative' }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
          >
            {/* World container — transform updated via ref, not state */}
            <div
              ref={worldRef}
              style={{
                position: 'absolute', top: 0, left: 0, width: 0, height: 0,
                willChange: 'transform',
              }}
            >
              {/* Center title */}
              <div style={{
                position: 'absolute',
                left: `${WORLD_CENTER.x}px`, top: `${WORLD_CENTER.y}px`,
                transform: 'translate(-50%, -50%)', textAlign: 'center',
                pointerEvents: 'none', zIndex: 5,
              }}>
                <h1 style={{
                  color: '#1a1a1a', fontWeight: 300, fontSize: '2.2rem',
                  letterSpacing: '0.35em', margin: '0 0 0.4rem',
                  fontFamily: "'Google Sans', system-ui, sans-serif", whiteSpace: 'nowrap',
                }}>
                  Axiom Thoughts
                </h1>
                <p style={{
                  color: '#999', fontSize: '0.8rem', letterSpacing: '0.2em', margin: 0,
                  fontFamily: "'Noto Sans SC', sans-serif", whiteSpace: 'nowrap',
                }}>
                  一只狐狸读书时留下的脚印
                </p>
              </div>

              {/* Subtle center backdrop */}
              <div style={{
                position: 'absolute',
                left: `${WORLD_CENTER.x}px`, top: `${WORLD_CENTER.y}px`,
                transform: 'translate(-50%, -50%)',
                width: '360px', height: '260px', borderRadius: '50%',
                background: 'radial-gradient(ellipse at center, rgba(245,243,239,0.95) 0%, transparent 70%)',
                pointerEvents: 'none',
              }} />

              {/* Tiled painting cards — only re-renders when tile set changes */}
              {tiles.map(({ tx, ty }) => (
                <div
                  key={`tile-${tx}-${ty}`}
                  style={{
                    position: 'absolute', top: 0, left: 0,
                    transform: `translate(${tx * worldBounds.w}px, ${ty * worldBounds.h}px)`,
                  }}
                >
                  {filteredPosts.map(post => (
                    <PaintingCard
                      key={`${post.id}-${tx}-${ty}`}
                      post={post}
                      basePath={basePath}
                      lang={lang}
                      onClick={() => handleCardClick(post)}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}

        {view === 'list' && (
          <ListView
            posts={filteredPosts}
            basePath={basePath}
            lang={lang}
            onSelect={post => setSelectedPost(post)}
          />
        )}

        <SideDrawer
          post={selectedPost}
          basePath={basePath}
          lang={lang}
          onClose={() => setSelectedPost(null)}
          onLangToggle={handleLangToggle}
        />

        <FilterBar
          series={series}
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          view={view}
          onViewChange={setView}
          lang={lang}
          onLangToggle={handleLangToggle}
        />
      </div>
    </>
  );
}
