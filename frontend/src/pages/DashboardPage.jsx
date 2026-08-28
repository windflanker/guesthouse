import { useEffect, useState } from 'react';
import { api } from '../utils/api.js';
import Badge from '../components/Badge.jsx';
import Modal from '../components/Modal.jsx';

const CAT_LABELS = { 1: 'Cat 1', 2: 'Cat 2', 3: 'Cat 3' };
const DOMI_ROOMS = ['R-113', 'R-114', 'R-115', 'R-116'];
const ITEMS_PER_PAGE = 12;

const overlay     = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 };
const popupBox    = { background: '#fff', borderRadius: 14, width: '100%', maxWidth: 480, maxHeight: '85vh', overflow: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' };
const popupHeader = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '0.5px solid rgba(0,0,0,0.1)' };
const popupTitle  = { fontSize: 16, fontWeight: 600, color: '#1A1917' };
const closeBtn    = { background: 'none', border: 'none', fontSize: 18, color: '#9A9895', cursor: 'pointer', padding: '2px 6px' };
const popupBody   = { padding: '8px 20px' };
const detailRow   = { display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: '0.5px solid rgba(0,0,0,0.06)', fontSize: 13, gap: 12 };
const detailLabel = { color: '#9A9895', minWidth: 100, flexShrink: 0 };
const detailVal   = { color: '#1A1917', textAlign: 'right', wordBreak: 'break-all' };
const doneBtn     = { background: '#185FA5', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 20px', fontSize: 13, cursor: 'pointer' };

function getSalutation() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 16) return 'Good Afternoon';
  return 'Good Evening';
}

function isDomiRoom(booking) {
  if (!booking?.room) return false;
  return DOMI_ROOMS.includes(booking.room.number);
}

function buildGuestMessage(booking) {
  return `Dear ${booking.officer.rank} ${booking.officer.name},\nYour request for guest room accommodation at DOMI from ${booking.checkin} to ${booking.checkout} is confirmed.\n\nThe Guest Room NCO will get in touch with you shortly.\nRegards`;
}

function buildNCOMessage(booking) {
  return `${booking.officer.rank} ${booking.officer.name} of ${booking.officer.unit} is expected to arrive at DOMI.\nCheck-in: ${booking.checkin}\nCheck-out: ${booking.checkout}\nExpected Arrival Time: ${booking.officer.arrivalTime || '—'}\nMobile: ${booking.officer.mobile}\nPlease make necessary arrangements.\nRegards`;
}

function buildCatererMessage(booking) {
  return `${getSalutation()},\nPlease be informed that a guest is expected at DOMI.\nCheck-in: ${booking.checkin}\nCheck-out: ${booking.checkout}\nExpected Arrival Time: ${booking.officer.arrivalTime || '—'}\nPlease make necessary arrangements for meals.\nRegards`;
}

function buildMessage(type, booking) {
  switch (type) {
    case 'approve':
      if (isDomiRoom(booking)) return buildGuestMessage(booking);
      return `Dear ${booking.officer.rank} ${booking.officer.name},\n\nYour request for guest room from ${booking.checkin} to ${booking.checkout} is confirmed. The Guest Room NCO shall reach out and get in touch please.\n\nRegards`;
    case 'reject':
      return `Dear ${booking.officer.rank} ${booking.officer.name},\n\nYour request for guest room from ${booking.checkin} to ${booking.checkout} has not been confirmed. For further details please contact the Guest House office.\n\nRegards`;
    case 'cancel':
      return `Dear ${booking.officer.rank} ${booking.officer.name},\n\nYour request for guest room from ${booking.checkin} to ${booking.checkout} has been cancelled. For further details please contact the Guest House office.\n\nRegards`;
    default:
      return '';
  }
}

function WhatsAppBox({ mobile, label, message, onConfirmed, confirmed }) {
  const [copiedMsg, setCopiedMsg] = useState(false);
  const [copiedNum, setCopiedNum] = useState(false);

  const copyText = (text, setter) => {
    navigator.clipboard.writeText(text);
    setter(true);
    setTimeout(() => setter(false), 2000);
  };

  return (
    <div style={ws.box}>
      <div style={ws.header}>
        <span style={ws.icon}>💬</span>
        <span style={ws.title}>{label}</span>
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
        <select style={ws.confirmSelect} value={confirmed ? 'yes' : 'no'}
          onChange={e => onConfirmed(e.target.value === 'yes')}>
          <option value="no">❌ Not sent yet</option>
          <option value="yes">✅ Yes, message sent</option>
        </select>
      </div>
    </div>
  );
}

