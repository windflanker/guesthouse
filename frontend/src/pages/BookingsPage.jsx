import { useEffect, useState } from 'react';
import { api } from '../utils/api.js';
import Badge from '../components/Badge.jsx';
import Modal from '../components/Modal.jsx';

const CAT_LABELS = { 1: 'Cat 1', 2: 'Cat 2', 3: 'Cat 3' };

function WhatsAppBox({ mobile, message, onConfirmed }) {
  const [copiedMsg, setCopiedMsg] = useState(false);
  const [copiedNum, setCopiedNum] = useState(false);
  const [sentStatus, setSentStatus] = useState('no');

  const copyText = (text, setter) => {
    navigator.clipboard.writeText(text);
    setter(true);
    setTimeout(() => setter(false), 2000);
  };

  const handleSentChange = (e) => {
    setSentStatus(e.target.value);
    if (e.target.value === 'yes') onConfirmed(true);
    else onConfirmed(false);
  };

  return (
    <div style={ws.box}>
      <div style={ws.header}>
        <span style={ws.icon}>💬</span>
        <span style={ws.title}>WhatsApp Message to send</span>
      </div>

      <div style={ws.field}>
        <div style={ws.label}>Mobile Number</div>
        <div style={ws.row}>
          <div style={ws.value}>{mobile}</div>
          <button style={ws.copyBtn} onClick={() => copyText(mobile, setCopiedNum)}>
            {copiedNum ? '✓ Copied' : 'Copy'}
          </button>
        </div>
      </div>

      <div style={ws.field}>
        <div style={ws.label}>Message</div>
        <div style={ws.msgBox}>{message}</div>
        <button style={ws.copyBtnFull} onClick={() => copyText(message, setCopiedMsg)}>
          {copiedMsg ? '✓ Message Copied!' : '📋 Copy Message'}
        </button>
      </div>

      <div style={ws.confirmField}>
        <div style={ws.label}>Have you sent this message on WhatsApp?</div>
        <select style={ws.confirmSelect} value={sentStatus} onChange={handleSentChange}>
          <option value="no">❌ Not sent yet</option>
          <option value="yes">✅ Yes, message sent</option>
        </select>
      </div>

      <div style={ws.hint}>
        Copy the number → open WhatsApp → paste number → send message → confirm above
      </div>
    </div>
  );
}

const ws = {
  box: {
    background: '#E7F5E9', border: '1px solid #A5D6A7',
    borderRadius: 10, padding: '14px 16px', marginTop: 16,
  },
  header: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 },
  icon: { fontSize: 20 },
  title: { fontSize: 13, fontWeight: 600, color: '#2E7D32' },
  field: { marginBottom: 10 },
  label: { fontSize: 11, fontWeight: 600, color: '#388E3C', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' },
  row: { display: 'flex', alignItems: 'center', gap: 8 },
  value: { fontSize: 14, fontWeight: 500, color: '#1A1917', flex: 1, background: '#fff', padding: '6px 10px', borderRadius: 6 },
  msgBox: {
    fontSize: 13, color: '#1A1917', background: '#fff',
    padding: '10px 12px', borderRadius: 6, lineHeight: 1.6,
    border: '0.5px solid #C8E6C9', whiteSpace: 'pre-wrap',
  },
  copyBtn: {
    background: '#2E7D32', color: '#fff', border: 'none',
    borderRadius: 6, padding: '6px 12px', fontSize: 12,
    cursor: 'pointer', whiteSpace: 'nowrap',
  },
  copyBtnFull: {
    marginTop: 8, width: '100%', background: '#2E7D32', color: '#fff',
    border: 'none', borderRadius: 6, padding: '8px', fontSize: 13,
    cursor: 'pointer', fontWeight: 500,
  },
  confirmField: { marginTop: 12, marginBottom: 8 },
  confirmSelect: {
    width: '100%', padding: '8px 12px', fontSize: 13,
    border: '1px solid #A5D6A7', borderRadius: 6,
    background: '#fff', color: '#1A1917', marginTop: 4,
  },
  hint: {
    fontSize: 10, color: '#558B2F', marginTop: 8,
    borderTop: '0.5px solid #C8E6C9', paddingTop: 8, textAlign: 'center',
  },
};

