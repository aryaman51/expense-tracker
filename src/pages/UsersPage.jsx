import { useState, useEffect, useCallback } from 'react';
import { users as userStore } from '../utils/store.js';
import { Avatar } from '../components/ui.jsx';
import {
  Card, SectionLabel, Input, Button,
  EmptyState, Spinner, ErrorBanner,
} from '../components/ui.jsx';

export default function UsersPage() {
  const [userData, setUserData] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);
  const [newName,  setNewName]  = useState('');
  const [adding,   setAdding]   = useState(false);
  const [editId,   setEditId]   = useState(null);
  const [editName, setEditName] = useState('');
  const [saving,   setSaving]   = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setUserData(await userStore.list());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleAdd = async () => {
    if (!newName.trim()) return;
    try {
      setAdding(true);
      const u = await userStore.create(newName.trim());
      setUserData((prev) => [...prev, u]);
      setNewName('');
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
      const updated = await userStore.update(editId, editName.trim());
      setUserData((prev) => prev.map((u) => u.id === editId ? updated : u));
      setEditId(null); setEditName('');
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await userStore.delete(id);
      setUserData((prev) => prev.filter((u) => u.id !== id));
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div className="page-enter" style={{ maxWidth: 680, margin: '0 auto', padding: '88px 24px 60px' }}>

      <div style={{ marginBottom: 36 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.04em', marginBottom: 6 }}>People</h1>
        <p style={{ color: 'var(--muted)', fontSize: 13, fontFamily: 'var(--font-mono)' }}>
          Everyone who splits expenses with you
        </p>
      </div>

      <ErrorBanner message={error} onDismiss={() => setError(null)} />

      {/* Add */}
      <Card style={{ marginBottom: 28 }}>
        <SectionLabel>Add Person</SectionLabel>
        <div style={{ display: 'flex', gap: 10 }}>
          <Input
            placeholder="Full name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          />
          <Button onClick={handleAdd} loading={adding} disabled={!newName.trim()}>
            Add
          </Button>
        </div>
      </Card>

      <SectionLabel>All People ({userData.length})</SectionLabel>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><Spinner /></div>
      ) : userData.length === 0 ? (
        <EmptyState icon="◈" message="No people yet. Add someone above." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {userData.map((u, i) => {
            const isEditing = editId === u.id;
            const date = new Date(u.created_at).toLocaleDateString('en-IN', {
              day: 'numeric', month: 'short', year: 'numeric',
            });

            return (
              <div
                key={u.id}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '14px 18px',
                  background: 'var(--surface)',
                  border: `1px solid ${isEditing ? 'rgba(126,232,162,0.3)' : 'var(--border)'}`,
                  borderRadius: 'var(--radius)', transition: 'border-color 0.15s',
                }}
              >
                <Avatar name={u.name} index={i} size={42} />

                <div style={{ flex: 1 }}>
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
                      <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>{u.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>
                        Added {date}
                      </div>
                    </>
                  )}
                </div>

                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                  {isEditing ? (
                    <>
                      <Button onClick={handleSave} loading={saving} style={{ fontSize: 12, padding: '7px 14px' }}>Save</Button>
                      <Button variant="ghost" onClick={() => { setEditId(null); setEditName(''); }} style={{ fontSize: 12, padding: '7px 14px' }}>Cancel</Button>
                    </>
                  ) : (
                    <>
                      <Button variant="ghost" onClick={() => { setEditId(u.id); setEditName(u.name); }} style={{ fontSize: 12, padding: '7px 14px' }}>Edit</Button>
                      <DeleteBtn onDelete={() => handleDelete(u.id)} />
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
