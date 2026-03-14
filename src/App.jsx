import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar     from './components/Navbar.jsx';
import Dashboard  from './pages/Dashboard.jsx';
import TripsPage  from './pages/TripsPage.jsx';
import TripPage   from './pages/TripPage.jsx';
import UsersPage  from './pages/UsersPage.jsx';

export default function App() {
  return (
    <>
      <Navbar />
      <main>
        <Routes>
          <Route path="/"            element={<Dashboard />} />
          <Route path="/trips"       element={<TripsPage />} />
          <Route path="/trips/:id"   element={<TripPage />} />
          <Route path="/users"       element={<UsersPage />} />
          <Route path="*"            element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </>
  );
}