function buildMessage(type, booking) {
  switch (type) {
    case 'approve':
      return `Dear ${booking.officer.name},\n\nYour request for guest room from ${booking.checkin} to ${booking.checkout} is confirmed. The Guest Room NCO shall reach out and get in touch please.\n\nRegards`;
    case 'reject':
      return `Dear ${booking.officer.name},\n\nYour request for guest room from ${booking.checkin} to ${booking.checkout} has not been confirmed. For further details please contact the Guest House office.\n\nRegards`;
    case 'cancel':
      return `Dear ${booking.officer.name},\n\nYour request for guest room from ${booking.checkin} to ${booking.checkout} has been cancelled. For further details please contact the Guest House office.\n\nRegards`;
    default:
      return '';
  }
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [modal, setModal] = useState(null);
  const [availRooms, setAvailRooms] = useState([]);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const [actionDone, setActionDone] = useState(false);
  const [msgConfirmed, setMsgConfirmed] = useState(false);

  const load = () => {
    const params = new URLSearchParams();
    if (filterStatus) params.set('status', filterStatus);
    if (filterCat) params.set('category', filterCat);
    api.get('/bookings?' + params).then(setBookings).catch(console.error);
  };

  useEffect(load, [filterStatus, filterCat]);

  const openApprove = async (booking) => {
    const rooms = await api.get(`/rooms/available/all?checkin=${booking.checkin}&checkout=${booking.checkout}`);
    setAvailRooms(rooms);
    setFormData({ roomId: rooms[0]?._id || '' });
    setActionDone(false);
    setMsgConfirmed(false);
    setModal({ type: 'approve', booking });
  };

  const openEdit = async (booking) => {
    const rooms = await api.get(`/rooms/available/all?checkin=${booking.checkin}&checkout=${booking.checkout}`);
    if (booking.room) {
      const currentRoom = { _id: booking.room._id, name: booking.room.name, number: booking.room.number, category: booking.room.category };
      const alreadyIn = rooms.find(r => r._id === booking.room._id);
      if (!alreadyIn) rooms.unshift(currentRoom);
    }
    setAvailRooms(rooms);
    setFormData({ roomId: booking.room?._id || '' });
    setActionDone(false);
    setMsgConfirmed(false);
    setModal({ type: 'edit', booking });
  };

  const doApprove = async () => {
    if (!formData.roomId) return alert('Please select a room.');
    setLoading(true);
    try {
      await api.patch(`/bookings/${modal.booking._id}/approve`, { roomId: formData.roomId });
      setActionDone(true);
      setModal(m => ({ ...m, whatsappMsg: buildMessage('approve', modal.booking), done: true }));
      load();
    } catch (err) {
      alert(err.message);
    } finally { setLoading(false); }
  };

  const doEdit = async () => {
    if (!formData.roomId) return alert('Please select a room.');
    setLoading(true);
    try {
      await api.patch(`/bookings/${modal.booking._id}/reassign`, { roomId: formData.roomId });
      setActionDone(true);
      load();
    } catch (err) {
      alert(err.message);
    } finally { setLoading(false); }
  };

  const openReject = (booking) => {
    setActionDone(false);
    setMsgConfirmed(false);
    setModal({ type: 'reject', booking });
  };

  const doReject = async () => {
    setLoading(true);
    try {
      await api.patch(`/bookings/${modal.booking._id}/reject`);
      setActionDone(true);
      setModal(m => ({ ...m, whatsappMsg: buildMessage('reject', modal.booking), done: true }));
      load();
    } catch (err) {
      alert(err.message);
    } finally { setLoading(false); }
  };

  const openCancel = (booking) => {
    setFormData({ cancelReason: '' });
    setActionDone(false);
    setMsgConfirmed(false);
    setModal({ type: 'cancel', booking });
  };

  const doCancel = async () => {
    if (!formData.cancelReason?.trim()) return alert('Cancellation reason is required.');
    setLoading(true);
    try {
      await api.patch(`/bookings/${modal.booking._id}/cancel`, { cancelReason: formData.cancelReason });
      const bookingWithReason = { ...modal.booking, cancelReason: formData.cancelReason };
      setActionDone(true);
      setModal(m => ({ ...m, whatsappMsg: buildMessage('cancel', bookingWithReason), done: true }));
      load();
    } catch (err) {
      alert(err.message);
    } finally { setLoading(false); }
  };

  const closeModal = () => {
    setModal(null);
    setActionDone(false);
    setMsgConfirmed(false);
  };

  const getActions = (b) => {
    if (b.status === 'Pending') return (
      <>
        <button style={s.abt('green')} onClick={() => openApprove(b)}>Approve &amp; assign room</button>
        <button style={s.abt('red')} onClick={() => openReject(b)}>Reject</button>
        <button style={s.abt('red')} onClick={() => openCancel(b)}>Cancel</button>
      </>
    );
    if (b.status === 'Approved') return (
      <>
        <button style={s.abt('blue')} onClick={() => openEdit(b)}>Edit room</button>
        <button style={s.abt('red')} onClick={() => openCancel(b)}>Cancel</button>
      </>
    );
    if (b.status === 'Checked In') return (
      <span style={{ fontSize: 12, color: 'var(--text-3)' }}>—</span>
    );
    return <span style={{ fontSize: 12, color: 'var(--text-3)' }}>—</span>;
  };

  const roomDropdown = (includeLabel) => (
    <div style={{ marginTop: includeLabel ? 16 : 0 }}>
      {includeLabel && <label style={styles.label}>Assign room</label>}
      {availRooms.length === 0
        ? <p style={{ color: 'var(--red-text)', fontSize: 13, marginTop: 6 }}>No rooms available for these dates.</p>
        : <select style={{ ...styles.input, marginTop: 6 }} value={formData.roomId}
            onChange={e => setFormData(f => ({ ...f, roomId: e.target.value }))}>
            <option value="">-- Select a room --</option>
            {[1, 2, 3].map(cat => {
              const catRooms = availRooms.filter(r => r.category === cat);
              if (catRooms.length === 0) return null;
              return (
                <optgroup key={cat} label={
                  cat === 1 ? 'Category 1 — Up to Lt Col' :
                  cat === 2 ? 'Category 2 — Colonel & Brigadier' :
                  'Category 3 — Brigadier & above'
                }>
                  {catRooms.map(r => (
                    <option key={r._id} value={r._id}>{r.name} ({r.number})</option>
                  ))}
                </optgroup>
              );
            })}
          </select>
      }
    </div>
  );

  return (
    <div>
      <div style={styles.pageHeader}>
        <h2 style={styles.pageTitle}>Bookings</h2>
        <p style={styles.pageSub}>Manage approvals, room assignment and cancellations</p>
      </div>

      <div style={styles.filterRow}>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={styles.sel}>
          <option value="">All statuses</option>
          {['Pending', 'Approved', 'Checked In', 'Checked Out', 'Cancelled', 'Rejected'].map(s => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <select value={filterCat} onChange={e => setFilterCat(e.target.value)} style={styles.sel}>
          <option value="">All categories</option>
          <option value="1">Category 1 — Up to Lt Col</option>
          <option value="2">Category 2 — Colonel &amp; Brigadier</option>
          <option value="3">Category 3 — Brigadier &amp; above</option>
        </select>
      </div>

      <div style={styles.card} className="table-wrap">
        <table style={styles.table} className="bookings-table">
          <thead>
            <tr>
              {['Ref', 'Officer', 'Rank / Unit', 'Cat', 'Room', 'Check-in', 'Check-out', 'Status', 'Actions'].map(h => (
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
                  <span style={{
                    fontSize: 11, padding: '2px 7px', borderRadius: 99,
                    background: ['', 'var(--blue-bg)', 'var(--amber-bg)', 'var(--green-bg)'][b.category],
                    color: ['', 'var(--blue-text)', 'var(--amber-text)', 'var(--green-text)'][b.category],
                  }}>
                    {CAT_LABELS[b.category]}
                  </span>
                </td>
                <td style={{ ...styles.td, fontSize: 13 }}>
                  {b.room
                    ? <span><strong>{b.room.name}</strong> <span style={{ color: 'var(--text-3)', fontSize: 11 }}>({b.room.number})</span></span>
                    : <span style={{ color: 'var(--text-3)', fontSize: 12 }}>Not assigned</span>}
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
        <Modal title="Approve & assign room" onClose={closeModal}>
          {!actionDone ? (
            <>
              <InfoRow label="Officer" value={`${modal.booking.officer.rank} ${modal.booking.officer.name}`} />
              <InfoRow label="Unit" value={modal.booking.officer.unit} />
              <InfoRow label="Mobile" value={modal.booking.officer.mobile} />
              <InfoRow label="Stay" value={`${modal.booking.checkin} → ${modal.booking.checkout}`} />
              {roomDropdown(true)}
              <ModalActions>
                <button style={s.mBtn('gray')} onClick={closeModal}>Cancel</button>
                <button style={s.mBtn('blue')} onClick={doApprove} disabled={loading || !formData.roomId}>
                  {loading ? 'Saving…' : 'Approve & assign room'}
                </button>
              </ModalActions>
            </>
          ) : (
            <>
              <div style={doneBox}>✅ Booking approved successfully!</div>
              <WhatsAppBox
                mobile={modal.booking.officer.mobile}
                message={modal.whatsappMsg}
                onConfirmed={setMsgConfirmed}
              />
              <ModalActions>
                <button style={s.mBtn('blue')} onClick={closeModal}>
                  {msgConfirmed ? '✓ Done — Message Sent' : 'Done'}
                </button>
              </ModalActions>
            </>
          )}
        </Modal>
      )}

      {/* Edit Room Modal */}
      {modal?.type === 'edit' && (
        <Modal title="Edit room assignment" onClose={closeModal}>
          {!actionDone ? (
            <>
              <InfoRow label="Officer" value={`${modal.booking.officer.rank} ${modal.booking.officer.name}`} />
              <InfoRow label="Current room" value={modal.booking.room ? `${modal.booking.room.name} (${modal.booking.room.number})` : 'Not assigned'} />
              <InfoRow label="Stay" value={`${modal.booking.checkin} → ${modal.booking.checkout}`} />
              <InfoRow label="Status" value={<Badge status={modal.booking.status} />} />
              {roomDropdown(true)}
              <ModalActions>
                <button style={s.mBtn('gray')} onClick={closeModal}>Cancel</button>
                <button style={s.mBtn('blue')} onClick={doEdit} disabled={loading || !formData.roomId}>
                  {loading ? 'Saving…' : 'Update room assignment'}
                </button>
              </ModalActions>
            </>
          ) : (
            <>
              <div style={doneBox}>✅ Room assignment updated successfully!</div>
              <ModalActions>
                <button style={s.mBtn('blue')} onClick={closeModal}>Done</button>
              </ModalActions>
            </>
          )}
        </Modal>
      )}

      {/* Reject Modal */}
      {modal?.type === 'reject' && (
        <Modal title="Reject booking" onClose={closeModal}>
          {!actionDone ? (
            <>
              <InfoRow label="Officer" value={`${modal.booking.officer.rank} ${modal.booking.officer.name}`} />
              <InfoRow label="Mobile" value={modal.booking.officer.mobile} />
              <InfoRow label="Stay" value={`${modal.booking.checkin} → ${modal.booking.checkout}`} />
              <ModalActions>
                <button style={s.mBtn('gray')} onClick={closeModal}>Cancel</button>
                <button style={s.mBtn('red')} onClick={doReject} disabled={loading}>
                  {loading ? 'Saving…' : 'Confirm rejection'}
                </button>
              </ModalActions>
            </>
          ) : (
            <>
              <div style={doneBox}>✅ Booking rejected.</div>
              <WhatsAppBox
                mobile={modal.booking.officer.mobile}
                message={modal.whatsappMsg}
                onConfirmed={setMsgConfirmed}
              />
              <ModalActions>
                <button style={s.mBtn('blue')} onClick={closeModal}>
                  {msgConfirmed ? '✓ Done — Message Sent' : 'Done'}
                </button>
              </ModalActions>
            </>
          )}
        </Modal>
      )}

      {/* Cancel Modal */}
      {modal?.type === 'cancel' && (
        <Modal title="Cancel booking" onClose={closeModal}>
          {!actionDone ? (
            <>
              <InfoRow label="Officer" value={`${modal.booking.officer.rank} ${modal.booking.officer.name}`} />
              <InfoRow label="Mobile" value={modal.booking.officer.mobile} />
              <InfoRow label="Status" value={<Badge status={modal.booking.status} />} />
              {modal.booking.room && <InfoRow label="Room" value={`${modal.booking.room?.name} — will be released`} />}
              <div style={{ marginTop: 16 }}>
                <label style={styles.label}>Reason for cancellation (required)</label>
                <textarea rows={3} style={{ ...styles.input, marginTop: 6, resize: 'vertical' }}
                  placeholder="e.g. Officer posted out, travel plans changed…"
                  value={formData.cancelReason}
                  onChange={e => setFormData(f => ({ ...f, cancelReason: e.target.value }))} />
              </div>
              <ModalActions>
                <button style={s.mBtn('gray')} onClick={closeModal}>Go back</button>
                <button style={s.mBtn('red')} onClick={doCancel} disabled={loading}>
                  {loading ? 'Saving…' : 'Confirm cancellation'}
                </button>
              </ModalActions>
            </>
          ) : (
            <>
              <div style={doneBox}>✅ Booking cancelled.</div>
              <WhatsAppBox
                mobile={modal.booking.officer.mobile}
                message={modal.whatsappMsg}
                onConfirmed={setMsgConfirmed}
              />
              <ModalActions>
                <button style={s.mBtn('blue')} onClick={closeModal}>
                  {msgConfirmed ? '✓ Done — Message Sent' : 'Done'}
                </button>
              </ModalActions>
            </>
          )}
        </Modal>
      )}
    </div>
  );
}

const doneBox = {
  background: '#EAF3DE', border: '0.5px solid #97C459',
  borderRadius: 8, padding: '10px 14px',
  fontSize: 13, color: '#3B6D11', marginBottom: 4,
};

function InfoRow({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '0.5px solid var(--border)', fontSize: 13 }}>
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
    border: `0.5px solid ${color === 'green' ? '#1D9E75' : color === 'red' ? '#E24B4A' : '#185FA5'}`,
    borderRadius: 'var(--radius-sm)',
    padding: '4px 10px', fontSize: 12,
    color: color === 'green' ? '#1D9E75' : color === 'red' ? '#E24B4A' : '#185FA5',
    marginRight: 4, cursor: 'pointer', whiteSpace: 'nowrap',
  }),
  mBtn: (variant) => {
    const map = {
      blue: { bg: 'var(--blue)', color: '#fff' },
      red: { bg: 'var(--red)', color: '#fff' },
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
  pageTitle: { fontSize: 22, fontWeight: 500, color: 'var(--text-1)' },
  pageSub: { fontSize: 13, color: 'var(--text-3)', marginTop: 4 },
  filterRow: { display: 'flex', gap: 8, marginBottom: 16 },
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
};
