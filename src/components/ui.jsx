import { useState } from 'react';
// ─────────────────────────────────────────────────────────────
//  ui.jsx — TripSpend design system primitives
// ─────────────────────────────────────────────────────────────

// ── Avatar ────────────────────────────────────────────────────
const PALETTE = [
  '#7ee8a2', '#93c5fd', '#fca5a5', '#fcd34d',
  '#c4b5fd', '#f9a8d4', '#6ee7f7', '#fbd38d',
  '#a5f3b0', '#bfdbfe',
];

export function Avatar({ name = '?', index = 0, size = 36 }) {
  return (
    <div
      aria-label={name}
      style={{
        width: size, height: size, borderRadius: '50%', flexShrink: 0,
        background: PALETTE[Math.abs(index) % PALETTE.length],
        color: '#0c0c0f', fontWeight: 700,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: size * 0.38, fontFamily: 'var(--font-mono)',
        userSelect: 'none',
      }}
    >
      {name[0].toUpperCase()}
    </div>
  );
}

// ── Card ──────────────────────────────────────────────────────
export function Card({ children, style = {} }) {
  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)', padding: 24, ...style,
    }}>
      {children}
    </div>
  );
}

// ── SectionLabel ─────────────────────────────────────────────
export function SectionLabel({ children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
      <span style={{
        fontSize: 10, fontWeight: 700, letterSpacing: '0.15em',
        color: 'rgba(126,232,162,0.65)', fontFamily: 'var(--font-mono)',
        textTransform: 'uppercase', whiteSpace: 'nowrap',
      }}>
        {children}
      </span>
      <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
    </div>
  );
}

// ── Input ─────────────────────────────────────────────────────
export function Input({ style = {}, ...props }) {
  return (
    <input
      {...props}
      style={{
        width: '100%', padding: '10px 14px',
        background: 'var(--surface-2)', border: '1.5px solid var(--border)',
        borderRadius: 'var(--radius-sm)', color: 'var(--text)',
        fontSize: 13, fontFamily: 'var(--font-mono)',
        outline: 'none', transition: 'border-color 0.15s',
        ...style,
      }}
      onFocus={(e) => { e.target.style.borderColor = 'rgba(126,232,162,0.5)'; props.onFocus?.(e); }}
      onBlur={(e)  => { e.target.style.borderColor = 'var(--border)';          props.onBlur?.(e);  }}
    />
  );
}

// ── Select ────────────────────────────────────────────────────
export function Select({ children, style = {}, ...props }) {
  return (
    <select
      {...props}
      style={{
        width: '100%', padding: '10px 14px',
        background: 'var(--surface-2)', border: '1.5px solid var(--border)',
        borderRadius: 'var(--radius-sm)',
        color: props.value ? 'var(--text)' : 'var(--muted)',
        fontSize: 13, fontFamily: 'var(--font-mono)',
        outline: 'none', cursor: 'pointer', ...style,
      }}
    >
      {children}
    </select>
  );
}

// ── Button ────────────────────────────────────────────────────
const BTN_VARIANTS = {
  primary: { background: 'var(--accent)',          color: '#0c0c0f',      border: 'none' },
  ghost:   { background: 'var(--surface-2)',        color: 'var(--muted)', border: '1px solid var(--border)' },
  danger:  { background: 'rgba(248,113,113,0.1)',   color: 'var(--warn)',  border: '1px solid rgba(248,113,113,0.28)' },
};

export function Button({ children, variant = 'primary', loading = false, style = {}, ...props }) {
  const v = BTN_VARIANTS[variant] ?? BTN_VARIANTS.primary;
  return (
    <button
      {...props}
      disabled={loading || props.disabled}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        padding: '10px 18px', borderRadius: 'var(--radius-sm)',
        ...v, fontSize: 13, fontWeight: 700,
        fontFamily: 'var(--font-display)',
        cursor: loading || props.disabled ? 'not-allowed' : 'pointer',
        opacity: loading || props.disabled ? 0.42 : 1,
        transition: 'opacity 0.15s, transform 0.1s',
        whiteSpace: 'nowrap',
        ...style,
      }}
    >
      {loading ? '…' : children}
    </button>
  );
}

// ── StatCard ──────────────────────────────────────────────────
export function StatCard({ label, value, accent }) {
  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius)', padding: '18px 22px',
    }}>
      <div style={{
        fontSize: 10, fontWeight: 700, letterSpacing: '0.13em',
        color: 'var(--muted)', fontFamily: 'var(--font-mono)',
        textTransform: 'uppercase', marginBottom: 10,
      }}>
        {label}
      </div>
      <div style={{
        fontSize: 24, fontWeight: 800, letterSpacing: '-0.03em',
        color: accent ?? 'var(--text)', fontFamily: 'var(--font-mono)',
      }}>
        {value}
      </div>
    </div>
  );
}

// ── EmptyState ────────────────────────────────────────────────
export function EmptyState({ icon = '◌', message }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '52px 20px', gap: 12,
      color: 'var(--faint)', fontFamily: 'var(--font-mono)', fontSize: 12,
      textAlign: 'center',
    }}>
      <span style={{ fontSize: 30, opacity: 0.3 }}>{icon}</span>
      {message}
    </div>
  );
}

// ── Spinner ───────────────────────────────────────────────────
export function Spinner({ size = 20 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      border: '2px solid var(--border)', borderTopColor: 'var(--accent)',
      animation: 'ts-spin 0.6s linear infinite', flexShrink: 0,
    }} />
  );
}

// ── ErrorBanner ───────────────────────────────────────────────
export function ErrorBanner({ message, onDismiss }) {
  if (!message) return null;
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
      background: 'rgba(248,113,113,0.09)', border: '1px solid rgba(248,113,113,0.28)',
      borderRadius: 'var(--radius-sm)', padding: '10px 14px',
      color: 'var(--warn)', fontSize: 12, fontFamily: 'var(--font-mono)', marginBottom: 20,
    }}>
      <span>⚠ {message}</span>
      {onDismiss && (
        <button onClick={onDismiss} style={{
          background: 'none', border: 'none', color: 'var(--warn)',
          cursor: 'pointer', fontSize: 15, lineHeight: 1, padding: '0 2px',
        }}>✕</button>
      )}
    </div>
  );
}

// ── Tabs ──────────────────────────────────────────────────────
export function Tabs({ tabs, active, onChange }) {
  return (
    <div style={{
      display: 'flex', borderBottom: '1px solid var(--border)',
      marginBottom: 24, gap: 0,
    }}>
      {tabs.map((t) => (
        <button
          key={t}
          onClick={() => onChange(t)}
          style={{
            padding: '12px 18px', background: 'transparent', border: 'none',
            borderBottom: `2px solid ${active === t ? 'var(--accent)' : 'transparent'}`,
            color: active === t ? 'var(--accent)' : 'var(--muted)',
            fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: '0.1em',
            cursor: 'pointer', transition: 'all 0.15s', marginBottom: -1,
          }}
        >
          {t}
        </button>
      ))}
    </div>
  );
}

// ── ConfirmButton — two-click delete pattern ──────────────────
export function ConfirmButton({ label = 'Delete', confirmLabel = 'Sure?', onConfirm, style = {} }) {
  const [confirm, setConfirm] = useState(false);
  return (
    <Button
      variant="danger"
      onClick={() => confirm ? onConfirm() : setConfirm(true)}
      onMouseLeave={() => setConfirm(false)}
      style={{ fontSize: 12, padding: '7px 14px', ...style }}
    >
      {confirm ? confirmLabel : label}
    </Button>
  );
}
