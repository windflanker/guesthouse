import { useNavigate } from 'react-router-dom';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div style={s.page}>
      <div style={s.card}>
        <img src="/logo.jpeg" alt="Guest House Logo" style={s.logo} />
        <h1 style={s.heading}>Guest Room Booking</h1>
        <p style={s.sub}>Officers' Guest House</p>
        <div style={s.divider} />
        <p style={s.desc}>Please choose an option to continue</p>
        <div style={s.btnGroup}>
          <button style={s.primaryBtn} onClick={() => navigate('/request')}>
            <span style={s.btnIcon}>📋</span>
            <div>
              <div style={s.btnTitle}>Submit Booking Request</div>
              <div style={s.btnSub}>Apply for a guest room</div>
            </div>
          </button>
          <button style={s.secondaryBtn} onClick={() => navigate('/login')}>
            <span style={s.btnIcon}>🔐</span>
            <div>
              <div style={s.btnTitle}>Admin Login</div>
              <div style={s.btnSub}>Manage bookings & rooms</div>
            </div>
          </button>
        </div>
      </div>
      <div style={s.footer}>Officers' Guest House Booking System</div>
    </div>
  );
}

const s = {
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #f7f6f2 0%, #e8e6df 100%)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    background: '#fff',
    border: '0.5px solid rgba(0,0,0,0.1)',
    borderRadius: 20,
    padding: '44px 48px',
    width: '100%',
    maxWidth: 440,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    boxShadow: '0 8px 40px rgba(0,0,0,0.10)',
  },
  logo: {
    width: 90,
    height: 90,
    objectFit: 'contain',
    marginBottom: 18,
  },
  heading: {
    fontFamily: 'var(--font-serif)',
    fontSize: 26,
    fontWeight: 400,
    color: '#1A1917',
    textAlign: 'center',
    marginBottom: 6,
  },
  sub: {
    fontSize: 13,
    color: '#9A9895',
    textAlign: 'center',
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
  },
  divider: {
    width: 48,
    height: 2,
    background: '#185FA5',
    borderRadius: 99,
    margin: '20px 0',
    opacity: 0.4,
  },
  desc: {
    fontSize: 13,
    color: '#5A5855',
    marginBottom: 24,
    textAlign: 'center',
  },
  btnGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    width: '100%',
  },
  primaryBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    background: '#185FA5',
    color: '#fff',
    border: 'none',
    borderRadius: 12,
    padding: '16px 20px',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'background 0.15s',
    width: '100%',
  },
  secondaryBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    background: '#f7f6f2',
    color: '#1A1917',
    border: '0.5px solid rgba(0,0,0,0.12)',
    borderRadius: 12,
    padding: '16px 20px',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'background 0.15s',
    width: '100%',
  },
  btnIcon: { fontSize: 24, flexShrink: 0 },
  btnTitle: { fontSize: 15, fontWeight: 500, marginBottom: 2 },
  btnSub: { fontSize: 12, opacity: 0.7 },
  footer: {
    marginTop: 28,
    fontSize: 12,
    color: '#9A9895',
  },
};
