import { useEffect, useState } from 'react';
import { api } from '../utils/api.js';
import Badge from '../components/Badge.jsx';
import Modal from '../components/Modal.jsx';

const CAT_LABELS = { 1: 'Cat 1', 2: 'Cat 2', 3: 'Cat 3' };

export default function BookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterCat,    setFilterCat]    = useState('');
  const [modal, setModal] = useState(null); // { type, booking }
  const [availRooms, setAvailRooms] = useState([]);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState('');

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  };

  const load = () => {
    const params = new URLSearchParams();
    if (filterStatus) params.set('status', filterStatus);
    if (filterCat)    params.set('category', filterCat);
    api.get('/bookings?' + params).then(setBookings).catch(console.error);
  };

  useEffect(load, [filterStatus, filterCat]);

  const openApprove = async (booking) => {
    const rooms = await api.get('/rooms/available/all');
    setAvailRooms(rooms);
    setFormData({ roomId: rooms[0]?._id || '' });
    setModal({ type: 'approve', booking });
  };

  const doApprove = async () => {
    setLoading(true);
    try {
      await api.patch(`/bookings/${modal.booking._id}/approve`, { roomId: formData.roomId });
      showToast('Booking approved. SMS sent.');
      setModal(null); load();
    } finally { setLoading(false); }
  };

  const doCheckin = async (booking) => {
    await api.patch(`/bookings/${booking._id}/checkin`);
    showToast('Checked in. SMS sent.');
    load();
  };

  const openCheckout = (booking) => {
    setFormData({ actualCheckout: booking.checkout, notes: '' });
    setModal({ type: 'checkout', booking });
  };

  const doCheckout = async () => {
    setLoading(true);
    try {
      await api.patch(`/bookings/${modal.booking._id}/checkout`, formData);
      showToast('Checked out. Room released. SMS sent.');
      setModal(null); load();
    } finally { setLoading(false); }
  };

  const openCancel = (booking) => {
    setFormData({ cancelReason: '' });
    setModal({ type: 'cancel', booking });
  };

  const doCancel = async () => {
    if (!formData.cancelReason?.trim()) return alert('Cancellation reason is required.');
    setLoading(true);
    try {
      await api.patch(`/bookings/${modal.booking._id}/cancel`, { cancelReason: formData.cancelReason });
      showToast('Booking cancelled. SMS sent.');
      setModal(null); load();
    } finally { setLoading(false); }
  };

  const getActions = (b) => {
    if (b.status === 'Pending') return (
      <>
        <button style={s.abt('green')} onClick={() => openApprove(b)}>Approve &amp; assign room</button>
        <button style={s.abt('red')}   onClick={() => openCancel(b)}>Cancel</button>
      </>
    );
    if (b.status === 'Approved') return (
      <>
        <button style={s.abt('blue')} onClick={() => doCheckin(b)}>Check in</button>
        <button style={s.abt('red')}  onClick={() => openCancel(b)}>Cancel</button>
      </>
    );
    if (b.status === 'Checked In') return (
      <>
        <button style={s.abt('blue')} onClick={() => openCheckout(b)}>Check out</button>
        <button style={s.abt('red')}  onClick={() => openCancel(b)}>Cancel / early checkout</button>
      </>
    );
    return <span style={{ fontSize: 12, color: 'var(--text-3)' }}>—</span>;
  };

  return (
    <div>
      <div style={styles.pageHeader}>
        <h2 style={styles.pageTitle}>Bookings</h2>
        <p style={styles.pageSub}>Manage approvals, room assignment, checkout and cancellation</p>
      </div>

      <div style={styles.filterRow}>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={styles.sel}>
          <option value="">All statuses</option>
          {['Pending','Approved','Checked In','Checked Out','Cancelled','Rejected'].map(s => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <select value={filterCat} onChange={e => setFilterCat(e.target.value)} style={styles.sel}>
          <option value="">All categories</option>
          <option value="1">Category 1 — Up to Lt Col</option>
          <option value="2">Category 2 — Colonel & Brigadier</option>
          <option value="3">Category 3 — Colonel &amp; above</option>
        </select>
      </div>

      <div style={styles.card}>
        <table style={styles.table}>
          <thead>
            <tr>
              {['Ref','Officer','Rank / Unit','Cat','Room','Check-in','Check-out','Status','Actions'].map(h => (
                <th key={h} style={styles.th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {bookings.map(b => (
              <tr key={b._id}>
                <td style={{ ...styles.td, color: 'var(--text-3)', fontSize: 12 }}>{b.ref}</td>
                <td style={{ ...styles.td, fontWeight: 500 }}>{b.officer.name}</td>
                <td style={{ ...styles.td, color: 'var(--text-2)', fontSize: 12 }}>
                  {b.officer.rank}<br />{b.officer.unit}
                </td>
                <td style={styles.td}>
                  <span style={{ fontSize: 11, padding: '2px 7px', borderRadius: 99,
                    background: ['','var(--blue-bg)','var(--amber-bg)','var(--green-bg)'][b.category],
                    color: ['','var(--blue-text)','var(--amber-text)','var(--green-text)'][b.category] }}>
                    {CAT_LABELS[b.category]}
                  </span>
                </td>
                <td style={{ ...styles.td, fontSize: 13 }}>
                  {b.room?.number || <span style={{ color: 'var(--text-3)', fontSize: 12 }}>Not assigned</span>}
                </td>
                <td style={{ ...styles.td, fontSize: 12, color: 'var(--text-2)' }}>{b.checkin}</td>
                <td style={{ ...styles.td, fontSize: 12, color: 'var(--text-2)' }}>{b.actualCheckout || b.checkout}</td>
                <td style={styles.td}>
                  <Badge status={b.status} />
                  {b.cancelReason && <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 3 }}>{b.cancelReason}</div>}
                </td>
                <td style={{ ...styles.td, whiteSpace: 'nowrap' }}>{getActions(b)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Approve Modal */}
      {modal?.type === 'approve' && (
        <Modal title="Approve & assign room" onClose={() => setModal(null)}>
          <InfoRow label="Officer" value={`${modal.booking.officer.rank} ${modal.booking.officer.name}`} />
          <InfoRow label="Unit"    value={modal.booking.officer.unit} />
          <InfoRow label="Stay"    value={`${modal.booking.checkin} → ${modal.booking.checkout}`} />
          <div style={{ marginTop: 16 }}>
            <label style={styles.label}>Assign room</label>
            {availRooms.length === 0
              ? <p style={{ color: 'var(--red-text)', fontSize: 13, marginTop: 6 }}>No rooms available.</p>
              : <select style={{ ...styles.input, marginTop: 6 }} value={formData.roomId}
                  onChange={e => setFormData(f => ({ ...f, roomId: e.target.value }))}>
                  <option value="">-- Select a room --</option>
                  {[1,2,3].map(cat => {
                    const catRooms = availRooms.filter(r => r.category === cat);
                    if (catRooms.length === 0) return null;
                    return (
                      <optgroup key={cat} label={cat === 1 ? 'Category 1 — Up to Lt Col' : cat === 2 ? 'Category 2 — Colonel & Brigadier' : 'Category 3 — Brigadier & above'}>
                      {catRooms.map(r => <option key={r._id} value={r._id}>{r.name} ({r.number})</option>)}
                      </optgroup>
                      );
                     })}
                   </select>
                }
          </div>
          <ModalActions>
            <button style={s.mBtn('gray')} onClick={() => setModal(null)}>Cancel</button>
            <button style={s.mBtn('blue')} onClick={doApprove} disabled={loading || !availRooms.length}>
              {loading ? 'Saving…' : 'Approve & send SMS'}
            </button>
          </ModalActions>
        </Modal>
      )}

      {/* Checkout Modal */}
      {modal?.type === 'checkout' && (
        <Modal title="Check out officer" onClose={() => setModal(null)}>
          <InfoRow label="Officer" value={`${modal.booking.officer.rank} ${modal.booking.officer.name}`} />
          <InfoRow label="Room"    value={modal.booking.room?.number || '—'} />
          <InfoRow label="Scheduled checkout" value={modal.booking.checkout} />
          <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={styles.label}>Actual checkout date</label>
              <input type="date" style={{ ...styles.input, marginTop: 6 }} value={formData.actualCheckout}
                onChange={e => setFormData(f => ({ ...f, actualCheckout: e.target.value }))} />
            </div>
            <div>
              <label style={styles.label}>Notes (optional)</label>
              <textarea rows={2} style={{ ...styles.input, marginTop: 6, resize: 'vertical' }}
                placeholder="Any remarks…"
                value={formData.notes}
                onChange={e => setFormData(f => ({ ...f, notes: e.target.value }))} />
            </div>
          </div>
          <ModalActions>
            <button style={s.mBtn('gray')} onClick={() => setModal(null)}>Cancel</button>
            <button style={s.mBtn('blue')} onClick={doCheckout} disabled={loading}>
              {loading ? 'Saving…' : 'Confirm checkout & send SMS'}
            </button>
          </ModalActions>
        </Modal>
      )}

      {/* Cancel Modal */}
      {modal?.type === 'cancel' && (
        <Modal title="Cancel booking" onClose={() => setModal(null)}>
          <InfoRow label="Officer" value={`${modal.booking.officer.rank} ${modal.booking.officer.name}`} />
          <InfoRow label="Status"  value={<Badge status={modal.booking.status} />} />
          {modal.booking.room && <InfoRow label="Room" value={`${modal.booking.room?.number} — will be released`} />}
          <div style={{ marginTop: 16 }}>
            <label style={styles.label}>Reason for cancellation (required)</label>
            <textarea rows={3} style={{ ...styles.input, marginTop: 6, resize: 'vertical' }}
              placeholder="e.g. Officer posted out, travel plans changed…"
              value={formData.cancelReason}
              onChange={e => setFormData(f => ({ ...f, cancelReason: e.target.value }))} />
          </div>
          <ModalActions>
            <button style={s.mBtn('gray')} onClick={() => setModal(null)}>Go back</button>
            <button style={s.mBtn('red')} onClick={doCancel} disabled={loading}>
              {loading ? 'Saving…' : 'Confirm cancellation & send SMS'}
            </button>
          </ModalActions>
        </Modal>
      )}

      {/* SMS Toast */}
      {toast && (
        <div style={styles.toast}>
          📱 {toast}
        </div>
      )}
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0',
      borderBottom: '0.5px solid var(--border)', fontSize: 13 }}>
      <span style={{ color: 'var(--text-2)' }}>{label}</span>
      <span>{value}</span>
    </div>
  );
}

function ModalActions({ children }) {
  return <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20 }}>{children}</div>;
}

const s = {
  abt: (color) => ({
    background: 'none',
    border: `0.5px solid var(--${color === 'green' ? 'green' : color === 'red' ? 'red' : 'blue'})`,
    borderRadius: 'var(--radius-sm)',
    padding: '4px 10px',
    fontSize: 12,
    color: `var(--${color === 'green' ? 'green' : color === 'red' ? 'red' : 'blue'})`,
    marginRight: 4,
    cursor: 'pointer',
    transition: 'all 0.15s',
    whiteSpace: 'nowrap',
  }),
  mBtn: (variant) => {
    const map = {
      blue: { bg: 'var(--blue)',    color: '#fff' },
      red:  { bg: 'var(--red)',     color: '#fff' },
      gray: { bg: 'var(--surface)', color: 'var(--text-1)', border: '0.5px solid var(--border-md)' },
    };
    const v = map[variant] || map.gray;
    return {
      padding: '8px 18px', fontSize: 13, borderRadius: 'var(--radius-md)',
      cursor: 'pointer', border: v.border || 'none',
      background: v.bg, color: v.color, fontFamily: 'inherit',
    };
  },
};

const styles = {
  pageHeader: { marginBottom: 20 },
  pageTitle:  { fontSize: 22, fontWeight: 500, color: 'var(--text-1)' },
  pageSub:    { fontSize: 13, color: 'var(--text-3)', marginTop: 4 },
  filterRow:  { display: 'flex', gap: 8, marginBottom: 16 },
  sel: {
    fontSize: 13, padding: '7px 10px',
    border: '0.5px solid var(--border-md)',
    borderRadius: 'var(--radius-md)',
    background: 'var(--surface)', color: 'var(--text-1)',
  },
  card: {
    background: 'var(--surface)', border: '0.5px solid var(--border)',
    borderRadius: 'var(--radius-lg)', overflow: 'hidden',
  },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 13 },
  th: {
    textAlign: 'left', padding: '9px 12px', fontSize: 12,
    color: 'var(--text-3)', borderBottom: '0.5px solid var(--border)', fontWeight: 500,
  },
  td: { padding: '10px 12px', borderBottom: '0.5px solid var(--border)', color: 'var(--text-1)', verticalAlign: 'middle' },
  label: { fontSize: 12, fontWeight: 500, color: 'var(--text-2)' },
  input: {
    display: 'block', width: '100%', padding: '8px 12px', fontSize: 13,
    border: '0.5px solid var(--border-md)', borderRadius: 'var(--radius-md)',
    background: 'var(--surface)', color: 'var(--text-1)', outline: 'none',
  },
  toast: {
    position: 'fixed', bottom: 24, right: 24,
    background: 'var(--green)', color: '#fff',
    padding: '10px 18px', borderRadius: 'var(--radius-md)',
    fontSize: 13, zIndex: 2000,
    boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
  },
};
