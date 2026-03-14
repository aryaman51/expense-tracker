// ─────────────────────────────────────────────────────────────────────────────
//  store.js — localStorage data layer
//
//  All functions are async so swapping this for a real API later = zero changes
//  in pages/components. Just replace these implementations with fetch() calls.
// ─────────────────────────────────────────────────────────────────────────────

const KEYS = { users: 'ts_users', trips: 'ts_trips', expenses: 'ts_expenses' };

// ── Helpers ───────────────────────────────────────────────────────────────────
const read  = (k) => JSON.parse(localStorage.getItem(k) ?? '[]');
const write = (k, v) => localStorage.setItem(k, JSON.stringify(v));
const uid   = () => `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
const now   = () => new Date().toISOString();

// ── Users ─────────────────────────────────────────────────────────────────────
export const users = {
  list: async () => read(KEYS.users),

  get: async (id) => {
    const u = read(KEYS.users).find((u) => u.id === id);
    if (!u) throw new Error('User not found');
    return u;
  },

  create: async (name) => {
    if (!name?.trim()) throw new Error('name is required');
    const all  = read(KEYS.users);
    const user = { id: uid(), name: name.trim(), created_at: now() };
    write(KEYS.users, [...all, user]);
    return user;
  },

  update: async (id, name) => {
    const all = read(KEYS.users);
    const idx = all.findIndex((u) => u.id === id);
    if (idx === -1) throw new Error('User not found');
    all[idx] = { ...all[idx], name: name.trim() };
    write(KEYS.users, all);
    return all[idx];
  },

  delete: async (id) => {
    write(KEYS.users, read(KEYS.users).filter((u) => u.id !== id));
    return null;
  },
};

// ── Trips ─────────────────────────────────────────────────────────────────────
export const trips = {
  list: async () => {
    const allExp = read(KEYS.expenses);
    return read(KEYS.trips).map((t) => {
      const exp = allExp.filter((e) => e.trip_id === t.id);
      return {
        ...t,
        expense_count: exp.length,
        total_amount:  exp.reduce((s, e) => s + Number(e.amount), 0),
      };
    });
  },

  get: async (id) => {
    const trip = read(KEYS.trips).find((t) => t.id === id);
    if (!trip) throw new Error('Trip not found');
    const expenses = read(KEYS.expenses).filter((e) => e.trip_id === id);
    return { ...trip, expenses };
  },

  create: async (name) => {
    if (!name?.trim()) throw new Error('name is required');
    const trip = { id: uid(), name: name.trim(), created_at: now() };
    write(KEYS.trips, [...read(KEYS.trips), trip]);
    return trip;
  },

  update: async (id, name) => {
    const all = read(KEYS.trips);
    const idx = all.findIndex((t) => t.id === id);
    if (idx === -1) throw new Error('Trip not found');
    all[idx] = { ...all[idx], name: name.trim() };
    write(KEYS.trips, all);
    return all[idx];
  },

  // cascade-deletes expenses
  delete: async (id) => {
    write(KEYS.trips,    read(KEYS.trips).filter((t) => t.id !== id));
    write(KEYS.expenses, read(KEYS.expenses).filter((e) => e.trip_id !== id));
    return null;
  },
};

// ── Expenses ──────────────────────────────────────────────────────────────────
export const expenses = {
  // list all, or filter by trip_id and/or user_id
  list: async ({ trip_id, user_id } = {}) => {
    let all = read(KEYS.expenses);
    if (trip_id) all = all.filter((e) => e.trip_id === trip_id);
    if (user_id) all = all.filter((e) => e.user_id === user_id);
    // join user_name
    const allUsers = read(KEYS.users);
    return all
      .map((e) => ({ ...e, user_name: allUsers.find((u) => u.id === e.user_id)?.name ?? 'Unknown' }))
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  },

  create: async ({ trip_id, user_id, amount, description }) => {
    if (!description?.trim()) throw new Error('description is required');
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0)
      throw new Error('amount must be a positive number');
    if (!user_id) throw new Error('user_id is required');

    const exp = {
      id: uid(), trip_id, user_id,
      amount:      Number(amount),
      description: description.trim(),
      created_at:  now(),
    };
    write(KEYS.expenses, [...read(KEYS.expenses), exp]);

    // return with user_name joined
    const user = read(KEYS.users).find((u) => u.id === user_id);
    return { ...exp, user_name: user?.name ?? 'Unknown' };
  },

  update: async (id, patch) => {
    const all = read(KEYS.expenses);
    const idx = all.findIndex((e) => e.id === id);
    if (idx === -1) throw new Error('Expense not found');
    if (patch.description?.trim()) all[idx].description = patch.description.trim();
    if (patch.amount && Number(patch.amount) > 0) all[idx].amount = Number(patch.amount);
    if (patch.user_id) all[idx].user_id = patch.user_id;
    write(KEYS.expenses, all);
    return all[idx];
  },

  delete: async (id) => {
    write(KEYS.expenses, read(KEYS.expenses).filter((e) => e.id !== id));
    return null;
  },
};

// ── Settlements ───────────────────────────────────────────────────────────────
export function calcSettlements(users, expenses) {
  if (users.length < 2 || !expenses.length) return [];

  const total = expenses.reduce((s, e) => s + Number(e.amount), 0);
  const share = total / users.length;

  const net = {};
  users.forEach((u) => (net[u.id] = 0));
  expenses.forEach((e) => { if (net[e.user_id] !== undefined) net[e.user_id] += Number(e.amount); });
  users.forEach((u) => (net[u.id] -= share));

  const creditors = Object.entries(net)
    .filter(([, v]) => v > 0.005)
    .map(([id, amount]) => ({ id, amount }))
    .sort((a, b) => b.amount - a.amount);

  const debtors = Object.entries(net)
    .filter(([, v]) => v < -0.005)
    .map(([id, amount]) => ({ id, amount: -amount }))
    .sort((a, b) => b.amount - a.amount);

  const result = [];
  let i = 0, j = 0;
  while (i < creditors.length && j < debtors.length) {
    const pay = Math.min(creditors[i].amount, debtors[j].amount);
    result.push({ from: debtors[j].id, to: creditors[i].id, amount: pay });
    creditors[i].amount -= pay;
    debtors[j].amount  -= pay;
    if (creditors[i].amount < 0.005) i++;
    if (debtors[j].amount  < 0.005) j++;
  }
  return result;
}

export const fmt = (amount) =>
  '₹' + Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