const ws = {
  box:           { background: '#E7F5E9', border: '1px solid #A5D6A7', borderRadius: 10, padding: '14px 16px', marginTop: 16 },
  header:        { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 },
  icon:          { fontSize: 20 },
  title:         { fontSize: 13, fontWeight: 600, color: '#2E7D32' },
  field:         { marginBottom: 10 },
  label:         { fontSize: 11, fontWeight: 600, color: '#388E3C', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' },
  row:           { display: 'flex', alignItems: 'center', gap: 8 },
  value:         { fontSize: 14, fontWeight: 500, color: '#1A1917', flex: 1, background: '#fff', padding: '6px 10px', borderRadius: 6 },
  msgBox:        { fontSize: 13, color: '#1A1917', background: '#fff', padding: '10px 12px', borderRadius: 6, lineHeight: 1.6, border: '0.5px solid #C8E6C9', whiteSpace: 'pre-wrap' },
  copyBtn:       { background: '#2E7D32', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 12px', fontSize: 12, cursor: 'pointer', whiteSpace: 'nowrap' },
  copyBtnFull:   { marginTop: 8, width: '100%', background: '#2E7D32', color: '#fff', border: 'none', borderRadius: 6, padding: '8px', fontSize: 13, cursor: 'pointer', fontWeight: 500 },
  confirmField:  { marginTop: 12, marginBottom: 8 },
  confirmSelect: { width: '100%', padding: '8px 12px', fontSize: 13, border: '1px solid #A5D6A7', borderRadius: 6, background: '#fff', color: '#1A1917', marginTop: 4 },
};

export default function BookingsPage() {
  const [bookings, setBookings]         = useState([]);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterCat, setFilterCat]       = useState('');
  const [currentPage, setCurrentPage]   = useState(1);
  const [modal, setModal]               = useState(null);
  const [availRooms, setAvailRooms]     = useState([]);
  const [formData, setFormData]         = useState({});
  const [loading, setLoading]           = useState(false);
  const [actionDone, setActionDone]     = useState(false);
  const [detailPopup, setDetailPopup]   = useState(null);

  const [guestConfirmed,   setGuestConfirmed]   = useState(false);
  const [ncoConfirmed,     setNcoConfirmed]     = useState(false);
  const [catererConfirmed, setCatererConfirmed] = useState(false);

  const allConfirmed = (booking) => {
    if (isDomiRoom(booking)) return guestConfirmed && ncoConfirmed && catererConfirmed;
    return guestConfirmed;
  };

  const load = () => {
    const params = new URLSearchParams();
    if (filterStatus) params.set('status', filterStatus);
    if (filterCat)    params.set('category', filterCat);
    api.get('/bookings?' + params).then(setBookings).catch(console.error);
  };

  useEffect(load, [filterStatus, filterCat]);
  useEffect(() => { setCurrentPage(1); }, [filterStatus, filterCat]);

  const resetConfirmed = () => {
    setGuestConfirmed(false);
    setNcoConfirmed(false);
    setCatererConfirmed(false);
  };

  const openApprove = async (booking) => {
    const rooms = await api.get(`/rooms/available/all?checkin=${booking.checkin}&checkout=${booking.checkout}`);
    setAvailRooms(rooms);
    setFormData({ roomId: rooms[0]?._id || '' });
    setActionDone(false);
    resetConfirmed();
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
    resetConfirmed();
    setModal({ type: 'edit', booking });
  };

  const doApprove = async () => {
    if (!formData.roomId) return alert('Please select a room.');
    setLoading(true);
    try {
      const updated = await api.patch(`/bookings/${modal.booking._id}/approve`, { roomId: formData.roomId });
      setActionDone(true);
      setModal(m => ({ ...m, booking: { ...m.booking, room: updated.room }, done: true }));
      load();
    } catch (err) { alert(err.message); }
    finally { setLoading(false); }
  };

  const doEdit = async () => {
    if (!formData.roomId) return alert('Please select a room.');
    setLoading(true);
    try {
      await api.patch(`/bookings/${modal.booking._id}/reassign`, { roomId: formData.roomId });
      setActionDone(true);
      load();
    } catch (err) { alert(err.message); }
    finally { setLoading(false); }
  };

  const openReject = (booking) => {
    setActionDone(false);
    resetConfirmed();
    setModal({ type: 'reject', booking });
  };

  const doReject = async () => {
    setLoading(true);
    try {
      await api.patch(`/bookings/${modal.booking._id}/reject`);
      setActionDone(true);
      setModal(m => ({ ...m, whatsappMsg: buildMessage('reject', modal.booking), done: true }));
      load();
    } catch (err) { alert(err.message); }
    finally { setLoading(false); }
  };

  const openCancel = (booking) => {
    setFormData({ cancelReason: '' });
    setActionDone(false);
    resetConfirmed();
    setModal({ type: 'cancel', booking });
  };

  const doCancel = async () => {
    if (!formData.cancelReason?.trim()) return alert('Cancellation reason is required.');
    setLoading(true);
    try {
      await api.patch(`/bookings/${modal.booking._id}/cancel`, { cancelReason: formData.cancelReason });
      setActionDone(true);
      setModal(m => ({ ...m, whatsappMsg: buildMessage('cancel', modal.booking), done: true }));
      load();
    } catch (err) { alert(err.message); }
    finally { setLoading(false); }
  };

  const closeModal = () => { setModal(null); setActionDone(false); resetConfirmed(); };

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
                <optgroup key={cat} label={cat === 1 ? 'Category 1 — Up to Lt Col' : cat === 2 ? 'Category 2 — Colonel & Brigadier' : 'Category 3 — Brigadier & above'}>
                  {catRooms.map(r => <option key={r._id} value={r._id}>{r.name} ({r.number})</option>)}
                </optgroup>
              );
            })}
          </select>
      }
    </div>
  );

  // Pagination
  const totalPages = Math.ceil(bookings.length / ITEMS_PER_PAGE);
  const paginatedBookings = bookings.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <div>
      <div style={styles.pageHeader}>
        <h2 style={styles.pageTitle}>Bookings</h2>
        <p style={styles.pageSub}>
          Manage approvals, room assignment and cancellations. Tap a guest name to see full details.
          {bookings.length > 0 && <span style={{ marginLeft: 8, color: '#9A9895' }}>({bookings.length} total)</span>}
        </p>
      </div>

      <div style={styles.filterRow}>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={styles.sel}>
          <option value="">All statuses</option>
          {['Pending', 'Approved', 'Checked In', 'Checked Out', 'Cancelled', 'Rejected'].map(s => <option key={s}>{s}</option>)}
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
            {paginatedBookings.map(b => (
              <tr key={b._id}>
                <td style={{ ...styles.td, color: 'var(--text-3)', fontSize: 12 }}>{b.ref}</td>
                <td style={{ ...styles.td, fontWeight: 500 }}>
                  <span style={{ cursor: 'pointer', color: '#185FA5', textDecoration: 'underline' }}
                    onClick={() => setDetailPopup(b)}>
                    {b.officer.name}
                  </span>
                </td>
                <td style={{ ...styles.td, color: 'var(--text-2)', fontSize: 12 }}>
                  {b.officer.rank}<br />{b.officer.unit}
                </td>
                <td style={styles.td}>
                  <span style={{ fontSize: 11, padding: '2px 7px', borderRadius: 99, background: ['', 'var(--blue-bg)', 'var(--amber-bg)', 'var(--green-bg)'][b.category], color: ['', 'var(--blue-text)', 'var(--amber-text)', 'var(--green-text)'][b.category] }}>
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={pg.wrap}>
            <div style={pg.info}>
              Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, bookings.length)} of {bookings.length}
            </div>
            <div style={pg.controls}>
              <button style={pg.btn} disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => p - 1)}>← Prev</button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button key={page}
                  style={{ ...pg.btn, ...(page === currentPage ? pg.active : {}) }}
                  onClick={() => setCurrentPage(page)}>
                  {page}
                </button>
              ))}
              <button style={pg.btn} disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => p + 1)}>Next →</button>
            </div>
          </div>
        )}
      </div>

      {/* Guest detail popup */}
      {detailPopup && (
        <div style={overlay} onClick={() => setDetailPopup(null)}>
          <div style={popupBox} onClick={e => e.stopPropagation()}>
            <div style={popupHeader}>
              <div style={popupTitle}>Guest Details — {detailPopup.ref}</div>
              <button style={closeBtn} onClick={() => setDetailPopup(null)}>✕</button>
            </div>
            <div style={popupBody}>
              {[
                ['Full Name',    `${detailPopup.officer.rank} ${detailPopup.officer.name}`],
                ['Unit',          detailPopup.officer.unit],
                ['Reference',     detailPopup.officer.reference || '—'],
                ['Mobile',        detailPopup.officer.mobile],
                ['Email',         detailPopup.officer.email || '—'],
                ['ID Type',       detailPopup.officer.idType || '—'],
                ['ID Number',     detailPopup.officer.idNumber || '—'],
                ['Arrival Time',  detailPopup.officer.arrivalTime || '—'],
                ['Check-in',      detailPopup.checkin],
                ['Check-out',     detailPopup.checkout],
                ['Room',          detailPopup.room ? `${detailPopup.room.name} (${detailPopup.room.number})` : 'Not assigned'],
                ['Status',        detailPopup.status],
              ].map(([label, value]) => (
                <div key={label} style={detailRow}>
                  <span style={detailLabel}>{label}</span>
                  <span style={{ ...detailVal, color: label === 'Mobile' ? '#185FA5' : '#1A1917', fontWeight: label === 'Mobile' ? 600 : 400 }}>{value}</span>
                </div>
              ))}
              {detailPopup.cancelReason && (
                <div style={detailRow}>
                  <span style={detailLabel}>Cancel Reason</span>
                  <span style={{ ...detailVal, color: '#A32D2D' }}>{detailPopup.cancelReason}</span>
                </div>
              )}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '8px 20px 16px' }}>
              <button style={doneBtn} onClick={() => setDetailPopup(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Approve Modal */}
      {modal?.type === 'approve' && (
        <Modal title="Approve & assign room" onClose={closeModal}>
          {!actionDone ? (
            <>
              <InfoRow label="Officer" value={`${modal.booking.officer.rank} ${modal.booking.officer.name}`} />
              <InfoRow label="Unit" value={modal.booking.officer.unit} />
              <InfoRow label="Reference" value={modal.booking.officer.reference || '—'} />
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
              <div style={doneBox}>Booking approved successfully!</div>
              <WhatsAppBox
                label="Message to Guest"
                mobile={modal.booking.officer.mobile}
                message={isDomiRoom(modal.booking) ? buildGuestMessage(modal.booking) : buildMessage('approve', modal.booking)}
                confirmed={guestConfirmed}
                onConfirmed={setGuestConfirmed}
              />
              {isDomiRoom(modal.booking) && (
                <>
                  <WhatsAppBox
                    label="Message to Guest Room NCO"
                    mobile="7046999068"
                    message={buildNCOMessage(modal.booking)}
                    confirmed={ncoConfirmed}
                    onConfirmed={setNcoConfirmed}
                  />
                  <WhatsAppBox
                    label="Message to Caterer"
                    mobile="8618039069"
                    message={buildCatererMessage(modal.booking)}
                    confirmed={catererConfirmed}
                    onConfirmed={setCatererConfirmed}
                  />
                </>
              )}
              <ModalActions>
                <button style={s.mBtn('blue')} onClick={closeModal}>
                  {allConfirmed(modal.booking) ? 'Done — All Messages Sent' : 'Done'}
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
              <div style={doneBox}>Room assignment updated successfully!</div>
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
              <InfoRow label="Reference" value={modal.booking.officer.reference || '—'} />
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
              <div style={doneBox}>Booking rejected.</div>
              <WhatsAppBox
                label="Message to Guest"
                mobile={modal.booking.officer.mobile}
                message={modal.whatsappMsg}
                confirmed={guestConfirmed}
                onConfirmed={setGuestConfirmed}
              />
              <ModalActions>
                <button style={s.mBtn('blue')} onClick={closeModal}>
                  {guestConfirmed ? 'Done — Message Sent' : 'Done'}
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
              <InfoRow label="Reference" value={modal.booking.officer.reference || '—'} />
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
              <div style={doneBox}>Booking cancelled.</div>
              <WhatsAppBox
                label="Message to Guest"
                mobile={modal.booking.officer.mobile}
                message={modal.whatsappMsg}
                confirmed={guestConfirmed}
                onConfirmed={setGuestConfirmed}
              />
              <ModalActions>
                <button style={s.mBtn('blue')} onClick={closeModal}>
                  {guestConfirmed ? 'Done — Message Sent' : 'Done'}
                </button>
              </ModalActions>
            </>
          )}
        </Modal>
      )}
    </div>
  );
}

