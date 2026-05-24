import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { to: '/admin',          label: 'Dashboard',   icon: '▪' },
  { to: '/admin/rooms',    label: 'Rooms',        icon: '▪' },
  { to: '/admin/bookings', label: 'Bookings',     icon: '▪' },
];

export default function AdminLayout() {
  const { admin, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/admin/login');
  }

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar */}
      <aside className="w-56 bg-army-700 text-white flex flex-col shrink-0">
        <div className="px-5 py-5 border-b border-white/10">
          <div className="text-sm font-semibold tracking-wide text-white/90">Officers'</div>
          <div className="text-base font-semibold">Guest House</div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/admin'}
              className={({ isActive }) =>
                `flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-white/20 text-white font-medium'
                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="px-5 py-4 border-t border-white/10">
          <div className="text-xs text-white/50 mb-1">Signed in as</div>
          <div className="text-sm text-white font-medium truncate">{admin?.name}</div>
          <button
            onClick={handleLogout}
            className="mt-3 text-xs text-white/60 hover:text-white transition-colors"
          >
            Sign out →
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
