import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  trips as tripStore, users as userStore,
  expenses as expenseStore, calcSettlements, fmt,
} from '../utils/store.js';
import ExpenseCard from '../components/ExpenseCard.jsx';
import { Avatar } from '../components/ui.jsx';
import {
  Card, SectionLabel, Input, Select, Button,
  StatCard, EmptyState, Spinner, ErrorBanner, Tabs,
} from '../components/ui.jsx';

const TABS = ['expenses', 'balances', 'settle up'];

export default function TripPage() {
  const { id }       = useParams();
  const navigate     = useNavigate();

  const [trip,       setTrip]       = useState(null);
  const [allUsers,   setAllUsers]   = useState([]);
  const [expenses,   setExpenses]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);
  const [tab,        setTab]        = useState('expenses');

  // form
  const [desc,       setDesc]       = useState('');
  const [amount,     setAmount]     = useState('');
  const [paidBy,     setPaidBy]     = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [t, u, e] = await Promise.all([
        tripStore.get(id),
        userStore.list(),
        expenseStore.list({ trip_id: id }),
      ]);
      setTrip(t);
      setAllUsers(u);
      setExpenses(e);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const handleAdd = async () => {
    if (!desc.trim() || !amount || !paidBy) return;
    try {
      setSubmitting(true);
      const exp = await expenseStore.create({
        trip_id:     id,
        user_id:     paidBy,
        amount:      parseFloat(amount),
        description: desc.trim(),
      });
      setExpenses((prev) => [exp, ...prev]);
      setDesc(''); setAmount(''); setPaidBy('');
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (expId) => {
    try {
      await expenseStore.delete(expId);
      setExpenses((prev) => prev.filter((e) => e.id !== expId));
    } catch (e) {
      setError(e.message);
    }
  };

  const total       = expenses.reduce((s, e) => s + Number(e.amount), 0);
  const settlements = calcSettlements(allUsers, expenses);

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 120 }}><Spinner /></div>
  );

  return (
    <div className="page-enter" style={{ maxWidth: 760, margin: '0 auto', padding: '88px 24px 60px' }}>

      {/* Breadcrumb */}
      <button
        onClick={() => navigate('/trips')}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--muted)', fontSize: 12, fontFamily: 'var(--font-mono)',
          marginBottom: 20, display: 'flex', alignItems: 'center', gap: 6, padding: 0,
        }}
      >
        ← Trips
      </button>

      <ErrorBanner message={error} onDismiss={() => setError(null)} />

      {/* Trip header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'flex-start', marginBottom: 28,
      }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.04em', marginBottom: 4 }}>
            {trip?.name}
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: 12, fontFamily: 'var(--font-mono)' }}>
            {expenses.length} expense{expenses.length !== 1 ? 's' : ''} · {allUsers.length} people
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{
            fontSize: 26, fontWeight: 800, color: 'var(--accent)',
            fontFamily: 'var(--font-mono)', letterSpacing: '-0.03em',
          }}>
            {fmt(total)}
          </div>
          <div style={{
            fontSize: 10, color: 'var(--muted)', fontFamily: 'var(--font-mono)',
            marginTop: 2, letterSpacing: '0.1em',
          }}>TOTAL</div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 28 }}>
        <StatCard label="Expenses"      value={expenses.length} />
        <StatCard label="Per person"    value={allUsers.length ? fmt(total / allUsers.length) : '—'} accent="var(--accent-2)" />
        <StatCard label="To settle"     value={settlements.length} />
      </div>

      {/* Add expense */}
      <Card style={{ marginBottom: 28 }}>
        <SectionLabel>Add Expense</SectionLabel>
        {allUsers.length === 0 ? (
          <p style={{ fontSize: 12, color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>
            Add people on the{' '}
            <button
              onClick={() => navigate('/users')}
              style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: 12 }}
            >
              People page
            </button>{' '}
            first.
          </p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: 10 }}>
            <Input
              placeholder="What was it for?"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            />
            <Input
              type="number"
              placeholder="₹ Amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <Select value={paidBy} onChange={(e) => setPaidBy(e.target.value)}>
              <option value="">Paid by</option>
              {allUsers.map((u) => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </Select>
            <Button
              onClick={handleAdd}
              loading={submitting}
              disabled={!desc.trim() || !amount || !paidBy}
            >
              Add
            </Button>
          </div>
        )}
      </Card>

      {/* Tabs */}
      <Tabs tabs={TABS} active={tab} onChange={setTab} />

      {/* Tab: Expenses */}
      {tab === 'expenses' && (
        expenses.length === 0
          ? <EmptyState icon="🧾" message="No expenses yet. Add one above." />
          : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {expenses.map((e) => (
                <ExpenseCard
                  key={e.id}
                  expense={e}
                  users={allUsers}
                  onDelete={() => handleDelete(e.id)}
                />
              ))}
            </div>
          )
      )}

      {/* Tab: Balances */}
      {tab === 'balances' && (
        allUsers.length === 0
          ? <EmptyState icon="◈" message="No people added yet." />
          : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {allUsers.map((u, i) => {
                const paid    = expenses.filter((e) => e.user_id === u.id).reduce((s, e) => s + Number(e.amount), 0);
                const share   = allUsers.length ? total / allUsers.length : 0;
                const balance = paid - share;
                return (
                  <div key={u.id} style={{
                    display: 'flex', alignItems: 'center', gap: 14,
                    padding: '14px 18px',
                    background: 'var(--surface)', border: '1px solid var(--border)',
                    borderRadius: 'var(--radius)',
                  }}>
                    <Avatar name={u.name} index={i} size={40} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 3 }}>{u.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>
                        Paid {fmt(paid)} · Share {fmt(share)}
                      </div>
                    </div>
                    <div style={{
                      fontSize: 15, fontWeight: 800, fontFamily: 'var(--font-mono)',
                      color: balance >= 0 ? 'var(--accent)' : 'var(--warn)',
                    }}>
                      {balance >= 0 ? '+' : ''}{fmt(balance)}
                    </div>
                  </div>
                );
              })}
            </div>
          )
      )}

      {/* Tab: Settle Up */}
      {tab === 'settle up' && (
        settlements.length === 0
          ? <EmptyState icon="✓" message={allUsers.length < 2 ? 'Add at least 2 people to calculate settlements.' : "Everyone's square! 🎉"} />
          : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {settlements.map((s, i) => {
                const from = allUsers.find((u) => u.id === s.from);
                const to   = allUsers.find((u) => u.id === s.to);
                const fi   = allUsers.findIndex((u) => u.id === s.from);
                const ti   = allUsers.findIndex((u) => u.id === s.to);
                return (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '14px 18px',
                    background: 'var(--surface)', border: '1px solid var(--border)',
                    borderRadius: 'var(--radius)',
                  }}>
                    <Avatar name={from?.name ?? '?'} index={fi} size={36} />
                    <div style={{ flex: 1 }}>
                      <span style={{ fontWeight: 600, fontSize: 14 }}>{from?.name}</span>
                      <span style={{ margin: '0 10px', color: 'var(--muted)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>pays</span>
                      <span style={{ fontWeight: 600, fontSize: 14 }}>{to?.name}</span>
                    </div>
                    <Avatar name={to?.name ?? '?'} index={ti} size={36} />
                    <div style={{
                      marginLeft: 10, fontSize: 16, fontWeight: 800,
                      color: 'var(--gold)', fontFamily: 'var(--font-mono)',
                    }}>
                      {fmt(s.amount)}
                    </div>
                  </div>
                );
              })}
            </div>
          )
      )}
    </div>
  );
}