const doneBox = { background: '#EAF3DE', border: '0.5px solid #97C459', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#3B6D11', marginBottom: 4 };

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

const pg = {
  wrap:     { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderTop: '0.5px solid var(--border)', flexWrap: 'wrap', gap: 8 },
  info:     { fontSize: 12, color: 'var(--text-3)' },
  controls: { display: 'flex', alignItems: 'center', gap: 4 },
  btn:      { background: 'none', border: '0.5px solid var(--border-md)', borderRadius: 6, padding: '5px 12px', fontSize: 13, cursor: 'pointer', color: 'var(--text-2)', fontFamily: 'inherit' },
  active:   { background: '#185FA5', color: '#fff', border: '0.5px solid #185FA5' },
};

const s = {
  abt: (color) => ({
    background: 'none',
    border: `0.5px solid ${color === 'green' ? '#1D9E75' : color === 'red' ? '#E24B4A' : '#185FA5'}`,
    borderRadius: 'var(--radius-sm)', padding: '4px 10px', fontSize: 12,
    color: color === 'green' ? '#1D9E75' : color === 'red' ? '#E24B4A' : '#185FA5',
    marginRight: 4, cursor: 'pointer', whiteSpace: 'nowrap',
  }),
  mBtn: (variant) => {
    const map = {
      blue: { bg: 'var(--blue)', color: '#fff' },
      red:  { bg: 'var(--red)',  color: '#fff' },
      gray: { bg: 'var(--surface)', color: 'var(--text-1)', border: '0.5px solid var(--border-md)' },
    };
    const v = map[variant] || map.gray;
    return { padding: '8px 18px', fontSize: 13, borderRadius: 'var(--radius-md)', cursor: 'pointer', border: v.border || 'none', background: v.bg, color: v.color, fontFamily: 'inherit' };
  },
};

const styles = {
  pageHeader: { marginBottom: 20 },
  pageTitle:  { fontSize: 22, fontWeight: 500, color: 'var(--text-1)' },
  pageSub:    { fontSize: 13, color: 'var(--text-3)', marginTop: 4 },
  filterRow:  { display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' },
  sel:        { fontSize: 13, padding: '7px 10px', border: '0.5px solid var(--border-md)', borderRadius: 'var(--radius-md)', background: 'var(--surface)', color: 'var(--text-1)' },
  card:       { background: 'var(--surface)', border: '0.5px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' },
  table:      { width: '100%', borderCollapse: 'collapse', fontSize: 13 },
  th:         { textAlign: 'left', padding: '9px 12px', fontSize: 12, color: 'var(--text-3)', borderBottom: '0.5px solid var(--border)', fontWeight: 500 },
  td:         { padding: '10px 12px', borderBottom: '0.5px solid var(--border)', color: 'var(--text-1)', verticalAlign: 'middle' },
  label:      { fontSize: 12, fontWeight: 500, color: 'var(--text-2)' },
  input:      { display: 'block', width: '100%', padding: '8px 12px', fontSize: 13, border: '0.5px solid var(--border-md)', borderRadius: 'var(--radius-md)', background: 'var(--surface)', color: 'var(--text-1)', outline: 'none' },
};
