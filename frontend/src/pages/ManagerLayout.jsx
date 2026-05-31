import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function ManagerLayout() {
  const { admin, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/'); };

  return (
    <div style={s.shell}>
      <div style={s.topbar}>
        <div style={s.logo}>
          <img src="/logo.jpeg" alt="Logo" style={s.logoImg} />
          <div>
            <div style={s.logoTitle}>Guest Room</div>
            <div style={s.logoSub}>Manager View</div>
          </div>
        </div>
        <div style={s.badge}>
          <div style={s.avatar}>{admin?.[0]?.toUpperCase() || 'M'}</div>
          <span style={s.name}>{admin}</span>
          <span style={s.roleTag}>Manager</span>
          <button onClick={handleLogout} style={s.logoutBtn}>Sign out</button>
        </div>
      </div>
      <main style={s.main}>
        <Outlet />
      </main>
    </div>
  );
}

const s = {
  shell:    { minHeight: '100vh', background: '#F7F6F2', display: 'flex', flexDirection: 'column' },
  topbar:   { background: '#fff', borderBottom: '0.5px solid rgba(0,0,0,0.1)', padding: '0 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 56 },
  logo:     { display: 'flex', alignItems: 'center', gap: 10 },
  logoImg:  { width: 32, height: 32, objectFit: 'contain', borderRadius: 6 },
  logoTitle:{ fontFamily: 'var(--font-serif)', fontSize: 14, color: '#1A1917', lineHeight: 1.2 },
  logoSub:  { fontSize: 10, color: '#9A9895', letterSpacing: '0.04em' },
  badge:    { display: 'flex', alignItems: 'center', gap: 8 },
  avatar:   { width: 28, height: 28, borderRadius: '50%', background: '#FAEEDA', color: '#854F0B', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 500 },
  name:     { fontSize: 13, color: '#5A5855' },
  roleTag:  { fontSize: 11, background: '#FAEEDA', color: '#854F0B', padding: '2px 8px', borderRadius: 99, fontWeight: 500 },
  logoutBtn:{ background: 'none', border: 'none', fontSize: 12, color: '#9A9895', cursor: 'pointer', padding: '2px 8px' },
  main:     { flex: 1, padding: '28px 32px', overflow: 'auto' },
};
