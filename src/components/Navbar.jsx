import { NavLink, useLocation } from 'react-router-dom';

const LINKS = [
  { to: '/',      label: 'Dashboard', icon: '⬡' },
  { to: '/trips', label: 'Trips',     icon: '✈' },
  { to: '/users', label: 'People',    icon: '◈' },
];

export default function Navbar() {
  const { pathname } = useLocation();

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200,
      height: 60,
      background: 'rgba(12,12,15,0.9)',
      backdropFilter: 'blur(18px)',
      WebkitBackdropFilter: 'blur(18px)',
      borderBottom: '1px solid var(--border)',
      display: 'flex', alignItems: 'center',
      padding: '0 28px',
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginRight: 32, flexShrink: 0 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 10,
          background: 'linear-gradient(135deg, var(--accent), var(--accent-2))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 15, fontWeight: 800, color: '#0c0c0f',
          fontFamily: 'var(--font-mono)',
        }}>₹</div>
        <span style={{
          fontSize: 15, fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--text)',
        }}>TripSpend</span>
      </div>

      {/* Links */}
      <div style={{ display: 'flex', gap: 2 }}>
        {LINKS.map(({ to, label, icon }) => {
          const active = to === '/' ? pathname === '/' : pathname.startsWith(to);
          return (
            <NavLink
              key={to}
              to={to}
              style={{
                display: 'flex', alignItems: 'center', gap: 7,
                padding: '6px 13px', borderRadius: 'var(--radius-sm)',
                fontSize: 13, fontWeight: 600, textDecoration: 'none',
                color:      active ? 'var(--accent)' : 'var(--muted)',
                background: active ? 'var(--accent-dim)' : 'transparent',
                transition: 'all 0.15s',
              }}
            >
              <span style={{ fontSize: 13 }}>{icon}</span>
              {label}
            </NavLink>
          );
        })}
      </div>

      {/* Right — live dot */}
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 7 }}>
        <span style={{
          width: 7, height: 7, borderRadius: '50%',
          background: 'var(--accent)', boxShadow: '0 0 7px var(--accent)',
          display: 'inline-block',
        }} />
        <span style={{
          fontSize: 10, color: 'var(--muted)',
          fontFamily: 'var(--font-mono)', letterSpacing: '0.08em',
        }}>LOCAL</span>
      </div>
    </nav>
  );
}
