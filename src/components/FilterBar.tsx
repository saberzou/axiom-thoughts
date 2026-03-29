import React from 'react';

interface FilterBarProps {
  series: string[];
  activeFilter: string;
  onFilterChange: (filter: string) => void;
  view: 'canvas' | 'list';
  onViewChange: (view: 'canvas' | 'list') => void;
  lang: string;
  onLangToggle: () => void;
}

const btnBase: React.CSSProperties = {
  padding: '0.3rem 0.75rem',
  borderRadius: '100px',
  border: 'none',
  fontSize: '0.72rem',
  cursor: 'pointer',
  letterSpacing: '0.05em',
  transition: 'all 0.2s',
  fontFamily: "'Google Sans', system-ui, sans-serif",
};

export default function FilterBar({ series, activeFilter, onFilterChange, view, onViewChange, lang, onLangToggle }: FilterBarProps) {
  const tabs = ['all', ...series];

  return (
    <div style={{
      position: 'fixed',
      bottom: '1.5rem',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 100,
      display: 'flex',
      alignItems: 'center',
      gap: '0.25rem',
      padding: '0.4rem 0.75rem',
      background: 'rgba(255, 255, 255, 0.85)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      border: '1px solid rgba(0, 0, 0, 0.08)',
      borderRadius: '100px',
      boxShadow: '0 4px 24px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
      whiteSpace: 'nowrap',
    }}>
      {/* Series filter tabs */}
      {tabs.map(tab => (
        <button
          key={tab}
          onClick={() => onFilterChange(tab)}
          style={{
            ...btnBase,
            background: activeFilter === tab ? 'rgba(0, 0, 0, 0.08)' : 'transparent',
            color: activeFilter === tab ? '#1a1a1a' : '#999',
          }}
        >
          {tab === 'all' ? 'All' : tab}
        </button>
      ))}

      {/* Divider */}
      <div style={{ width: '1px', height: '14px', background: 'rgba(0, 0, 0, 0.08)', margin: '0 0.25rem', flexShrink: 0 }} />

      {/* View toggle: Canvas */}
      <button
        onClick={() => onViewChange('canvas')}
        title="Canvas"
        style={{
          ...btnBase,
          padding: '0.3rem 0.55rem',
          background: view === 'canvas' ? 'rgba(0, 0, 0, 0.08)' : 'transparent',
          color: view === 'canvas' ? '#1a1a1a' : '#999',
          fontSize: '0.8rem',
          borderRadius: '8px',
        }}
      >
        ⊞
      </button>
      {/* View toggle: List */}
      <button
        onClick={() => onViewChange('list')}
        title="List"
        style={{
          ...btnBase,
          padding: '0.3rem 0.55rem',
          background: view === 'list' ? 'rgba(0, 0, 0, 0.08)' : 'transparent',
          color: view === 'list' ? '#1a1a1a' : '#999',
          fontSize: '0.95rem',
          borderRadius: '8px',
          lineHeight: 1,
        }}
      >
        ≡
      </button>

      {/* Divider */}
      <div style={{ width: '1px', height: '14px', background: 'rgba(0, 0, 0, 0.08)', margin: '0 0.25rem', flexShrink: 0 }} />

      {/* Language toggle */}
      {(['zh', 'en'] as const).map(l => (
        <button
          key={l}
          onClick={onLangToggle}
          style={{
            ...btnBase,
            padding: '0.25rem 0.55rem',
            background: lang === l ? 'rgba(0, 0, 0, 0.08)' : 'transparent',
            color: lang === l ? '#1a1a1a' : '#999',
            borderRadius: '8px',
          }}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
