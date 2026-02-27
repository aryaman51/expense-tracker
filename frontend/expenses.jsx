import { useState, useEffect, useRef } from "react";

// ─── MOCK DATA ────────────────────────────────────────────────────────────────
const MOCK_USER = { username: "rahul_dev", password: "password123" };

const CATEGORIES = [
  { id: "food", label: "Food", emoji: "🍔" },
  { id: "travel", label: "Travel", emoji: "✈️" },
  { id: "stay", label: "Stay", emoji: "🏨" },
  { id: "entertainment", label: "Entertainment", emoji: "🎉" },
  { id: "shopping", label: "Shopping", emoji: "🛍️" },
  { id: "infra", label: "Infra/Cloud", emoji: "☁️" },
  { id: "misc", label: "Misc", emoji: "📦" },
];

const initPeople = [
  { id: "p1", name: "Rahul", email: "rahul@xp.dev" },
  { id: "p2", name: "Sneha", email: "sneha@xp.dev" },
  { id: "p3", name: "Arjun", email: "arjun@xp.dev" },
];

const initEvents = [
  { id: "e1", name: "AWS Summit Trip", description: "Bangalore summit + stay", people: ["p1", "p2", "p3"], createdAt: "2025-02-01", status: "active" },
  { id: "e2", name: "Infra Migration Q1", description: "Cloud migration project expenses", people: ["p1", "p3"], createdAt: "2025-01-15", status: "settled" },
];

const initExpenses = [
  { id: "x1", eventId: "e1", description: "Flight BOM→BLR", amount: 8400, category: "travel", paidBy: "p1", split: { type: "equal", people: ["p1", "p2", "p3"] }, date: "2025-02-10" },
  { id: "x2", eventId: "e1", description: "Hotel 2 nights", amount: 12000, category: "stay", paidBy: "p2", split: { type: "equal", people: ["p1", "p2", "p3"] }, date: "2025-02-10" },
  { id: "x3", eventId: "e1", description: "Team dinner", amount: 3200, category: "food", paidBy: "p1", split: { type: "custom", people: ["p1", "p2", "p3"], amounts: { p1: 1000, p2: 1200, p3: 1000 } }, date: "2025-02-11" },
  { id: "x4", eventId: "e2", description: "AWS Reserved Instances", amount: 45000, category: "infra", paidBy: "p1", split: { type: "percentage", people: ["p1", "p3"], percentages: { p1: 60, p3: 40 } }, date: "2025-01-16" },
  { id: "x5", eventId: "e2", description: "Domain + SSL certs", amount: 2800, category: "infra", paidBy: "p3", split: { type: "equal", people: ["p1", "p3"] }, date: "2025-01-17" },
];

// ─── UTILS ────────────────────────────────────────────────────────────────────
const fmt = (n) => `₹${Number(n).toLocaleString("en-IN")}`;

function computeBalances(people, expenses) {
  const balances = {};
  people.forEach((p) => (balances[p.id] = 0));

  expenses.forEach((exp) => {
    const { amount, paidBy, split } = exp;
    if (!balances.hasOwnProperty(paidBy)) return;

    if (split.type === "equal") {
      const share = amount / split.people.length;
      split.people.forEach((pid) => {
        if (balances.hasOwnProperty(pid)) balances[pid] -= share;
      });
      balances[paidBy] += amount;
    } else if (split.type === "custom") {
      Object.entries(split.amounts).forEach(([pid, amt]) => {
        if (balances.hasOwnProperty(pid)) balances[pid] -= amt;
      });
      balances[paidBy] += amount;
    } else if (split.type === "percentage") {
      Object.entries(split.percentages).forEach(([pid, pct]) => {
        if (balances.hasOwnProperty(pid)) balances[pid] -= (amount * pct) / 100;
      });
      balances[paidBy] += amount;
    }
  });

  return balances;
}

function computeSettlements(balances, people) {
  const owes = [];
  const owns = [];
  Object.entries(balances).forEach(([pid, bal]) => {
    if (bal < -0.01) owes.push({ id: pid, amount: -bal });
    else if (bal > 0.01) owns.push({ id: pid, amount: bal });
  });

  const settlements = [];
  const o = owes.map((x) => ({ ...x }));
  const r = owns.map((x) => ({ ...x }));

  let i = 0, j = 0;
  while (i < o.length && j < r.length) {
    const transfer = Math.min(o[i].amount, r[j].amount);
    settlements.push({ from: o[i].id, to: r[j].id, amount: transfer });
    o[i].amount -= transfer;
    r[j].amount -= transfer;
    if (o[i].amount < 0.01) i++;
    if (r[j].amount < 0.01) j++;
  }
  return settlements;
}

function getPersonName(people, id) {
  return people.find((p) => p.id === id)?.name || id;
}

