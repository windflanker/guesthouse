import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../utils/api.js';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate  = useNavigate();
  const [form, setForm]   = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const data = await api.post('/auth/login', form);
      login(data.token, data.username, data.role);
      if (data.role === 'manager') {
        navigate('/manager');
      } else {
        navigate('/admin');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.page}>
      <div style={s.card}>
        <img src="/logo.jpeg" alt="Logo" style={s.logo} />
        <h1 style={s.heading}>Guest Room Booking</h1>
        <p style={s.sub}>Login</p>
        <div style={s.divider} />

        <form onSubmit={handleSubmit} style={s.form}>
          {error && <div style={s.error}>{error}</div>}
          <div style={s.field}>
            <label style={s.label}>Username</label>
            <input style={s.input} value={form.username}
              onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
              autoComplete="username" required />
          </div>
          <div style={s.field}>
            <label style={s.label}>Password</label>
            <input type="password" style={s.input} value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              autoComplete="current-password" required />
          </div>
          <button type="submit" style={s.btn} disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p style={s.backLink}>
          <span style={{ cursor: 'pointer', color: '#185FA5' }} onClick={() => navigate('/')}>
            ← Back to home
          </span>
        </p>
      </div>
    </div>
  );
}

const s = {
  page: { minHeight: '100vh', background: 'linear-gradient(135deg, #f7f6f2 0%, #e8e6df 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 },
  card: { background: '#fff', border: '0.5px solid rgba(0,0,0,0.1)', borderRadius: 20, padding: '40px 44px', width: 400, boxShadow: '0 8px 40px rgba(0,0,0,0.08)', display: 'flex', flexDirection: 'column', alignItems: 'center' },
  logo: { width: 80, height: 80, objectFit: 'contain', marginBottom: 12 },
  heading: { fontFamily: 'var(--font-serif)', fontSize: 22, fontWeight: 400, color: '#1A1917', marginBottom: 4 },
  sub: { fontSize: 12, color: '#9A9895', letterSpacing: '0.04em', textTransform: 'uppercase' },
  divider: { width: 48, height: 2, background: '#185FA5', borderRadius: 99, margin: '16px 0 24px', opacity: 0.4 },
  form: { display: 'flex', flexDirection: 'column', gap: 16, width: '100%' },
  error: { background: '#FCEBEB', color: '#A32D2D', fontSize: 13, padding: '10px 14px', borderRadius: 8 },
  field: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: { fontSize: 12, fontWeight: 500, color: '#5A5855' },
  input: { padding: '9px 12px', fontSize: 14, border: '0.5px solid rgba(0,0,0,0.18)', borderRadius: 10, outline: 'none', background: '#fff', color: '#1A1917' },
  btn: { marginTop: 4, background: '#185FA5', color: '#fff', border: 'none', padding: 11, fontSize: 14, fontWeight: 500, borderRadius: 10, cursor: 'pointer' },
  backLink: { marginTop: 20, fontSize: 13, color: '#9A9895' },
};
