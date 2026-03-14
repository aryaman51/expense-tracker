import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { users as userStore, trips as tripStore, fmt } from '../utils/store.js';
import {
  Card, SectionLabel, StatCard, Button, EmptyState, Spinner, ErrorBanner,
} from '../components/ui.jsx';

export default function Dashboard() {
  const navigate  = useNavigate();
  const [userData, setUserData] = useState([]);
  const [tripData, setTripData] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [u, t] = await Promise.all([userStore.list(), tripStore.list()]);
      setUserData(u);
      setTripData(t.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDeleteTrip = async (e, id) => {
    e.stopPropagation();
    try {
      await tripStore.delete(id);
      setTripData((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      setError(err.message);
    }
  };

  const grandTotal    = tripData.reduce((s, t) => s + (t.total_amount ?? 0), 0);
  const totalExpenses = tripData.reduce((s, t) => s + (t.expense_count ?? 0), 0);

  return (
    <div className="page-enter" style={{ maxWidth: 780, margin: '0 auto', padding: '88px 24px 60px' }}>

      {/* Header */}
      <div style={{ marginBottom: 36 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.04em', marginBottom: 6 }}>
          Dashboard
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: 13, fontFamily: 'var(--font-mono)' }}>
          Overview across all your trips
        </p>
      </div>

      <ErrorBanner message={error} onDismiss={() => setError(null)} />

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 32 }}>
        <StatCard label="Total trips"    value={tripData.length}    accent="var(--accent-2)" />
        <StatCard label="Total spent"    value={fmt(grandTotal)}    accent="var(--accent)" />
        <StatCard label="Total expenses" value={totalExpenses} />
      </div>

      {/* Quick actions */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 32 }}>
        <Button onClick={() => navigate('/trips')} style={{ flex: 1 }}>
          ✈ Manage Trips
        </Button>
        <Button variant="ghost" onClick={() => navigate('/users')} style={{ flex: 1 }}>
          ◈ Manage People
        </Button>
      </div>

      {/* Recent trips */}
      <SectionLabel>Recent Trips</SectionLabel>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
          <Spinner />
        </div>
      ) : tripData.length === 0 ? (
        <EmptyState icon="✈" message="No trips yet. Head to Trips to create one." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {tripData.slice(0, 5).map((trip) => (
            <TripRow
              key={trip.id}
              trip={trip}
              onClick={() => navigate(`/trips/${trip.id}`)}
              onDelete={(e) => handleDeleteTrip(e, trip.id)}
            />
          ))}
          {tripData.length > 5 && (
            <button
              onClick={() => navigate('/trips')}
              style={{
                background: 'none', border: '1px dashed var(--border)', borderRadius: 'var(--radius)',
                color: 'var(--muted)', fontFamily: 'var(--font-mono)', fontSize: 12,
                padding: '12px', cursor: 'pointer', transition: 'border-color 0.15s',
              }}
            >
              + {tripData.length - 5} more trips → View all
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function TripRow({ trip, onClick, onDelete }) {
  const [hovered,    setHovered]    = useState(false);
  const [confirming, setConfirming] = useState(false);

  const date = new Date(trip.created_at).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  });

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setConfirming(false); }}
      style={{
        display: 'flex', alignItems: 'center', gap: 16,
        padding: '15px 20px',
        background: hovered ? 'var(--surface-2)' : 'var(--surface)',
        border: `1px solid ${hovered ? 'var(--border-hi)' : 'var(--border)'}`,
        borderRadius: 'var(--radius)', cursor: 'pointer', transition: 'all 0.15s',
      }}
    >
      <div style={{
        width: 42, height: 42, borderRadius: 12, flexShrink: 0,
        background: 'linear-gradient(135deg, rgba(126,232,162,0.12), rgba(91,138,245,0.12))',
        border: '1px solid rgba(126,232,162,0.18)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
      }}>✈</div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 3 }}>
          {trip.name}
        </div>
        <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>
          {trip.expense_count ?? 0} expenses · {date}
        </div>
      </div>

      <div style={{
        fontSize: 16, fontWeight: 800, color: 'var(--accent)',
        fontFamily: 'var(--font-mono)', letterSpacing: '-0.02em', flexShrink: 0,
      }}>
        {fmt(trip.total_amount ?? 0)}
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation();
          if (!confirming) { setConfirming(true); return; }
          onDelete(e);
        }}
        title={confirming ? 'Click again to confirm' : 'Delete trip'}
        style={{
          width: 30, height: 30, borderRadius: 'var(--radius-xs)', flexShrink: 0,
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
    </div>
  );
}