// ─── STYLES ───────────────────────────────────────────────────────────────────
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:wght@300;400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg: #0c0c0e;
    --surface: #141416;
    --surface2: #1c1c20;
    --border: #2a2a30;
    --accent: #f59e0b;
    --accent2: #fb923c;
    --text: #f0f0f0;
    --muted: #666674;
    --green: #34d399;
    --red: #f87171;
    --font-display: 'Syne', sans-serif;
    --font-mono: 'DM Mono', monospace;
  }

  html, body, #root { height: 100%; }
  body { background: var(--bg); color: var(--text); font-family: var(--font-mono); -webkit-font-smoothing: antialiased; }

  ::selection { background: var(--accent); color: #000; }
  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: var(--bg); }
  ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }

  .app { display: flex; height: 100vh; overflow: hidden; }

  /* ── AUTH ── */
  .auth-wrap {
    min-height: 100vh; display: flex; align-items: center; justify-content: center;
    background: var(--bg);
    background-image:
      radial-gradient(ellipse 60% 50% at 20% 20%, rgba(245,158,11,0.08) 0%, transparent 60%),
      radial-gradient(ellipse 40% 60% at 80% 80%, rgba(251,146,60,0.06) 0%, transparent 60%);
  }
  .auth-card {
    width: 400px; padding: 48px 40px;
    background: var(--surface);
    border: 1px solid var(--border);
    position: relative; overflow: hidden;
  }
  .auth-card::before {
    content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px;
    background: linear-gradient(90deg, var(--accent), var(--accent2));
  }
  .auth-logo {
    font-family: var(--font-display); font-size: 28px; font-weight: 800;
    letter-spacing: -1px; margin-bottom: 8px;
  }
  .auth-logo span { color: var(--accent); }
  .auth-sub { color: var(--muted); font-size: 13px; margin-bottom: 36px; }
  .auth-label { font-size: 11px; color: var(--muted); letter-spacing: 1px; text-transform: uppercase; margin-bottom: 8px; display: block; }
  .auth-input {
    width: 100%; background: var(--bg); border: 1px solid var(--border);
    color: var(--text); font-family: var(--font-mono); font-size: 14px;
    padding: 12px 16px; margin-bottom: 20px; outline: none;
    transition: border-color 0.2s;
  }
  .auth-input:focus { border-color: var(--accent); }
  .auth-btn {
    width: 100%; padding: 14px;
    background: var(--accent); color: #000;
    font-family: var(--font-display); font-weight: 700; font-size: 15px;
    letter-spacing: 0.5px; border: none; cursor: pointer;
    transition: opacity 0.2s, transform 0.1s;
  }
  .auth-btn:hover { opacity: 0.9; }
  .auth-btn:active { transform: scale(0.99); }
  .auth-err { color: var(--red); font-size: 12px; margin-bottom: 16px; }
  .auth-toggle { margin-top: 20px; text-align: center; font-size: 12px; color: var(--muted); }
  .auth-toggle button { background: none; border: none; color: var(--accent); cursor: pointer; font-family: var(--font-mono); font-size: 12px; }

  /* ── SIDEBAR ── */
  .sidebar {
    width: 220px; min-width: 220px; background: var(--surface); border-right: 1px solid var(--border);
    display: flex; flex-direction: column; padding: 24px 0;
  }
  .sidebar-logo {
    font-family: var(--font-display); font-size: 20px; font-weight: 800;
    letter-spacing: -0.5px; padding: 0 24px 28px;
    border-bottom: 1px solid var(--border);
  }
  .sidebar-logo span { color: var(--accent); }
  .sidebar-nav { flex: 1; padding: 16px 0; }
  .nav-item {
    display: flex; align-items: center; gap: 12px;
    padding: 11px 24px; font-size: 13px; cursor: pointer;
    color: var(--muted); transition: color 0.15s, background 0.15s;
    border-left: 2px solid transparent;
    font-family: var(--font-mono);
  }
  .nav-item:hover { color: var(--text); background: var(--surface2); }
  .nav-item.active { color: var(--accent); border-left-color: var(--accent); background: rgba(245,158,11,0.06); }
  .nav-icon { font-size: 16px; width: 20px; text-align: center; }
  .sidebar-user {
    padding: 16px 24px; border-top: 1px solid var(--border);
    font-size: 12px; color: var(--muted);
  }
  .sidebar-user strong { display: block; color: var(--text); font-size: 13px; margin-bottom: 4px; }
  .logout-btn {
    background: none; border: none; color: var(--muted); font-family: var(--font-mono);
    font-size: 11px; cursor: pointer; padding: 0; margin-top: 8px;
    text-decoration: underline;
  }
  .logout-btn:hover { color: var(--red); }

  /* ── MAIN ── */
  .main { flex: 1; overflow-y: auto; display: flex; flex-direction: column; }
  .topbar {
    padding: 20px 32px; border-bottom: 1px solid var(--border);
    display: flex; align-items: center; justify-content: space-between;
    background: var(--surface); position: sticky; top: 0; z-index: 10;
  }
  .topbar-title { font-family: var(--font-display); font-size: 22px; font-weight: 700; letter-spacing: -0.5px; }
  .page-content { padding: 32px; flex: 1; }

  /* ── CARDS ── */
  .stat-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 32px; }
  .stat-card {
    background: var(--surface); border: 1px solid var(--border); padding: 20px 22px;
    position: relative; overflow: hidden;
  }
  .stat-card::after {
    content: ''; position: absolute; bottom: 0; left: 0; right: 0; height: 1px;
    background: linear-gradient(90deg, var(--accent), transparent);
    opacity: 0.4;
  }
  .stat-label { font-size: 10px; color: var(--muted); letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 10px; }
  .stat-value { font-family: var(--font-display); font-size: 26px; font-weight: 800; letter-spacing: -1px; }
  .stat-sub { font-size: 11px; color: var(--muted); margin-top: 4px; }

  /* ── SECTION ── */
  .section-head {
    display: flex; align-items: center; justify-content: space-between;
    margin-bottom: 16px;
  }
  .section-title { font-family: var(--font-display); font-size: 16px; font-weight: 700; }
  .btn {
    padding: 9px 18px; font-family: var(--font-display); font-weight: 700;
    font-size: 13px; cursor: pointer; border: none; transition: all 0.15s;
  }
  .btn-primary { background: var(--accent); color: #000; }
  .btn-primary:hover { opacity: 0.85; }
  .btn-ghost { background: var(--surface2); color: var(--text); border: 1px solid var(--border); }
  .btn-ghost:hover { border-color: var(--accent); color: var(--accent); }
  .btn-danger { background: transparent; color: var(--red); border: 1px solid var(--red); font-size: 11px; padding: 5px 10px; }
  .btn-danger:hover { background: rgba(248,113,113,0.1); }
  .btn-sm { padding: 6px 12px; font-size: 12px; }

  /* ── TABLES / LISTS ── */
  .card {
    background: var(--surface); border: 1px solid var(--border); overflow: hidden;
  }
  .card-row {
    display: flex; align-items: center; padding: 14px 20px;
    border-bottom: 1px solid var(--border); gap: 16px;
    transition: background 0.1s;
  }
  .card-row:last-child { border-bottom: none; }
  .card-row:hover { background: var(--surface2); }
  .row-icon { font-size: 20px; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; background: var(--surface2); flex-shrink: 0; }
  .row-main { flex: 1; min-width: 0; }
  .row-title { font-size: 14px; font-weight: 500; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .row-sub { font-size: 11px; color: var(--muted); margin-top: 2px; }
  .row-amount { font-family: var(--font-display); font-weight: 700; font-size: 16px; }
  .row-actions { display: flex; gap: 8px; }

  .tag {
    display: inline-flex; align-items: center; gap: 4px;
    padding: 3px 10px; font-size: 10px; letter-spacing: 0.5px;
    background: var(--surface2); border: 1px solid var(--border);
    border-radius: 999px; color: var(--muted);
  }
  .tag-active { border-color: var(--green); color: var(--green); }
  .tag-settled { border-color: var(--muted); }

  /* ── CHART ── */
  .chart-wrap { background: var(--surface); border: 1px solid var(--border); padding: 20px 24px; }
  .mini-bar-row { display: flex; align-items: center; gap: 12px; margin-bottom: 10px; }
  .mini-bar-label { font-size: 11px; color: var(--muted); width: 80px; flex-shrink: 0; }
  .mini-bar-track { flex: 1; height: 6px; background: var(--surface2); }
  .mini-bar-fill { height: 100%; background: linear-gradient(90deg, var(--accent), var(--accent2)); transition: width 0.6s ease; }
  .mini-bar-val { font-size: 11px; color: var(--text); width: 70px; text-align: right; flex-shrink: 0; }

  /* ── MODAL ── */
  .modal-backdrop {
    position: fixed; inset: 0; background: rgba(0,0,0,0.75); z-index: 100;
    display: flex; align-items: center; justify-content: center;
    backdrop-filter: blur(4px);
    animation: fadeIn 0.15s ease;
  }
  .modal {
    background: var(--surface); border: 1px solid var(--border);
    width: 520px; max-height: 90vh; overflow-y: auto;
    position: relative; animation: slideUp 0.2s ease;
  }
  .modal::before {
    content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px;
    background: linear-gradient(90deg, var(--accent), var(--accent2));
  }
  .modal-head { padding: 24px 24px 16px; display: flex; justify-content: space-between; align-items: center; }
  .modal-title { font-family: var(--font-display); font-size: 18px; font-weight: 700; }
  .modal-close { background: none; border: none; color: var(--muted); font-size: 22px; cursor: pointer; line-height: 1; }
  .modal-close:hover { color: var(--text); }
  .modal-body { padding: 0 24px 24px; }

  .form-group { margin-bottom: 18px; }
  .form-label { font-size: 10px; color: var(--muted); letter-spacing: 1.2px; text-transform: uppercase; display: block; margin-bottom: 6px; }
  .form-input, .form-select, .form-textarea {
    width: 100%; background: var(--bg); border: 1px solid var(--border);
    color: var(--text); font-family: var(--font-mono); font-size: 13px;
    padding: 10px 14px; outline: none; transition: border-color 0.2s;
  }
  .form-input:focus, .form-select:focus, .form-textarea:focus { border-color: var(--accent); }
  .form-select option { background: var(--surface); }
  .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }

  .people-check-grid { display: flex; flex-wrap: wrap; gap: 8px; }
  .people-check {
    display: flex; align-items: center; gap: 8px;
    padding: 8px 14px; border: 1px solid var(--border);
    cursor: pointer; transition: all 0.15s; font-size: 12px;
  }
  .people-check.selected { border-color: var(--accent); color: var(--accent); background: rgba(245,158,11,0.08); }

  .split-section { margin-top: 16px; padding: 14px; background: var(--bg); border: 1px solid var(--border); }
  .split-type-tabs { display: flex; gap: 0; margin-bottom: 14px; }
  .split-tab {
    flex: 1; padding: 8px; font-size: 11px; letter-spacing: 0.5px; text-align: center;
    cursor: pointer; border: 1px solid var(--border); background: transparent; color: var(--muted);
    font-family: var(--font-mono); transition: all 0.15s;
  }
  .split-tab.active { background: var(--accent); color: #000; border-color: var(--accent); font-weight: 500; }

  .balance-pos { color: var(--green); }
  .balance-neg { color: var(--red); }
  .balance-zero { color: var(--muted); }

  .empty-state { text-align: center; padding: 48px; color: var(--muted); font-size: 13px; }
  .empty-icon { font-size: 36px; margin-bottom: 12px; }

  .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }

  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }

  .settlement-row {
    display: flex; align-items: center; justify-content: space-between;
    padding: 14px 20px; border-bottom: 1px solid var(--border);
  }
  .settlement-row:last-child { border-bottom: none; }
  .settle-arrow { color: var(--accent); font-size: 18px; margin: 0 12px; }

  .search-input {
    background: var(--surface2); border: 1px solid var(--border);
    color: var(--text); font-family: var(--font-mono); font-size: 13px;
    padding: 8px 14px; outline: none; width: 220px;
  }
  .search-input:focus { border-color: var(--accent); }

  .event-detail-back { display: flex; align-items: center; gap: 8px; cursor: pointer; color: var(--muted); font-size: 13px; margin-bottom: 24px; }
  .event-detail-back:hover { color: var(--accent); }
