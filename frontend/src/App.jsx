import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import Layout from './components/Layout.jsx';
import ManagerLayout from './components/ManagerLayout.jsx';
import LandingPage from './pages/LandingPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import RoomsPage from './pages/RoomsPage.jsx';
import BookingsPage from './pages/BookingsPage.jsx';
import NewBookingPage from './pages/NewBookingPage.jsx';
import ManagerView from './pages/ManagerView.jsx';

function ProtectedAdmin({ children }) {
  const { isAuth, role } = useAuth();
  if (!isAuth) return <Navigate to="/login" replace />;
  if (role === 'manager') return <Navigate to="/manager" replace />;
  return children;
}

function ProtectedManager({ children }) {
  const { isAuth } = useAuth();
  if (!isAuth) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/request" element={<NewBookingPage />} />
        <Route path="/admin" element={<ProtectedAdmin><Layout /></ProtectedAdmin>}>
          <Route index element={<DashboardPage />} />
          <Route path="rooms" element={<RoomsPage />} />
          <Route path="bookings" element={<BookingsPage />} />
        </Route>
        <Route path="/manager" element={<ProtectedManager><ManagerLayout /></ProtectedManager>}>
          <Route index element={<ManagerView />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
