import { useState } from 'react';
import { Avatar } from './ui.jsx';

export default function ExpenseCard({ expense, users = [], onDelete }) {
  const [hovered,    setHovered]    = useState(false);
  const [confirming, setConfirming] = useState(false);

  const userName   = expense.user_name ?? users.find((u) => u.id === expense.user_id)?.name ?? 'Unknown';
  const colorIndex = users.findIndex((u) => u.id === expense.user_id);
  const dateStr    = new Date(expense.created_at).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short',
  });

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setConfirming(false); }}
      style={{
        display: 'flex', alignItems: 'center', gap: 14,
        padding: '12px 16px',
        background: hovered ? 'var(--surface-2)' : 'var(--surface)',
        border: `1px solid ${hovered ? 'var(--border-hi)' : 'var(--border)'}`,
        borderRadius: 'var(--radius)',
        transition: 'background 0.12s, border-color 0.12s',
      }}
    >
      {/* Icon */}
      <div style={{
        width: 38, height: 38, borderRadius: 11, flexShrink: 0,
        background: 'var(--accent-dim)',
        border: '1px solid rgba(126,232,162,0.15)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
      }}>🧾</div>

      {/* Description + meta */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 14, fontWeight: 600, color: 'var(--text)',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {expense.description}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
          <Avatar name={userName} index={colorIndex < 0 ? 0 : colorIndex} size={16} />
          <span style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>
            {userName} · {dateStr}
          </span>
        </div>
      </div>

      {/* Amount */}
      <div style={{
        fontSize: 15, fontWeight: 700, color: 'var(--accent)',
        fontFamily: 'var(--font-mono)', flexShrink: 0,
      }}>
        ₹{Number(expense.amount).toLocaleString('en-IN', {
          minimumFractionDigits: 2, maximumFractionDigits: 2,
        })}
      </div>

      {/* Delete */}
      {onDelete && (
        <button
          title={confirming ? 'Click again to confirm' : 'Delete'}
          onClick={() => confirming ? onDelete() : setConfirming(true)}
          style={{
            marginLeft: 4, width: 28, height: 28, flexShrink: 0,
            borderRadius: 'var(--radius-xs)',
            border: `1px solid ${confirming ? 'var(--warn)' : 'transparent'}`,
            background: confirming ? 'rgba(248,113,113,0.12)' : 'transparent',
            color: confirming ? 'var(--warn)' : 'var(--faint)',
            fontSize: 12, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.15s',
          }}
        >
          {confirming ? '!' : '✕'}
        </button>
      )}
    </div>
  );
}