`;

// ─── COMPONENTS ───────────────────────────────────────────────────────────────

function Modal({ title, onClose, children }) {
  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-head">
          <span className="modal-title">{title}</span>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, color }) {
  return (
    <div className="stat-card">
      <div className="stat-label">{label}</div>
      <div className="stat-value" style={color ? { color } : {}}>{value}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  );
}

// ─── AUTH PAGE ────────────────────────────────────────────────────────────────
function AuthPage({ onLogin }) {
  const [mode, setMode] = useState("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [users, setUsers] = useState([MOCK_USER]);

  function handle() {
    setErr("");
    if (!username || !password) return setErr("All fields required.");
    if (mode === "login") {
      const u = users.find((u) => u.username === username && u.password === password);
      if (!u) return setErr("Invalid username or password.");
      onLogin(username);
    } else {
      if (users.find((u) => u.username === username)) return setErr("Username already taken.");
      if (password.length < 6) return setErr("Password must be at least 6 characters.");
      setUsers([...users, { username, password }]);
      onLogin(username);
    }
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="auth-logo">X<span>pense</span> Tracker</div>
        <div className="auth-sub">infra-grade expense management</div>
        {err && <div className="auth-err">⚠ {err}</div>}
        <label className="auth-label">Username</label>
        <input className="auth-input" placeholder="your_username" value={username} onChange={(e) => setUsername(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handle()} />
        <label className="auth-label">Password</label>
        <input className="auth-input" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handle()} />
        <button className="auth-btn" onClick={handle}>{mode === "login" ? "LOGIN" : "CREATE ACCOUNT"}</button>
        <div className="auth-toggle">
          {mode === "login" ? "New here?" : "Have an account?"}
          <button onClick={() => { setMode(mode === "login" ? "signup" : "login"); setErr(""); }}>
            {mode === "login" ? " Sign up" : " Log in"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
function Dashboard({ expenses, events, people }) {
  const total = expenses.reduce((s, e) => s + e.amount, 0);
  const thisMonth = expenses.filter((e) => e.date?.startsWith("2025-02")).reduce((s, e) => s + e.amount, 0);
  const activeEvents = events.filter((e) => e.status === "active").length;

  const catTotals = CATEGORIES.map((c) => ({
    ...c,
    total: expenses.filter((e) => e.category === c.id).reduce((s, x) => s + x.amount, 0),
  })).filter((c) => c.total > 0).sort((a, b) => b.total - a.total);

  const maxCat = catTotals[0]?.total || 1;

  const balances = computeBalances(people, expenses);

  return (
    <div className="page-content">
      <div className="stat-grid">
        <StatCard label="Total Spend" value={fmt(total)} sub="all time" />
        <StatCard label="This Month" value={fmt(thisMonth)} sub="Feb 2025" color="var(--accent)" />
        <StatCard label="Active Events" value={activeEvents} sub={`of ${events.length} total`} />
        <StatCard label="People" value={people.length} sub="in your network" />
      </div>

      <div className="grid-2">
        <div>
          <div className="section-head"><div className="section-title">Spend by Category</div></div>
          <div className="chart-wrap">
            {catTotals.length === 0 ? <div className="empty-state"><div>No expenses yet</div></div> :
              catTotals.map((c) => (
                <div className="mini-bar-row" key={c.id}>
                  <div className="mini-bar-label">{c.emoji} {c.label}</div>
                  <div className="mini-bar-track">
                    <div className="mini-bar-fill" style={{ width: `${(c.total / maxCat) * 100}%` }} />
                  </div>
                  <div className="mini-bar-val">{fmt(c.total)}</div>
                </div>
              ))
            }
          </div>
        </div>

        <div>
          <div className="section-head"><div className="section-title">Net Balances</div></div>
          <div className="card">
            {people.map((p) => {
              const bal = balances[p.id] || 0;
              return (
                <div className="card-row" key={p.id}>
                  <div className="row-icon">👤</div>
                  <div className="row-main">
                    <div className="row-title">{p.name}</div>
                    <div className="row-sub">{p.email}</div>
                  </div>
                  <div className={`row-amount ${bal > 0.01 ? "balance-pos" : bal < -0.01 ? "balance-neg" : "balance-zero"}`}>
                    {bal > 0.01 ? "+" : ""}{fmt(Math.abs(bal))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div style={{ marginTop: 24 }}>
        <div className="section-head"><div className="section-title">Recent Expenses</div></div>
        <div className="card">
          {expenses.slice(-5).reverse().map((exp) => {
            const cat = CATEGORIES.find((c) => c.id === exp.category);
            return (
              <div className="card-row" key={exp.id}>
                <div className="row-icon">{cat?.emoji || "💸"}</div>
                <div className="row-main">
                  <div className="row-title">{exp.description}</div>
                  <div className="row-sub">paid by {getPersonName(people, exp.paidBy)} · {exp.date}</div>
                </div>
                <div className="row-amount" style={{ color: "var(--accent)" }}>{fmt(exp.amount)}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── ADD EXPENSE MODAL ────────────────────────────────────────────────────────
function AddExpenseModal({ people, events, onAdd, onClose, defaultEventId }) {
  const [desc, setDesc] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("misc");
  const [paidBy, setPaidBy] = useState(people[0]?.id || "");
  const [eventId, setEventId] = useState(defaultEventId || events[0]?.id || "");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [splitType, setSplitType] = useState("equal");
  const [splitPeople, setSplitPeople] = useState(people.map((p) => p.id));
  const [customAmts, setCustomAmts] = useState({});
  const [pctAmts, setPctAmts] = useState({});
  const [err, setErr] = useState("");

  function togglePerson(id) {
    setSplitPeople((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  }

  function submit() {
    setErr("");
    if (!desc) return setErr("Description required");
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) return setErr("Valid amount required");
    if (!eventId) return setErr("Select an event");
    if (splitPeople.length === 0) return setErr("Select at least one person to split");

    let split;
    if (splitType === "equal") {
      split = { type: "equal", people: splitPeople };
    } else if (splitType === "custom") {
      const amounts = {};
      for (const pid of splitPeople) {
        const v = parseFloat(customAmts[pid] || 0);
        if (!v) return setErr(`Enter amount for ${getPersonName(people, pid)}`);
        amounts[pid] = v;
      }
      split = { type: "custom", people: splitPeople, amounts };
    } else {
      const percentages = {};
      let total = 0;
      for (const pid of splitPeople) {
        const v = parseFloat(pctAmts[pid] || 0);
        if (!v) return setErr(`Enter % for ${getPersonName(people, pid)}`);
        percentages[pid] = v; total += v;
      }
      if (Math.abs(total - 100) > 0.1) return setErr(`Percentages must sum to 100 (currently ${total})`);
      split = { type: "percentage", people: splitPeople, percentages };
    }

    onAdd({ id: `x${Date.now()}`, eventId, description: desc, amount: amt, category, paidBy, split, date });
    onClose();
  }

  return (
    <Modal title="Add Expense" onClose={onClose}>
      {err && <div className="auth-err" style={{ marginBottom: 12 }}>⚠ {err}</div>}
      <div className="form-group">
        <label className="form-label">Description</label>
        <input className="form-input" placeholder="e.g. Hotel stay, AWS bill..." value={desc} onChange={(e) => setDesc(e.target.value)} />
      </div>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Amount (₹)</label>
          <input className="form-input" type="number" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Date</label>
          <input className="form-input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Category</label>
          <select className="form-select" value={category} onChange={(e) => setCategory(e.target.value)}>
            {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.emoji} {c.label}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Paid By</label>
          <select className="form-select" value={paidBy} onChange={(e) => setPaidBy(e.target.value)}>
            {people.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
      </div>
      <div className="form-group">
        <label className="form-label">Event</label>
        <select className="form-select" value={eventId} onChange={(e) => setEventId(e.target.value)}>
          {events.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
        </select>
      </div>

      <div className="split-section">
        <label className="form-label">Split With</label>
        <div className="people-check-grid" style={{ marginBottom: 14 }}>
          {people.map((p) => (
            <div key={p.id} className={`people-check ${splitPeople.includes(p.id) ? "selected" : ""}`} onClick={() => togglePerson(p.id)}>
              👤 {p.name}
            </div>
          ))}
        </div>

        <div className="split-type-tabs">
          {["equal", "custom", "percentage"].map((t) => (
            <button key={t} className={`split-tab ${splitType === t ? "active" : ""}`} onClick={() => setSplitType(t)}>
              {t.toUpperCase()}
            </button>
          ))}
        </div>

        {splitType === "equal" && amount && splitPeople.length > 0 && (
          <div style={{ fontSize: 12, color: "var(--muted)" }}>
            Each person pays {fmt(parseFloat(amount || 0) / splitPeople.length)}
          </div>
        )}

        {splitType === "custom" && splitPeople.map((pid) => (
          <div key={pid} className="form-row" style={{ marginBottom: 8 }}>
            <div style={{ display: "flex", alignItems: "center", fontSize: 12, color: "var(--muted)" }}>{getPersonName(people, pid)}</div>
            <input className="form-input" type="number" placeholder="₹ amount" style={{ marginBottom: 0 }}
              value={customAmts[pid] || ""} onChange={(e) => setCustomAmts({ ...customAmts, [pid]: e.target.value })} />
          </div>
        ))}

        {splitType === "percentage" && splitPeople.map((pid) => (
          <div key={pid} className="form-row" style={{ marginBottom: 8 }}>
            <div style={{ display: "flex", alignItems: "center", fontSize: 12, color: "var(--muted)" }}>{getPersonName(people, pid)}</div>
            <input className="form-input" type="number" placeholder="%" style={{ marginBottom: 0 }}
              value={pctAmts[pid] || ""} onChange={(e) => setPctAmts({ ...pctAmts, [pid]: e.target.value })} />
          </div>
        ))}
      </div>

      <div style={{ marginTop: 20, display: "flex", gap: 12 }}>
        <button className="btn btn-ghost" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
        <button className="btn btn-primary" style={{ flex: 2 }} onClick={submit}>ADD EXPENSE</button>
      </div>
    </Modal>
  );
}

// ─── EVENTS PAGE ──────────────────────────────────────────────────────────────
function EventsPage({ events, setEvents, people, expenses, onViewEvent }) {
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [selPeople, setSelPeople] = useState([]);

  function addEvent() {
    if (!name) return;
    setEvents([...events, {
      id: `e${Date.now()}`, name, description: desc,
      people: selPeople, createdAt: new Date().toISOString().split("T")[0], status: "active"
    }]);
    setShowModal(false); setName(""); setDesc(""); setSelPeople([]);
  }

  function toggleStatus(id) {
    setEvents(events.map((e) => e.id === id ? { ...e, status: e.status === "active" ? "settled" : "active" } : e));
  }

  function deleteEvent(id) {
    setEvents(events.filter((e) => e.id !== id));
  }

  return (
    <div className="page-content">
      <div className="section-head">
        <div className="section-title">All Events</div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ New Event</button>
      </div>
      <div className="card">
        {events.length === 0 && <div className="empty-state"><div className="empty-icon">📁</div>No events yet</div>}
        {events.map((ev) => {
          const evExp = expenses.filter((x) => x.eventId === ev.id);
          const total = evExp.reduce((s, x) => s + x.amount, 0);
          return (
            <div className="card-row" key={ev.id} style={{ cursor: "pointer" }}>
              <div className="row-icon">📋</div>
              <div className="row-main" onClick={() => onViewEvent(ev.id)}>
                <div className="row-title">{ev.name}</div>
                <div className="row-sub">{ev.description} · {ev.people.length} people · {evExp.length} expenses · {ev.createdAt}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div className="row-amount" style={{ color: "var(--accent)" }}>{fmt(total)}</div>
                <span className={`tag ${ev.status === "active" ? "tag-active" : "tag-settled"}`}>{ev.status}</span>
                <button className="btn btn-ghost btn-sm" onClick={() => toggleStatus(ev.id)}>
                  {ev.status === "active" ? "Settle" : "Reopen"}
                </button>
                <button className="btn btn-danger" onClick={() => deleteEvent(ev.id)}>✕</button>
              </div>
            </div>
          );
        })}
      </div>

      {showModal && (
        <Modal title="New Event" onClose={() => setShowModal(false)}>
          <div className="form-group">
            <label className="form-label">Event Name</label>
            <input className="form-input" placeholder="e.g. AWS Summit Trip" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <input className="form-input" placeholder="Short description" value={desc} onChange={(e) => setDesc(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">People</label>
            <div className="people-check-grid">
              {people.map((p) => (
                <div key={p.id} className={`people-check ${selPeople.includes(p.id) ? "selected" : ""}`}
                  onClick={() => setSelPeople(selPeople.includes(p.id) ? selPeople.filter((x) => x !== p.id) : [...selPeople, p.id])}>
                  👤 {p.name}
                </div>
              ))}
            </div>
          </div>
          <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
            <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setShowModal(false)}>Cancel</button>
            <button className="btn btn-primary" style={{ flex: 2 }} onClick={addEvent}>CREATE EVENT</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── EVENT DETAIL PAGE ────────────────────────────────────────────────────────
function EventDetailPage({ event, expenses, people, setExpenses, onBack }) {
  const [showAdd, setShowAdd] = useState(false);
  const evExp = expenses.filter((x) => x.eventId === event.id);
  const total = evExp.reduce((s, x) => s + x.amount, 0);
  const balances = computeBalances(people.filter((p) => event.people.includes(p.id)), evExp);
  const settlements = computeSettlements(balances, people);

  function deleteExp(id) {
    setExpenses(expenses.filter((x) => x.id !== id));
  }

  return (
    <div className="page-content">
      <div className="event-detail-back" onClick={onBack}>← Back to Events</div>
      <div className="section-head">
        <div>
          <div className="section-title">{event.name}</div>
          <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>{event.description}</div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAdd(true)}>+ Add Expense</button>
      </div>

      <div className="stat-grid" style={{ gridTemplateColumns: "repeat(3,1fr)", marginBottom: 24 }}>
        <StatCard label="Total Spend" value={fmt(total)} />
        <StatCard label="Expenses" value={evExp.length} />
        <StatCard label="People" value={event.people.length} />
      </div>

      <div className="grid-2">
        <div>
          <div className="section-head"><div className="section-title">Expenses</div></div>
          <div className="card">
            {evExp.length === 0 && <div className="empty-state"><div className="empty-icon">💸</div>No expenses yet</div>}
            {evExp.map((exp) => {
              const cat = CATEGORIES.find((c) => c.id === exp.category);
              return (
                <div className="card-row" key={exp.id}>
                  <div className="row-icon">{cat?.emoji || "💸"}</div>
                  <div className="row-main">
                    <div className="row-title">{exp.description}</div>
                    <div className="row-sub">by {getPersonName(people, exp.paidBy)} · {exp.split.type} split · {exp.date}</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div className="row-amount" style={{ color: "var(--accent)" }}>{fmt(exp.amount)}</div>
                    <button className="btn btn-danger" onClick={() => deleteExp(exp.id)}>✕</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <div className="section-head"><div className="section-title">Settlements</div></div>
          <div className="card">
            {settlements.length === 0 ? (
              <div className="empty-state"><div className="empty-icon">✅</div>All settled!</div>
            ) : settlements.map((s, i) => (
              <div className="settlement-row" key={i}>
                <span style={{ fontWeight: 600 }}>{getPersonName(people, s.from)}</span>
                <span className="settle-arrow">→</span>
                <span style={{ fontWeight: 600 }}>{getPersonName(people, s.to)}</span>
                <span style={{ color: "var(--red)", fontFamily: "var(--font-display)", fontWeight: 700 }}>{fmt(s.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {showAdd && (
        <AddExpenseModal
          people={people.filter((p) => event.people.includes(p.id))}
          events={[event]}
          onAdd={(exp) => setExpenses([...expenses, exp])}
          onClose={() => setShowAdd(false)}
          defaultEventId={event.id}
        />
      )}
    </div>
  );
}

// ─── PEOPLE PAGE ──────────────────────────────────────────────────────────────
function PeoplePage({ people, setPeople, expenses }) {
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const balances = computeBalances(people, expenses);

  function addPerson() {
    if (!name) return;
    setPeople([...people, { id: `p${Date.now()}`, name, email }]);
    setShowModal(false); setName(""); setEmail("");
  }

  function deletePerson(id) {
    setPeople(people.filter((p) => p.id !== id));
  }

  return (
    <div className="page-content">
      <div className="section-head">
        <div className="section-title">People</div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Add Person</button>
      </div>
      <div className="card">
        {people.length === 0 && <div className="empty-state"><div className="empty-icon">👥</div>No people yet</div>}
        {people.map((p) => {
          const bal = balances[p.id] || 0;
          return (
            <div className="card-row" key={p.id}>
              <div className="row-icon">👤</div>
              <div className="row-main">
                <div className="row-title">{p.name}</div>
                <div className="row-sub">{p.email || "no email"}</div>
              </div>
              <div className={`row-amount ${bal > 0.01 ? "balance-pos" : bal < -0.01 ? "balance-neg" : "balance-zero"}`}>
                {bal > 0.01 ? "gets back" : bal < -0.01 ? "owes" : "settled"} {bal !== 0 ? fmt(Math.abs(bal)) : ""}
              </div>
              <button className="btn btn-danger" onClick={() => deletePerson(p.id)}>✕</button>
            </div>
          );
        })}
      </div>

      {showModal && (
        <Modal title="Add Person" onClose={() => setShowModal(false)}>
          <div className="form-group">
            <label className="form-label">Name</label>
            <input className="form-input" placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Email (optional)</label>
            <input className="form-input" placeholder="email@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setShowModal(false)}>Cancel</button>
            <button className="btn btn-primary" style={{ flex: 2 }} onClick={addPerson}>ADD PERSON</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── EXPENSES PAGE ────────────────────────────────────────────────────────────
function ExpensesPage({ expenses, setExpenses, people, events }) {
  const [showAdd, setShowAdd] = useState(false);
  const [filterCat, setFilterCat] = useState("all");
  const [search, setSearch] = useState("");

  const filtered = expenses.filter((e) => {
    if (filterCat !== "all" && e.category !== filterCat) return false;
    if (search && !e.description.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="page-content">
      <div className="section-head">
        <div className="section-title">All Expenses</div>
        <button className="btn btn-primary" onClick={() => setShowAdd(true)}>+ Add Expense</button>
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <input className="search-input" placeholder="🔍  Search expenses..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <select className="form-select" style={{ width: "auto" }} value={filterCat} onChange={(e) => setFilterCat(e.target.value)}>
          <option value="all">All Categories</option>
          {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.emoji} {c.label}</option>)}
        </select>
      </div>

      <div className="card">
        {filtered.length === 0 && <div className="empty-state"><div className="empty-icon">💸</div>No expenses found</div>}
        {filtered.map((exp) => {
          const cat = CATEGORIES.find((c) => c.id === exp.category);
          const ev = events.find((e) => e.id === exp.eventId);
          return (
            <div className="card-row" key={exp.id}>
              <div className="row-icon">{cat?.emoji || "💸"}</div>
              <div className="row-main">
                <div className="row-title">{exp.description}</div>
                <div className="row-sub">
                  {ev?.name} · paid by {getPersonName(people, exp.paidBy)} · {exp.split.type} split · {exp.date}
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span className="tag">{cat?.emoji} {cat?.label}</span>
                <div className="row-amount" style={{ color: "var(--accent)" }}>{fmt(exp.amount)}</div>
                <button className="btn btn-danger" onClick={() => setExpenses(expenses.filter((x) => x.id !== exp.id))}>✕</button>
              </div>
            </div>
          );
        })}
      </div>

      {showAdd && (
        <AddExpenseModal
          people={people} events={events}
          onAdd={(exp) => setExpenses([...expenses, exp])}
          onClose={() => setShowAdd(false)}
        />
      )}
    </div>
  );
}

// ─── SETTLEMENTS PAGE ─────────────────────────────────────────────────────────
function SettlementsPage({ people, expenses, events }) {
  const balances = computeBalances(people, expenses);
  const settlements = computeSettlements(balances, people);
  const [settled, setSettled] = useState([]);

  return (
    <div className="page-content">
      <div className="section-head">
        <div className="section-title">Settlements</div>
      </div>

      <div className="stat-grid" style={{ gridTemplateColumns: "repeat(3,1fr)", marginBottom: 24 }}>
        <StatCard label="Pending" value={settlements.filter((_, i) => !settled.includes(i)).length} color="var(--red)" />
        <StatCard label="Settled" value={settled.length} color="var(--green)" />
        <StatCard label="Total Owed" value={fmt(settlements.filter((_, i) => !settled.includes(i)).reduce((s, x) => s + x.amount, 0))} />
      </div>

      <div className="section-head" style={{ marginBottom: 12 }}><div className="section-title">Who Owes Who</div></div>
      <div className="card" style={{ marginBottom: 24 }}>
        {settlements.length === 0 && <div className="empty-state"><div className="empty-icon">🎉</div>Everything is settled!</div>}
        {settlements.map((s, i) => (
          <div className="settlement-row" key={i} style={{ opacity: settled.includes(i) ? 0.4 : 1 }}>
            <div>
              <strong>{getPersonName(people, s.from)}</strong>
              <span className="settle-arrow">→</span>
              <strong>{getPersonName(people, s.to)}</strong>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ color: settled.includes(i) ? "var(--green)" : "var(--red)", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 18 }}>
                {fmt(s.amount)}
              </span>
              {!settled.includes(i) ? (
                <button className="btn btn-primary btn-sm" onClick={() => setSettled([...settled, i])}>Mark Paid</button>
              ) : (
                <span className="tag tag-active">✓ Paid</span>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="section-head"><div className="section-title">Net Balances</div></div>
      <div className="card">
        {people.map((p) => {
          const bal = balances[p.id] || 0;
          return (
            <div className="card-row" key={p.id}>
              <div className="row-icon">👤</div>
              <div className="row-main">
                <div className="row-title">{p.name}</div>
              </div>
              <div className={`row-amount ${bal > 0.01 ? "balance-pos" : bal < -0.01 ? "balance-neg" : "balance-zero"}`} style={{ fontSize: 18 }}>
                {bal > 0.01 ? `+${fmt(bal)} (gets back)` : bal < -0.01 ? `${fmt(bal)} (owes)` : "Settled ✓"}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── ROOT APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(null);
  const [page, setPage] = useState("dashboard");
  const [viewEventId, setViewEventId] = useState(null);

  const [people, setPeople] = useState(initPeople);
  const [events, setEvents] = useState(initEvents);
  const [expenses, setExpenses] = useState(initExpenses);

  const NAV = [
    { id: "dashboard", label: "Dashboard", icon: "⬡" },
    { id: "events", label: "Events", icon: "📋" },
    { id: "expenses", label: "Expenses", icon: "💸" },
    { id: "people", label: "People", icon: "👥" },
    { id: "settlements", label: "Settlements", icon: "⚖️" },
  ];

  const PAGE_TITLES = {
    dashboard: "Dashboard",
    events: "Events",
    expenses: "Expenses",
    people: "People",
    settlements: "Settlements",
  };

  if (!user) return <><style>{css}</style><AuthPage onLogin={setUser} /></>;

  const currentEvent = viewEventId ? events.find((e) => e.id === viewEventId) : null;

  return (
    <>
      <style>{css}</style>
      <div className="app">
        <div className="sidebar">
          <div className="sidebar-logo">X<span>pense</span></div>
          <nav className="sidebar-nav">
            {NAV.map((n) => (
              <div key={n.id} className={`nav-item ${page === n.id && !viewEventId ? "active" : ""}`}
                onClick={() => { setPage(n.id); setViewEventId(null); }}>
                <span className="nav-icon">{n.icon}</span>
                {n.label}
              </div>
            ))}
          </nav>
          <div className="sidebar-user">
            <strong>{user}</strong>
            logged in
            <br />
            <button className="logout-btn" onClick={() => setUser(null)}>logout</button>
          </div>
        </div>

        <div className="main">
          <div className="topbar">
            <div className="topbar-title">
              {viewEventId && currentEvent ? currentEvent.name : PAGE_TITLES[page]}
            </div>
          </div>

          {viewEventId && currentEvent ? (
            <EventDetailPage
              event={currentEvent}
              expenses={expenses}
              people={people}
              setExpenses={setExpenses}
              onBack={() => setViewEventId(null)}
            />
          ) : page === "dashboard" ? (
            <Dashboard expenses={expenses} events={events} people={people} />
          ) : page === "events" ? (
            <EventsPage events={events} setEvents={setEvents} people={people} expenses={expenses}
              onViewEvent={(id) => { setViewEventId(id); }} />
          ) : page === "expenses" ? (
            <ExpensesPage expenses={expenses} setExpenses={setExpenses} people={people} events={events} />
          ) : page === "people" ? (
            <PeoplePage people={people} setPeople={setPeople} expenses={expenses} />
          ) : page === "settlements" ? (
            <SettlementsPage people={people} expenses={expenses} events={events} />
          ) : null}
        </div>
      </div>
    </>
  );
}
