import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import Layout from './components/Layout.jsx';
import LandingPage from './pages/LandingPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import RoomsPage from './pages/RoomsPage.jsx';
import BookingsPage from './pages/BookingsPage.jsx';
import NewBookingPage from './pages/NewBookingPage.jsx';

function ProtectedRoute({ children }) {
  const { isAuth } = useAuth();
  return isAuth ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/request" element={<NewBookingPage />} />
        <Route path="/admin" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route index element={<DashboardPage />} />
          <Route path="rooms" element={<RoomsPage />} />
          <Route path="bookings" element={<BookingsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
