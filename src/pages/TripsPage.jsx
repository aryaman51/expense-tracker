import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { trips as tripStore, fmt } from '../utils/store.js';
import {
  Card, SectionLabel, Input, Button,
  StatCard, EmptyState, Spinner, ErrorBanner,
} from '../components/ui.jsx';

export default function TripsPage() {
  const navigate    = useNavigate();
  const [tripData,  setTripData]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);
  const [newName,   setNewName]   = useState('');
  const [adding,    setAdding]    = useState(false);
  const [editId,    setEditId]    = useState(null);
  const [editName,  setEditName]  = useState('');
  const [saving,    setSaving]    = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const t = await tripStore.list();
      setTripData(t.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    try {
      setAdding(true);
      const trip = await tripStore.create(newName.trim());
      setNewName('');
      navigate(`/trips/${trip.id}`);
    } catch (e) {
      setError(e.message);
    } finally {
      setAdding(false);
    }
  };

  const handleSave = async () => {
    if (!editName.trim()) return;
    try {
      setSaving(true);
      const updated = await tripStore.update(editId, editName.trim());
      setTripData((prev) => prev.map((t) => t.id === editId ? { ...t, ...updated } : t));
      setEditId(null); setEditName('');
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await tripStore.delete(id);
      setTripData((prev) => prev.filter((t) => t.id !== id));
    } catch (e) {
      setError(e.message);
    }
  };

  const grandTotal = tripData.reduce((s, t) => s + (t.total_amount ?? 0), 0);

  return (
    <div className="page-enter" style={{ maxWidth: 760, margin: '0 auto', padding: '88px 24px 60px' }}>

      <div style={{ marginBottom: 36 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.04em', marginBottom: 6 }}>Trips</h1>
        <p style={{ color: 'var(--muted)', fontSize: 13, fontFamily: 'var(--font-mono)' }}>
          Each trip is its own expense group
        </p>
      </div>

      <ErrorBanner message={error} onDismiss={() => setError(null)} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14, marginBottom: 28 }}>
        <StatCard label="Trips"       value={tripData.length} accent="var(--accent-2)" />
        <StatCard label="Grand total" value={fmt(grandTotal)} accent="var(--accent)" />
      </div>

      {/* Create */}
      <Card style={{ marginBottom: 28 }}>
        <SectionLabel>New Trip</SectionLabel>
        <div style={{ display: 'flex', gap: 10 }}>
          <Input
            placeholder="e.g. Goa 2025, Europe Backpacking…"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
          />
          <Button onClick={handleCreate} loading={adding} disabled={!newName.trim()}>
            Create
          </Button>
        </div>
      </Card>

      <SectionLabel>All Trips ({tripData.length})</SectionLabel>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}><Spinner /></div>
      ) : tripData.length === 0 ? (
        <EmptyState icon="✈" message="No trips yet. Create one above." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {tripData.map((trip) => {
            const isEditing = editId === trip.id;
            const date = new Date(trip.created_at).toLocaleDateString('en-IN', {
              day: 'numeric', month: 'short', year: 'numeric',
            });
            return (
              <div
                key={trip.id}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '15px 18px',
                  background: 'var(--surface)',
                  border: `1px solid ${isEditing ? 'rgba(126,232,162,0.3)' : 'var(--border)'}`,
                  borderRadius: 'var(--radius)', transition: 'border-color 0.15s',
                }}
              >
                <div style={{
                  width: 40, height: 40, borderRadius: 11, flexShrink: 0,
                  background: 'linear-gradient(135deg, rgba(126,232,162,0.1), rgba(91,138,245,0.1))',
                  border: '1px solid rgba(126,232,162,0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
                }}>✈</div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  {isEditing ? (
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter')  handleSave();
                        if (e.key === 'Escape') { setEditId(null); setEditName(''); }
                      }}
                      autoFocus
                      style={{ fontSize: 13 }}
                    />
                  ) : (
                    <>
                      <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 3 }}>{trip.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>
                        {trip.expense_count ?? 0} expenses · {date}
                      </div>
                    </>
                  )}
                </div>

                {!isEditing && (
                  <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--accent)', fontFamily: 'var(--font-mono)', flexShrink: 0 }}>
                    {fmt(trip.total_amount ?? 0)}
                  </div>
                )}

                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                  {isEditing ? (
                    <>
                      <Button onClick={handleSave} loading={saving} style={{ fontSize: 12, padding: '7px 14px' }}>Save</Button>
                      <Button variant="ghost" onClick={() => { setEditId(null); setEditName(''); }} style={{ fontSize: 12, padding: '7px 14px' }}>Cancel</Button>
                    </>
                  ) : (
                    <>
                      <Button variant="ghost" onClick={() => navigate(`/trips/${trip.id}`)} style={{ fontSize: 12, padding: '7px 14px' }}>Open</Button>
                      <Button variant="ghost" onClick={() => { setEditId(trip.id); setEditName(trip.name); }} style={{ fontSize: 12, padding: '7px 14px' }}>Edit</Button>
                      <DeleteBtn onDelete={() => handleDelete(trip.id)} />
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function DeleteBtn({ onDelete }) {
  const [confirm, setConfirm] = useState(false);
  return (
    <Button
      variant="danger"
      onClick={() => confirm ? onDelete() : setConfirm(true)}
      onMouseLeave={() => setConfirm(false)}
      style={{ fontSize: 12, padding: '7px 14px' }}
    >
      {confirm ? 'Sure?' : 'Delete'}
    </Button>
  );
}
