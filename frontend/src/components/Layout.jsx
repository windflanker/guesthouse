import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const navItems = [
  { to: '/admin',          label: 'Dashboard', icon: '⊞', end: true },
  { to: '/admin/rooms',    label: 'Rooms',     icon: '⊡' },
  { to: '/admin/bookings', label: 'Bookings',  icon: '≡' },
];

export default function Layout() {
  const { admin, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/'); };

  return (
    <div style={s.shell}>
      <aside style={s.sidebar}>
        <div style={s.logoBox} onClick={() => navigate('/admin')} >
          <img src="/logo.jpeg" alt="Logo" style={s.logoImg} />
          <div>
            <div style={s.logoTitle}>Guest Room</div>
            <div style={s.logoSub}>Booking System</div>
          </div>
        </div>

        <nav style={s.nav}>
          {navItems.map(item => (
            <NavLink key={item.to} to={item.to} end={item.end}
              style={({ isActive }) => ({ ...s.navLink, ...(isActive ? s.navActive : {}) })}>
              <span style={s.navIcon}>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div style={s.sidebarBottom}>
          <a href="/request" target="_blank" rel="noopener noreferrer" style={s.externalLink}>
            Guest booking form ↗
          </a>
          <div style={s.adminRow}>
            <div style={s.avatar}>{admin?.[0]?.toUpperCase() || 'A'}</div>
            <span style={s.adminName}>{admin}</span>
            <button onClick={handleLogout} style={s.logoutBtn}>Sign out</button>
          </div>
        </div>
      </aside>

      <main style={s.main}>
        <Outlet />
      </main>
    </div>
  );
}

const s = {
  shell: { display: 'flex', minHeight: '100vh' },
  sidebar: {
    width: 220, flexShrink: 0, background: '#fff',
    borderRight: '0.5px solid rgba(0,0,0,0.1)',
    display: 'flex', flexDirection: 'column', padding: '0 0 16px',
  },
  logoBox: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '16px 20px', borderBottom: '0.5px solid rgba(0,0,0,0.08)',
    marginBottom: 8, cursor: 'pointer',
  },
  logoImg: { width: 36, height: 36, objectFit: 'contain', borderRadius: 6 },
  logoTitle: { fontFamily: 'var(--font-serif)', fontSize: 14, lineHeight: 1.2, color: '#1A1917' },
  logoSub: { fontSize: 10, color: '#9A9895', letterSpacing: '0.04em' },
  nav: { display: 'flex', flexDirection: 'column', gap: 2, padding: '0 10px' },
  navLink: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '8px 12px', borderRadius: 10, fontSize: 14,
    color: '#5A5855', transition: 'all 0.15s', fontWeight: 400,
  },
  navActive: { background: '#E6F1FB', color: '#185FA5', fontWeight: 500 },
  navIcon: { fontSize: 16, opacity: 0.7 },
  sidebarBottom: { marginTop: 'auto', padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 12 },
  externalLink: {
    fontSize: 12, color: '#185FA5', padding: '8px 12px',
    border: '0.5px solid rgba(0,0,0,0.18)', borderRadius: 10,
    display: 'block', textAlign: 'center',
  },
  adminRow: { display: 'flex', alignItems: 'center', gap: 8, padding: '10px 4px 0', borderTop: '0.5px solid rgba(0,0,0,0.08)' },
  avatar: {
    width: 28, height: 28, borderRadius: '50%', background: '#E6F1FB',
    color: '#185FA5', display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 12, fontWeight: 500,
  },
  adminName: { fontSize: 13, color: '#5A5855', flex: 1 },
  logoutBtn: { background: 'none', border: 'none', fontSize: 12, color: '#9A9895', padding: '2px 4px', borderRadius: 4, cursor: 'pointer' },
  main: { flex: 1, padding: '28px 32px', overflow: 'auto' },
};
