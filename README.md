# TripSpend 💸

> Split group expenses. Zero drama.

A fully client-side React app — no backend required. All data is stored in `localStorage` and persists across sessions.

## Features

- Add people to your group
- Create multiple trips / expense groups
- Add expenses with who paid
- View per-person balances
- Minimal-transaction **Settle Up** algorithm
- Per-person expense drill-down

## Stack

- React 18 + React Router v6
- Vite 5
- Zero external UI libraries — all custom components
- `localStorage` for persistence

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

## Build for Production

```bash
npm run build
npm run preview
```

## Project Structure

```
src/
├── components/
│   ├── ExpenseCard.jsx   # Single expense row
│   ├── Navbar.jsx        # Fixed top nav
│   └── ui.jsx            # Design system primitives
├── pages/
│   ├── Dashboard.jsx     # All expenses + stats + settle up
│   ├── TripPage.jsx      # Per-person expense detail
│   └── UsersPage.jsx     # People management
├── utils/
│   └── store.js          # localStorage data layer
├── App.jsx
├── App.css
└── main.jsx
```
