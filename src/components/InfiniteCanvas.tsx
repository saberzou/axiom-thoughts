import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import PaintingCard from './PaintingCard';
import SideDrawer from './SideDrawer';
import FilterBar from './FilterBar';
import { PAINTING_HEIGHTS } from '../data/paintingHeights';

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

// --- Layout: 280×280 cell grid (matching tokyo.floguo.com) ---

const CELL = 280;       // each grid cell is 280×280
const CARD_W = 170;     // card width within cell
const CARD_INSET_X = 55; // horizontal inset from cell left edge
const FRAME_PAD = 5;
const SRC_W = 800;

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

// Seeded shuffle (Fisher-Yates)
function shuffle<T>(arr: T[], seed: number): T[] {
  const a = [...arr];
  const rng = seededRng(seed);
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function cardHeight(paintingId: string): number {
  const imgW = CARD_W - FRAME_PAD * 2;
  const srcH = PAINTING_HEIGHTS[paintingId] || 600;
  return Math.round(imgW * (srcH / SRC_W)) + FRAME_PAD * 2;
}

interface LayoutedPost extends PostData {
  x: number;  // absolute world px
  y: number;
  cardWidth: number;
}

interface GridInfo {
  cols: number;
  rows: number;
  worldW: number;
  worldH: number;
  centerCol: number;
  centerRow: number;
  posts: LayoutedPost[];
}

function layoutGrid(posts: PostData[]): GridInfo {
  const n = posts.length;
  // Same formula as reference: cols = ceil(sqrt(4/3 * n)), rows = ceil(n/cols)
  const cols = Math.max(2, Math.ceil(Math.sqrt((4 / 3) * n)));
  const rows = Math.max(2, Math.ceil(n / cols));
  const worldW = CELL * cols;
  const worldH = CELL * rows;
  const centerCol = Math.floor(cols / 2);
  const centerRow = Math.floor(rows / 2);

  // Shuffle posts with a fixed seed
  const shuffled = shuffle(posts, 212);
  const totalCells = cols * rows;

  // Build cell assignments (skip center cell)
  const cells: (PostData | null)[] = new Array(totalCells).fill(null);
  let pi = 0;
  for (let i = 0; i < totalCells && pi < shuffled.length; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    if (col === centerCol && row === centerRow) continue; // center is for title
    cells[i] = shuffled[pi++];
  }

  // If fewer posts than cells, fill remaining with duplicates
  if (pi < shuffled.length) {
    // all assigned
  } else {
    const shuffled2 = shuffle(posts, 717);
    let di = 0;
    for (let i = 0; i < totalCells; i++) {
      if (!cells[i]) {
        const col = i % cols;
        const row = Math.floor(i / cols);
        if (col === centerCol && row === centerRow) continue;
        cells[i] = shuffled2[di % shuffled2.length];
        di++;
      }
    }
  }

  // Position each card within its cell
  const result: LayoutedPost[] = [];
  for (let i = 0; i < totalCells; i++) {
    const post = cells[i];
    if (!post) continue;
    const col = i % cols;
    const row = Math.floor(i / cols);
    const ch = cardHeight(post.painting_id);
    const x = CELL * col + CARD_INSET_X + CARD_W / 2;  // center of card
    const y = CELL * row + (CELL - ch) / 2 + ch / 2;    // vertically centered in cell
    result.push({ ...post, x, y, cardWidth: CARD_W });
  }

  return { cols, rows, worldW, worldH, centerCol, centerRow, posts: result };
}

// --- 5×5 tile offsets for infinite wrapping ---
const TILE_OFFSETS = [-2, -1, 0, 1, 2].flatMap(ty =>
  [-2, -1, 0, 1, 2].map(tx => ({ tx, ty }))
);

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

  // Pan offset as ref (DOM updated directly)
  const panRef = useRef({ x: 0, y: 0 });
  const rafId = useRef(0);

  // Momentum
  const velocityRef = useRef({ vx: 0, vy: 0 });
  const velHistory = useRef<{ vx: number; vy: number }[]>([]);
  const momentumRaf = useRef(0);

  const [selectedPost, setSelectedPost] = useState<PostData | null>(null);
  const [activeFilter, setActiveFilter] = useState('all');
  const [view, setView] = useState<'canvas' | 'list'>('canvas');
  const [lang, setLang] = useState('zh');

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

  // Layout
  const grid = useMemo(() => layoutGrid(posts), [posts]);

  const series = useMemo(() =>
    [...new Set(posts.map(p => p.series).filter((s): s is string => !!s))],
    [posts]
  );

  const filteredPosts = useMemo(() => {
    if (activeFilter === 'all') return grid.posts;
    return grid.posts.filter(p => p.series === activeFilter);
  }, [grid.posts, activeFilter]);

  // Center viewport on world center
  useEffect(() => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const centerX = grid.centerCol * CELL + CELL / 2;
    const centerY = grid.centerRow * CELL + CELL / 2;
    panRef.current = { x: vw / 2 - centerX, y: vh / 2 - centerY };
    applyTransform();
  }, [grid]);

  useEffect(() => {
    if (window.innerWidth < 768) setView('list');
  }, []);

  // Apply wrapped transform to DOM
  const applyTransform = useCallback(() => {
    if (!worldRef.current) return;
    const { x, y } = panRef.current;
    const { worldW, worldH } = grid;
    // Wrap offset so it tiles seamlessly
    const wx = -((-x % worldW + worldW) % worldW);
    const wy = -((-y % worldH + worldH) % worldH);
    worldRef.current.style.transform = `translate(${wx}px, ${wy}px)`;
  }, [grid]);

  // Stop momentum
  const stopMomentum = useCallback(() => {
    if (momentumRaf.current) {
      cancelAnimationFrame(momentumRaf.current);
      momentumRaf.current = 0;
    }
  }, []);

  // Start momentum coast
  const startMomentum = useCallback((vx: number, vy: number) => {
    stopMomentum();
    let cvx = vx, cvy = vy;
    const tick = () => {
      cvx *= 0.92;
      cvy *= 0.92;
      if (Math.abs(cvx) + Math.abs(cvy) < 0.3) return;
      panRef.current.x += cvx;
      panRef.current.y += cvy;
      applyTransform();
      momentumRaf.current = requestAnimationFrame(tick);
    };
    momentumRaf.current = requestAnimationFrame(tick);
  }, [stopMomentum, applyTransform]);

  // Move offset + apply
  const moveOffset = useCallback((dx: number, dy: number) => {
    panRef.current.x += dx;
    panRef.current.y += dy;
    if (rafId.current) cancelAnimationFrame(rafId.current);
    rafId.current = requestAnimationFrame(() => {
      applyTransform();
    });
  }, [applyTransform]);

  // --- Drag handlers ---
  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('[data-card]')) return;
    stopMomentum();
    isDragging.current = true;
    hasDragged.current = false;
    dragStart.current = { x: e.clientX, y: e.clientY };
    lastPos.current = { x: e.clientX, y: e.clientY };
    velHistory.current = [];
    (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
  }, [stopMomentum]);

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging.current) return;
    const dx = e.clientX - lastPos.current.x;
    const dy = e.clientY - lastPos.current.y;
    const totalDx = e.clientX - dragStart.current.x;
    const totalDy = e.clientY - dragStart.current.y;
    if (Math.sqrt(totalDx * totalDx + totalDy * totalDy) > 5) hasDragged.current = true;
    lastPos.current = { x: e.clientX, y: e.clientY };
    velHistory.current.push({ vx: dx, vy: dy });
    if (velHistory.current.length > 4) velHistory.current.shift();
    moveOffset(dx, dy);
  }, [moveOffset]);

  const handlePointerUp = useCallback(() => {
    if (!isDragging.current) return;
    isDragging.current = false;
    // Momentum from velocity history
    const hist = velHistory.current;
    if (hist.length > 0) {
      const avg = hist.reduce((a, v) => ({ vx: a.vx + v.vx, vy: a.vy + v.vy }), { vx: 0, vy: 0 });
      startMomentum(avg.vx / hist.length, avg.vy / hist.length);
    }
  }, [startMomentum]);

  // Trackpad / wheel
  useEffect(() => {
    const el = viewportRef.current;
    if (!el || view !== 'canvas') return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      stopMomentum();
      moveOffset(-e.deltaX, -e.deltaY);
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [view, moveOffset, stopMomentum]);

  const handleCardClick = useCallback((post: PostData) => {
    if (hasDragged.current) return;
    setSelectedPost(post);
  }, []);

  // Center title position
  const titleX = grid.centerCol * CELL + CELL / 2;
  const titleY = grid.centerRow * CELL + CELL / 2;

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
            <div
              ref={worldRef}
              style={{
                position: 'absolute', top: 0, left: 0, width: 0, height: 0,
                willChange: 'transform',
                filter: selectedPost ? 'blur(6px) brightness(0.92)' : 'none',
                transition: 'filter 0.35s ease',
              }}
            >
              {/* 5×5 tile grid for infinite wrap */}
              {TILE_OFFSETS.map(({ tx, ty }) => {
                const isMainTile = tx === 0 && ty === 0;
                return (
                  <div
                    key={`tile-${tx}-${ty}`}
                    style={{
                      position: 'absolute', top: 0, left: 0,
                      transform: `translate(${tx * grid.worldW}px, ${ty * grid.worldH}px)`,
                    }}
                  >
                    {/* Title only in main tile center */}
                    {isMainTile && (
                      <div style={{
                        position: 'absolute',
                        left: `${titleX}px`, top: `${titleY}px`,
                        transform: 'translate(-50%, -50%)',
                        textAlign: 'center', pointerEvents: 'none', zIndex: 5,
                        width: `${CELL}px`,
                      }}>
                        <h1 style={{
                          color: '#1a1a1a', fontWeight: 300, fontSize: '2rem',
                          letterSpacing: '0.3em', margin: '0 0 0.3rem',
                          fontFamily: "'Google Sans', system-ui, sans-serif",
                          whiteSpace: 'nowrap',
                        }}>
                          Axiom Thoughts
                        </h1>
                        <p style={{
                          color: '#999', fontSize: '0.75rem', letterSpacing: '0.18em', margin: 0,
                          fontFamily: "'Noto Sans SC', sans-serif", whiteSpace: 'nowrap',
                        }}>
                          一只狐狸读书时留下的脚印
                        </p>
                      </div>
                    )}

                    {/* Cards */}
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
                );
              })}
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
