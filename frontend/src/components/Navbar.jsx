import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const links = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/rooms',     label: 'Rooms' },
  { to: '/bookings',  label: 'Bookings' },
  { to: '/new',       label: 'New request' },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <nav className="bg-white border-b border-gray-100 px-6 h-14 flex items-center justify-between sticky top-0 z-40">
      <div className="flex items-center gap-6">
        <span className="font-semibold text-army text-sm tracking-tight">
          Officers' Guest House
        </span>
        <div className="flex gap-1">
          {links.map(l => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                `px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-army-light text-army font-medium'
                    : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-500">{user?.name}</span>
        <button onClick={handleLogout} className="btn-ghost text-xs">
          Sign out
        </button>
      </div>
    </nav>
  );
}
