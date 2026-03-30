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

// --- Layout constants ---
const CELL = 280;
const CARD_W = 170;
const CARD_INSET_X = 55;
const FRAME_PAD = 5;
const SRC_W = 800;
const DRAG_THRESHOLD = 8; // px before we consider it a drag (not tap)

function seededRng(seed: number) {
  let s = seed | 1;
  return () => {
    s ^= s << 13;
    s ^= s >> 17;
    s ^= s << 5;
    return (s >>> 0) / 0x100000000;
  };
}

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
  x: number;
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
  const cols = Math.max(2, Math.ceil(Math.sqrt((4 / 3) * n)));
  const rows = Math.max(2, Math.ceil(n / cols));
  const worldW = CELL * cols;
  const worldH = CELL * rows;
  const centerCol = Math.floor(cols / 2);
  const centerRow = Math.floor(rows / 2);

  const shuffled = shuffle(posts, 212);
  const totalCells = cols * rows;
  const cells: (PostData | null)[] = new Array(totalCells).fill(null);
  let pi = 0;
  for (let i = 0; i < totalCells && pi < shuffled.length; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    if (col === centerCol && row === centerRow) continue;
    cells[i] = shuffled[pi++];
  }
  // Fill remaining cells with duplicates
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

  const result: LayoutedPost[] = [];
  for (let i = 0; i < totalCells; i++) {
    const post = cells[i];
    if (!post) continue;
    const col = i % cols;
    const row = Math.floor(i / cols);
    const ch = cardHeight(post.painting_id);
    const x = CELL * col + CARD_INSET_X + CARD_W / 2;
    const y = CELL * row + (CELL - ch) / 2 + ch / 2;
    result.push({ ...post, x, y, cardWidth: CARD_W });
  }

  return { cols, rows, worldW, worldH, centerCol, centerRow, posts: result };
}

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
      overflowY: 'auto', WebkitOverflowScrolling: 'touch',
      padding: '3rem 1.5rem 6rem', zIndex: 50,
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
                draggable={false}
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
  const viewportRef = useRef<HTMLDivElement>(null);
  const worldRef = useRef<HTMLDivElement>(null);

  // All interaction state lives in refs (no re-renders during drag)
  const panRef = useRef({ x: 0, y: 0 });
  const rafId = useRef(0);
  const isDragging = useRef(false);
  const hasDragged = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });
  const dragStart = useRef({ x: 0, y: 0 });
  const velHistory = useRef<{ vx: number; vy: number; t: number }[]>([]);
  const momentumRaf = useRef(0);

  const [selectedPost, setSelectedPost] = useState<PostData | null>(null);
  const [view, setView] = useState<'canvas' | 'list'>('canvas');
  const [lang, setLang] = useState('zh');

  useEffect(() => {
    try {
      const saved = localStorage.getItem('axiom-lang');
      if (saved === 'en' || saved === 'zh') setLang(saved);
    } catch {}
  }, []);

  const setLangDirect = useCallback((newLang: string) => {
    setLang(prev => {
      if (prev === newLang) return prev;
      try { localStorage.setItem('axiom-lang', newLang); } catch {}
      return newLang;
    });
  }, []);

  const handleLangToggle = useCallback(() => {
    setLang(prev => {
      const next = prev === 'zh' ? 'en' : 'zh';
      try { localStorage.setItem('axiom-lang', next); } catch {}
      return next;
    });
  }, []);

  const grid = useMemo(() => layoutGrid(posts), [posts]);
  const allPosts = grid.posts;

  // --- Transform helpers (stable via grid ref capture) ---
  const gridRef = useRef(grid);
  gridRef.current = grid;

  const applyTransform = useCallback(() => {
    if (!worldRef.current) return;
    const { x, y } = panRef.current;
    const { worldW, worldH } = gridRef.current;
    const wx = -((-x % worldW + worldW) % worldW);
    const wy = -((-y % worldH + worldH) % worldH);
    worldRef.current.style.transform = `translate(${wx}px, ${wy}px)`;
  }, []);

  const stopMomentum = useCallback(() => {
    if (momentumRaf.current) {
      cancelAnimationFrame(momentumRaf.current);
      momentumRaf.current = 0;
    }
  }, []);

  const startMomentum = useCallback((vx: number, vy: number) => {
    stopMomentum();
    // Clamp initial velocity for sanity
    const maxV = 40;
    let cvx = Math.max(-maxV, Math.min(maxV, vx));
    let cvy = Math.max(-maxV, Math.min(maxV, vy));
    const friction = 0.97; // Smooth, long coast
    const tick = () => {
      cvx *= friction;
      cvy *= friction;
      if (Math.abs(cvx) + Math.abs(cvy) < 0.15) return;
      panRef.current.x += cvx;
      panRef.current.y += cvy;
      applyTransform();
      momentumRaf.current = requestAnimationFrame(tick);
    };
    momentumRaf.current = requestAnimationFrame(tick);
  }, [stopMomentum, applyTransform]);

  const moveOffset = useCallback((dx: number, dy: number) => {
    panRef.current.x += dx;
    panRef.current.y += dy;
    if (rafId.current) cancelAnimationFrame(rafId.current);
    rafId.current = requestAnimationFrame(applyTransform);
  }, [applyTransform]);

  // Center viewport on mount
  useEffect(() => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const centerX = grid.centerCol * CELL + CELL / 2;
    const centerY = grid.centerRow * CELL + CELL / 2;
    panRef.current = { x: vw / 2 - centerX, y: vh / 2 - centerY };
    applyTransform();
  }, [grid, applyTransform]);

  // Default to list on small screens
  useEffect(() => {
    if (window.innerWidth < 768) setView('list');
  }, []);

  // Stable ref for setSelectedPost so native listeners can access it
  const selectedPostSetter = useRef(setSelectedPost);
  selectedPostSetter.current = setSelectedPost;

  // Post lookup map for tap detection
  const postMap = useMemo(() => {
    const m = new Map<string, PostData>();
    for (const p of allPosts) m.set(p.id, p);
    return m;
  }, [allPosts]);
  const postMapRef = useRef(postMap);
  postMapRef.current = postMap;

  // =============================================
  // Native event listeners for touch + mouse
  // =============================================
  useEffect(() => {
    const el = viewportRef.current;
    if (!el || view !== 'canvas') return;

    // --- Shared start/move/end logic ---
    function onStart(cx: number, cy: number) {
      stopMomentum();
      isDragging.current = true;
      hasDragged.current = false;
      dragStart.current = { x: cx, y: cy };
      lastPos.current = { x: cx, y: cy };
      velHistory.current = [];
    }

    function onMove(cx: number, cy: number) {
      if (!isDragging.current) return;
      const dx = cx - lastPos.current.x;
      const dy = cy - lastPos.current.y;
      const totalDx = cx - dragStart.current.x;
      const totalDy = cy - dragStart.current.y;
      if (Math.sqrt(totalDx * totalDx + totalDy * totalDy) > DRAG_THRESHOLD) {
        hasDragged.current = true;
      }
      lastPos.current = { x: cx, y: cy };
      velHistory.current.push({ vx: dx, vy: dy, t: performance.now() });
      if (velHistory.current.length > 5) velHistory.current.shift();
      moveOffset(dx, dy);
    }

    function onEnd() {
      if (!isDragging.current) return;
      isDragging.current = false;
      // Compute velocity from recent history (last 120ms for smoother average)
      const now = performance.now();
      const recent = velHistory.current.filter(v => now - v.t < 120);
      if (recent.length >= 2) {
        const avg = recent.reduce((a, v) => ({ vx: a.vx + v.vx, vy: a.vy + v.vy }), { vx: 0, vy: 0 });
        startMomentum(avg.vx / recent.length, avg.vy / recent.length);
      }
    }

    // --- Touch handlers ---
    function handleTouchStart(e: TouchEvent) {
      // Prevent Safari bounce/scroll — critical for canvas panning
      e.preventDefault();
      const t = e.touches[0];
      onStart(t.clientX, t.clientY);
    }

    function handleTouchMove(e: TouchEvent) {
      e.preventDefault();
      const t = e.touches[0];
      onMove(t.clientX, t.clientY);
    }

    function handleTouchEnd(e: TouchEvent) {
      e.preventDefault();
      // Detect tap (not drag) on a card
      if (!hasDragged.current) {
        // Find card element at the original touch point
        const elAt = document.elementFromPoint(dragStart.current.x, dragStart.current.y);
        const cardEl = elAt?.closest?.('[data-post-id]') as HTMLElement | null;
        if (cardEl) {
          const postId = cardEl.getAttribute('data-post-id');
          if (postId) {
            const post = postMapRef.current.get(postId);
            if (post) {
              selectedPostSetter.current(post);
            }
          }
        }
      }
      onEnd();
    }

    // --- Mouse handlers ---
    function handleMouseDown(e: MouseEvent) {
      if (e.button !== 0) return; // left click only
      onStart(e.clientX, e.clientY);
      // Track mouse globally so drag continues outside viewport
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    function handleMouseMove(e: MouseEvent) {
      onMove(e.clientX, e.clientY);
    }

    function handleMouseUp() {
      onEnd();
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    }

    // --- Wheel (trackpad) — with momentum ---
    let wheelTimeout: ReturnType<typeof setTimeout> | null = null;
    const wheelVel = { vx: 0, vy: 0 };

    function handleWheel(e: WheelEvent) {
      e.preventDefault();
      stopMomentum();
      const dx = -e.deltaX;
      const dy = -e.deltaY;
      moveOffset(dx, dy);
      // Accumulate velocity for trackpad momentum
      wheelVel.vx = dx * 0.5;
      wheelVel.vy = dy * 0.5;
      if (wheelTimeout) clearTimeout(wheelTimeout);
      wheelTimeout = setTimeout(() => {
        if (Math.abs(wheelVel.vx) + Math.abs(wheelVel.vy) > 1) {
          startMomentum(wheelVel.vx, wheelVel.vy);
        }
        wheelVel.vx = 0;
        wheelVel.vy = 0;
      }, 50);
    }

    // Attach — touch must be { passive: false } to allow preventDefault
    el.addEventListener('touchstart', handleTouchStart, { passive: false });
    el.addEventListener('touchmove', handleTouchMove, { passive: false });
    el.addEventListener('touchend', handleTouchEnd, { passive: false });
    el.addEventListener('touchcancel', handleTouchEnd, { passive: false });
    el.addEventListener('mousedown', handleMouseDown);
    el.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      el.removeEventListener('touchstart', handleTouchStart);
      el.removeEventListener('touchmove', handleTouchMove);
      el.removeEventListener('touchend', handleTouchEnd);
      el.removeEventListener('touchcancel', handleTouchEnd);
      el.removeEventListener('mousedown', handleMouseDown);
      el.removeEventListener('wheel', handleWheel);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      if (wheelTimeout) clearTimeout(wheelTimeout);
    };
  }, [view, moveOffset, stopMomentum, startMomentum]);

  const handleCardClick = useCallback((post: PostData) => {
    if (hasDragged.current) return;
    setSelectedPost(post);
  }, []);

  const titleX = grid.centerCol * CELL + CELL / 2;
  const titleY = grid.centerRow * CELL + CELL / 2;

  return (
    <>
      <style>{`
        html, body { margin: 0; padding: 0; overflow: hidden; background: #f5f3ef; }
        /* Prevent iOS pull-to-refresh and rubber-band */
        html { overscroll-behavior: none; }
        body { overscroll-behavior: none; position: fixed; width: 100%; height: 100%; }
      `}</style>

      <div style={{ position: 'fixed', inset: 0, background: '#f5f3ef', overflow: 'hidden' }}>

        {view === 'canvas' && (
          <div
            ref={viewportRef}
            style={{
              width: '100%', height: '100%',
              cursor: 'grab',
              userSelect: 'none',
              WebkitUserSelect: 'none',
              touchAction: 'none',
              WebkitTouchCallout: 'none',
              position: 'relative',
            }}
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
                    {isMainTile && (
                      <div style={{
                        position: 'absolute',
                        left: `${titleX}px`, top: `${titleY}px`,
                        transform: 'translate(-50%, -50%)',
                        textAlign: 'center', pointerEvents: 'none', zIndex: 5,
                        width: `${CELL - 20}px`,
                      }}>
                        <h1 style={{
                          color: '#1a1a1a', fontWeight: 300, fontSize: '1.3rem',
                          letterSpacing: '0.2em', margin: '0 0 0.3rem',
                          fontFamily: "'Google Sans', system-ui, sans-serif",
                          lineHeight: 1.3,
                        }}>
                          Axiom<br />Thoughts
                        </h1>
                        <p style={{
                          color: '#999', fontSize: '0.6rem', letterSpacing: '0.1em', margin: 0,
                          fontFamily: "'Noto Sans SC', sans-serif",
                          lineHeight: 1.5,
                        }}>
                          一只狐狸读书时<br />留下的脚印
                        </p>
                      </div>
                    )}

                    {allPosts.map(post => (
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
            posts={allPosts}
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
          onSetLang={setLangDirect}
        />

        <FilterBar
          view={view}
          onViewChange={setView}
          lang={lang}
          onLangToggle={handleLangToggle}
          onSetLang={setLangDirect}
        />
      </div>
    </>
  );
}
