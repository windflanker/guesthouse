import { useEffect, useState } from 'react';
import { api } from '../utils/api.js';
import Badge from '../components/Badge.jsx';
import Modal from '../components/Modal.jsx';

const CAT_LABELS = { 1: 'Cat 1', 2: 'Cat 2', 3: 'Cat 3' };
const CAT_COLORS = {
  1: { bg: '#E6F1FB', text: '#185FA5' },
  2: { bg: '#FAEEDA', text: '#854F0B' },
  3: { bg: '#EAF3DE', text: '#3B6D11' },
};

function WhatsAppBox({ mobile, message, onConfirmed }) {
  const [copiedMsg, setCopiedMsg] = useState(false);
  const [copiedNum, setCopiedNum] = useState(false);
  const [sentStatus, setSentStatus] = useState('no');

  const copyText = (text, setter) => {
    navigator.clipboard.writeText(text);
    setter(true);
    setTimeout(() => setter(false), 2000);
  };

  return (
    <div style={ws.box}>
      <div style={ws.header}><span>💬</span><span style={ws.title}>WhatsApp Message</span></div>
      <div style={ws.field}>
        <div style={ws.label}>Mobile Number</div>
        <div style={ws.row}>
          <div style={ws.value}>{mobile}</div>
          <button style={ws.copyBtn} onClick={() => copyText(mobile, setCopiedNum)}>{copiedNum ? '✓' : 'Copy'}</button>
        </div>
      </div>
      <div style={ws.field}>
        <div style={ws.label}>Message</div>
        <div style={ws.msgBox}>{message}</div>
        <button style={ws.copyBtnFull} onClick={() => copyText(message, setCopiedMsg)}>
          {copiedMsg ? '✓ Copied!' : '📋 Copy Message'}
        </button>
      </div>
      <div style={ws.field}>
        <div style={ws.label}>Have you sent this on WhatsApp?</div>
        <select style={ws.select} value={sentStatus}
          onChange={e => { setSentStatus(e.target.value); onConfirmed(e.target.value === 'yes'); }}>
          <option value="no">❌ Not sent yet</option>
          <option value="yes">✅ Yes, sent</option>
        </select>
      </div>
    </div>
  );
}

const ws = {
  box:        { background: '#E7F5E9', border: '1px solid #A5D6A7', borderRadius: 10, padding: '14px', marginTop: 16 },
  header:     { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, fontSize: 14, fontWeight: 600, color: '#2E7D32' },
  title:      { fontSize: 14, fontWeight: 600, color: '#2E7D32' },
  field:      { marginBottom: 10 },
  label:      { fontSize: 11, fontWeight: 600, color: '#388E3C', marginBottom: 4, textTransform: 'uppercase' },
  row:        { display: 'flex', alignItems: 'center', gap: 8 },
  value:      { fontSize: 15, fontWeight: 600, color: '#185FA5', flex: 1, background: '#fff', padding: '8px 10px', borderRadius: 6 },
  msgBox:     { fontSize: 13, color: '#1A1917', background: '#fff', padding: '10px', borderRadius: 6, lineHeight: 1.6, border: '0.5px solid #C8E6C9', whiteSpace: 'pre-wrap' },
  copyBtn:    { background: '#2E7D32', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 14px', fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap' },
  copyBtnFull:{ marginTop: 8, width: '100%', background: '#2E7D32', color: '#fff', border: 'none', borderRadius: 6, padding: '10px', fontSize: 14, cursor: 'pointer', fontWeight: 500 },
  select:     { width: '100%', padding: '10px 12px', fontSize: 14, border: '1px solid #A5D6A7', borderRadius: 6, background: '#fff', color: '#1A1917', marginTop: 4 },
};

function buildMessage(type, booking) {
  const name = booking.officer.rank + ' ' + booking.officer.name;
  switch (type) {
    case 'approve': return 'Dear ' + name + ',\n\nYour request for guest room from ' + booking.checkin + ' to ' + booking.checkout + ' is confirmed. The Guest Room NCO shall reach out and get in touch please.\n\nRegards';
    case 'reject':  return 'Dear ' + name + ',\n\nYour request for guest room from ' + booking.checkin + ' to ' + booking.checkout + ' has not been confirmed. For further details please contact the Guest House office.\n\nRegards';
    case 'cancel':  return 'Dear ' + name + ',\n\nYour request for guest room from ' + booking.checkin + ' to ' + booking.checkout + ' has been cancelled. For further details please contact the Guest House office.\n\nRegards';
    default: return '';
  }
}

export default function BookingsPage() {
  const [bookings, setBookings]     = useState([]);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterCat, setFilterCat]   = useState('');
  const [modal, setModal]           = useState(null);
  const [availRooms, setAvailRooms] = useState([]);
  const [formData, setFormData]     = useState({});
  const [loading, setLoading]       = useState(false);
  const [actionDone, setActionDone] = useState(false);
  const [msgConfirmed, setMsgConfirmed] = useState(false);
  const [expanded, setExpanded]     = useState(null);

  const load = () => {
    const params = new URLSearchParams();
    if (filterStatus) params.set('status', filterStatus);
    if (filterCat) params.set('category', filterCat);
    api.get('/bookings?' + params).then(setBookings).catch(console.error);
  };

  useEffect(load, [filterStatus, filterCat]);

  const openApprove = async (booking) => {
    const rooms = await api.get('/rooms/available/all?checkin=' + booking.checkin + '&checkout=' + booking.checkout);
    setAvailRooms(rooms);
    setFormData({ roomId: '' });
    setActionDone(false); setMsgConfirmed(false);
    setModal({ type: 'approve', booking });
  };

  const doApprove = async () => {
    if (!formData.roomId) return alert('Please select a room.');
    setLoading(true);
    try {
      await api.patch('/bookings/' + modal.booking._id + '/approve', { roomId: formData.roomId });
      setActionDone(true);
      setModal(m => ({ ...m, whatsappMsg: buildMessage('approve', modal.booking) }));
      load();
    } catch (err) { alert(err.message); }
    finally { setLoading(false); }
  };

  const openReject = (booking) => { setActionDone(false); setMsgConfirmed(false); setModal({ type: 'reject', booking }); };
  const doReject = async () => {
    setLoading(true);
    try {
      await api.patch('/bookings/' + modal.booking._id + '/reject');
      setActionDone(true);
      setModal(m => ({ ...m, whatsappMsg: buildMessage('reject', modal.booking) }));
      load();
    } catch (err) { alert(err.message); }
    finally { setLoading(false); }
  };

  const openCancel = (booking) => { setFormData({ cancelReason: '' }); setActionDone(false); setMsgConfirmed(false); setModal({ type: 'cancel', booking }); };
  const doCancel = async () => {
    if (!formData.cancelReason?.trim()) return alert('Cancellation reason is required.');
    setLoading(true);
    try {
      await api.patch('/bookings/' + modal.booking._id + '/cancel', { cancelReason: formData.cancelReason });
      setActionDone(true);
      setModal(m => ({ ...m, whatsappMsg: buildMessage('cancel', { ...modal.booking }) }));
      load();
    } catch (err) { alert(err.message); }
    finally { setLoading(false); }
  };

  const closeModal = () => { setModal(null); setActionDone(false); setMsgConfirmed(false); };

  return (
    <div>
      <style>{`
        .bk-mobile { display: none; flex-direction: column; gap: 10px; }
        .bk-desktop { display: block; }
        @media (max-width: 768px) {
          .bk-filters { flex-direction: column !important; }
          .bk-filters select { font-size: 16px !important; padding: 10px !important; }
          .bk-desktop { display: none; }
          .bk-mobile { display: flex; }
          .modal-actions { flex-direction: column !important; }
          .modal-actions button { width: 100% !important; padding: 13px !important; font-size: 15px !important; }
          .room-select { font-size: 16px !important; padding: 12px !important; }
          .cancel-textarea { font-size: 16px !important; padding: 12px !important; }
        }
      `}</style>

      <div style={s.pageHeader}>
        <h2 style={s.pageTitle}>Bookings</h2>
        <p style={s.pageSub}>Tap any booking to see full details</p>
      </div>

      <div style={s.filterRow} className="bk-filters">
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={s.sel}>
          <option value="">All statuses</option>
          {['Pending','Approved','Checked In','Checked Out','Cancelled','Rejected'].map(st => <option key={st}>{st}</option>)}
        </select>
        <select value={filterCat} onChange={e => setFilterCat(e.target.value)} style={s.sel}>
          <option value="">All categories</option>
          <option value="1">Category 1 — Up to Lt Col</option>
          <option value="2">Category 2 — Colonel & Brigadier</option>
          <option value="3">Category 3 — Brigadier & above</option>
        </select>
      </div>

      {/* DESKTOP TABLE */}
      <div className="bk-desktop">
        <div style={s.tableWrap}>
          <table style={s.table}>
            <thead><tr>
              {['Ref','Officer','Rank / Unit','Reference','Cat','Room','Check-in','Check-out','Status','Actions'].map(h => (
                <th key={h} style={s.th}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {bookings.map(b => (
                <>
                  <tr key={b._id} style={{ cursor: 'pointer', background: expanded === b._id ? '#F0F4FF' : 'transparent' }}
                    onClick={() => setExpanded(expanded === b._id ? null : b._id)}>
                    <td style={{ ...s.td, color: '#9A9895', fontSize: 12 }}>{b.ref}</td>
                    <td style={{ ...s.td, fontWeight: 500 }}>{b.officer.name}</td>
                    <td style={{ ...s.td, fontSize: 12, color: '#5A5855' }}>{b.officer.rank}<br />{b.officer.unit}</td>
                    <td style={{ ...s.td, fontSize: 12 }}>{b.officer.reference || '—'}</td>
                    <td style={s.td}>
                      <span style={{ fontSize: 11, padding: '2px 7px', borderRadius: 99, background: CAT_COLORS[b.category]?.bg, color: CAT_COLORS[b.category]?.text }}>
                        {CAT_LABELS[b.category]}
                      </span>
                    </td>
                    <td style={{ ...s.td, fontSize: 12 }}>
                      {b.room ? <><strong>{b.room.name}</strong> <span style={{ color: '#9A9895', fontSize: 11 }}>({b.room.number})</span></> : <span style={{ color: '#9A9895' }}>Not assigned</span>}
                    </td>
                    <td style={{ ...s.td, fontSize: 12 }}>{b.checkin}</td>
                    <td style={{ ...s.td, fontSize: 12 }}>{b.actualCheckout || b.checkout}</td>
                    <td style={s.td}><Badge status={b.status} /></td>
                    <td style={{ ...s.td, whiteSpace: 'nowrap' }} onClick={e => e.stopPropagation()}>
                      {b.status === 'Pending' && <>
                        <button style={s.abt('green')} onClick={() => openApprove(b)}>Approve</button>
                        <button style={s.abt('red')} onClick={() => openReject(b)}>Reject</button>
                        <button style={s.abt('red')} onClick={() => openCancel(b)}>Cancel</button>
                      </>}
                      {b.status === 'Approved' && <>
                        <button style={s.abt('red')} onClick={() => openCancel(b)}>Cancel</button>
                        <button style={s.abt('blue')} onClick={() => openApprove(b)}>Edit room</button>
                      </>}
                      {['Cancelled','Rejected','Checked Out'].includes(b.status) &&
                        <button style={s.abt('blue')} onClick={() => openApprove(b)}>Edit room</button>}
                    </td>
                  </tr>
                  {expanded === b._id && (
                    <tr key={b._id + '-exp'}>
                      <td colSpan={10} style={s.expandedRow}>
                        <div style={s.expandedTitle}>Full Guest Details</div>
                        <div style={s.expandedGrid}>
                          {[['Full Name',b.officer.name],['Rank',b.officer.rank],['Unit',b.officer.unit],
                            ['Mobile',b.officer.mobile],['Email',b.officer.email||'—'],
                            ['ID Type',b.officer.idType||'—'],['ID Number',b.officer.idNumber||'—'],
                            ['Arrival Time',b.officer.arrivalTime||'—'],['Reference',b.officer.reference||'—'],
                            ['Check-in',b.checkin],['Check-out',b.checkout],['Ref',b.ref],
                          ].map(([label, value]) => (
                            <div key={label} style={s.expandedItem}>
                              <span style={s.expandedLabel}>{label}</span>
                              <span style={{ ...s.expandedValue, color: label==='Mobile'?'#185FA5':'#1A1917', fontWeight: label==='Mobile'?600:400 }}>{value}</span>
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MOBILE CARDS */}
      <div className="bk-mobile">
        {bookings.map(b => (
          <div key={b._id} style={mc.card}>
            <div style={mc.cardHeader}>
              <div>
                <div style={mc.name}>{b.officer.rank} {b.officer.name}</div>
                <div style={mc.unit}>{b.officer.unit}</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                <Badge status={b.status} />
                <span style={{ fontSize: 11, color: '#9A9895' }}>{b.ref}</span>
              </div>
            </div>

            <div style={mc.infoGrid}>
              <div style={mc.infoItem}><span style={mc.infoLabel}>Room</span><span style={mc.infoVal}>{b.room ? b.room.name + ' (' + b.room.number + ')' : 'Not assigned'}</span></div>
              <div style={mc.infoItem}><span style={mc.infoLabel}>Category</span><span style={{ ...mc.infoVal, ...CAT_COLORS[b.category] }}>{CAT_LABELS[b.category]}</span></div>
              <div style={mc.infoItem}><span style={mc.infoLabel}>Check-in</span><span style={mc.infoVal}>{b.checkin}</span></div>
              <div style={mc.infoItem}><span style={mc.infoLabel}>Check-out</span><span style={mc.infoVal}>{b.actualCheckout || b.checkout}</span></div>
              <div style={mc.infoItem}><span style={mc.infoLabel}>Mobile</span><span style={{ ...mc.infoVal, color: '#185FA5', fontWeight: 600 }}>{b.officer.mobile}</span></div>
              {b.officer.reference && <div style={mc.infoItem}><span style={mc.infoLabel}>Reference</span><span style={mc.infoVal}>{b.officer.reference}</span></div>}
            </div>

            <div style={mc.expandBtn} onClick={() => setExpanded(expanded === b._id ? null : b._id)}>
              {expanded === b._id ? '▲ Hide details' : '▼ Full details'}
            </div>

            {expanded === b._id && (
              <div style={mc.expandedBox}>
                {[['Email',b.officer.email||'—'],['ID Type',b.officer.idType||'—'],
                  ['ID Number',b.officer.idNumber||'—'],['Arrival Time',b.officer.arrivalTime||'—'],
                ].map(([label, value]) => (
                  <div key={label} style={mc.detailRow}>
                    <span style={mc.detailLabel}>{label}</span>
                    <span style={mc.detailVal}>{value}</span>
                  </div>
                ))}
                {b.cancelReason && (
                  <div style={mc.detailRow}>
                    <span style={mc.detailLabel}>Cancel Reason</span>
                    <span style={{ ...mc.detailVal, color: '#A32D2D' }}>{b.cancelReason}</span>
                  </div>
                )}
              </div>
            )}

            <div style={mc.actions}>
              {b.status === 'Pending' && <>
                <button style={mc.btn('green')} onClick={() => openApprove(b)}>✓ Approve & Assign Room</button>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button style={{ ...mc.btn('red'), flex: 1 }} onClick={() => openReject(b)}>Reject</button>
                  <button style={{ ...mc.btn('red'), flex: 1 }} onClick={() => openCancel(b)}>Cancel</button>
                </div>
              </>}
              {b.status === 'Approved' && <>
                <button style={mc.btn('red')} onClick={() => openCancel(b)}>Cancel Booking</button>
                <button style={mc.btn('blue')} onClick={() => openApprove(b)}>Edit Room Assignment</button>
              </>}
              {['Cancelled','Rejected','Checked Out'].includes(b.status) &&
                <button style={mc.btn('blue')} onClick={() => openApprove(b)}>Edit Room Assignment</button>}
            </div>
          </div>
        ))}
      </div>

      {/* APPROVE MODAL */}
      {modal?.type === 'approve' && (
        <Modal title={actionDone ? 'Booking Approved' : 'Approve & Assign Room'} onClose={closeModal}>
          {!actionDone ? (
            <>
              <InfoRow label="Officer" value={modal.booking.officer.rank + ' ' + modal.booking.officer.name} />
              <InfoRow label="Unit" value={modal.booking.officer.unit} />
              <InfoRow label="Mobile" value={modal.booking.officer.mobile} />
              {modal.booking.officer.reference && <InfoRow label="Reference" value={modal.booking.officer.reference} />}
              <InfoRow label="Stay" value={modal.booking.checkin + ' → ' + modal.booking.checkout} />
              <div style={{ marginTop: 16 }}>
                <label style={s.label}>Select Room</label>
                {availRooms.length === 0
                  ? <p style={{ color: '#E24B4A', fontSize: 14, marginTop: 8 }}>No rooms available for these dates.</p>
                  : <select className="room-select" style={{ ...s.input, marginTop: 8 }} value={formData.roomId}
                      onChange={e => setFormData(f => ({ ...f, roomId: e.target.value }))}>
                      <option value="">-- Select a room --</option>
                      {[1,2,3].map(cat => {
                        const catRooms = availRooms.filter(r => r.category === cat);
                        if (!catRooms.length) return null;
                        return (
                          <optgroup key={cat} label={cat===1?'Category 1 — Up to Lt Col':cat===2?'Category 2 — Colonel & Brigadier':'Category 3 — Brigadier & above'}>
                            {catRooms.map(r => <option key={r._id} value={r._id}>{r.name} ({r.number})</option>)}
                          </optgroup>
                        );
                      })}
                    </select>
                }
              </div>
              <div style={s.modalActions} className="modal-actions">
                <button style={s.mBtn('gray')} onClick={closeModal}>Cancel</button>
                <button style={s.mBtn('blue')} onClick={doApprove} disabled={loading || !formData.roomId}>
                  {loading ? 'Saving…' : 'Approve & Assign Room'}
                </button>
              </div>
            </>
          ) : (
            <>
              <div style={doneBox}>✅ Room assigned successfully!</div>
              <WhatsAppBox mobile={modal.booking.officer.mobile} message={modal.whatsappMsg} onConfirmed={setMsgConfirmed} />
              <div style={s.modalActions} className="modal-actions">
                <button style={s.mBtn('blue')} onClick={closeModal}>{msgConfirmed ? '✓ Done — Message Sent' : 'Done'}</button>
              </div>
            </>
          )}
        </Modal>
      )}

      {/* REJECT MODAL */}
      {modal?.type === 'reject' && (
        <Modal title={actionDone ? 'Booking Rejected' : 'Reject Booking'} onClose={closeModal}>
          {!actionDone ? (
            <>
              <InfoRow label="Officer" value={modal.booking.officer.rank + ' ' + modal.booking.officer.name} />
              <InfoRow label="Mobile" value={modal.booking.officer.mobile} />
              {modal.booking.officer.reference && <InfoRow label="Reference" value={modal.booking.officer.reference} />}
              <InfoRow label="Stay" value={modal.booking.checkin + ' → ' + modal.booking.checkout} />
              <div style={s.modalActions} className="modal-actions">
                <button style={s.mBtn('gray')} onClick={closeModal}>Go back</button>
                <button style={s.mBtn('red')} onClick={doReject} disabled={loading}>{loading ? 'Saving…' : 'Confirm Rejection'}</button>
              </div>
            </>
          ) : (
            <>
              <div style={doneBox}>✅ Booking rejected.</div>
              <WhatsAppBox mobile={modal.booking.officer.mobile} message={modal.whatsappMsg} onConfirmed={setMsgConfirmed} />
              <div style={s.modalActions} className="modal-actions">
                <button style={s.mBtn('blue')} onClick={closeModal}>Done</button>
              </div>
            </>
          )}
        </Modal>
      )}

      {/* CANCEL MODAL */}
      {modal?.type === 'cancel' && (
        <Modal title={actionDone ? 'Booking Cancelled' : 'Cancel Booking'} onClose={closeModal}>
          {!actionDone ? (
            <>
              <InfoRow label="Officer" value={modal.booking.officer.rank + ' ' + modal.booking.officer.name} />
              <InfoRow label="Mobile" value={modal.booking.officer.mobile} />
              {modal.booking.officer.reference && <InfoRow label="Reference" value={modal.booking.officer.reference} />}
              <InfoRow label="Status" value={<Badge status={modal.booking.status} />} />
              {modal.booking.room && <InfoRow label="Room" value={modal.booking.room?.name + ' — will be released'} />}
              <div style={{ marginTop: 16 }}>
                <label style={s.label}>Reason for cancellation (required)</label>
                <textarea rows={3} className="cancel-textarea" style={{ ...s.input, marginTop: 8, resize: 'vertical' }}
                  placeholder="e.g. Officer posted out, travel plans changed…"
                  value={formData.cancelReason}
                  onChange={e => setFormData(f => ({ ...f, cancelReason: e.target.value }))} />
              </div>
              <div style={s.modalActions} className="modal-actions">
                <button style={s.mBtn('gray')} onClick={closeModal}>Go back</button>
                <button style={s.mBtn('red')} onClick={doCancel} disabled={loading}>{loading ? 'Saving…' : 'Confirm Cancellation'}</button>
              </div>
            </>
          ) : (
            <>
              <div style={doneBox}>✅ Booking cancelled.</div>
              <WhatsAppBox mobile={modal.booking.officer.mobile} message={modal.whatsappMsg} onConfirmed={setMsgConfirmed} />
              <div style={s.modalActions} className="modal-actions">
                <button style={s.mBtn('blue')} onClick={closeModal}>Done</button>
              </div>
            </>
          )}
        </Modal>
      )}
    </div>
  );
}

const doneBox = { background: '#EAF3DE', border: '0.5px solid #97C459', borderRadius: 8, padding: '12px 14px', fontSize: 14, color: '#3B6D11', marginBottom: 4 };

function InfoRow({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '0.5px solid rgba(0,0,0,0.08)', fontSize: 14, gap: 12 }}>
      <span style={{ color: '#9A9895', flexShrink: 0 }}>{label}</span>
      <span style={{ textAlign: 'right', wordBreak: 'break-all' }}>{value}</span>
    </div>
  );
}

const mc = {
  card:        { background: '#fff', border: '0.5px solid rgba(0,0,0,0.1)', borderRadius: 12, padding: '14px', display: 'flex', flexDirection: 'column', gap: 10 },
  cardHeader:  { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 },
  name:        { fontSize: 16, fontWeight: 600, color: '#1A1917' },
  unit:        { fontSize: 13, color: '#9A9895', marginTop: 2 },
  infoGrid:    { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 12px', background: '#F7F6F2', borderRadius: 8, padding: '10px' },
  infoItem:    { display: 'flex', flexDirection: 'column', gap: 2 },
  infoLabel:   { fontSize: 10, color: '#9A9895', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 },
  infoVal:     { fontSize: 13, color: '#1A1917' },
  expandBtn:   { fontSize: 13, color: '#185FA5', textAlign: 'center', cursor: 'pointer', padding: '4px 0' },
  expandedBox: { background: '#EEF4FF', borderRadius: 8, padding: '10px' },
  detailRow:   { display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '0.5px solid rgba(24,95,165,0.1)', fontSize: 13, gap: 8 },
  detailLabel: { color: '#9A9895', flexShrink: 0 },
  detailVal:   { color: '#1A1917', textAlign: 'right', wordBreak: 'break-all' },
  actions:     { display: 'flex', flexDirection: 'column', gap: 8 },
  btn: (color) => ({
    width: '100%', padding: '13px', fontSize: 15, fontWeight: 500,
    borderRadius: 10, cursor: 'pointer', border: 'none',
    background: color==='green'?'#1D9E75':color==='red'?'#E24B4A':'#185FA5',
    color: '#fff',
  }),
};

const s = {
  pageHeader:   { marginBottom: 16 },
  pageTitle:    { fontSize: 22, fontWeight: 500, color: '#1A1917' },
  pageSub:      { fontSize: 13, color: '#9A9895', marginTop: 3 },
  filterRow:    { display: 'flex', gap: 8, marginBottom: 16 },
  sel:          { fontSize: 14, padding: '8px 10px', border: '0.5px solid rgba(0,0,0,0.18)', borderRadius: 10, background: '#fff', color: '#1A1917', flex: 1 },
  tableWrap:    { background: '#fff', border: '0.5px solid rgba(0,0,0,0.08)', borderRadius: 12, overflowX: 'auto' },
  table:        { width: '100%', borderCollapse: 'collapse', fontSize: 13 },
  th:           { textAlign: 'left', padding: '9px 12px', fontSize: 12, color: '#9A9895', borderBottom: '0.5px solid rgba(0,0,0,0.08)', fontWeight: 500, whiteSpace: 'nowrap' },
  td:           { padding: '10px 12px', borderBottom: '0.5px solid rgba(0,0,0,0.06)', color: '#1A1917', verticalAlign: 'middle' },
  label:        { fontSize: 14, fontWeight: 600, color: '#5A5855' },
  input:        { display: 'block', width: '100%', padding: '10px 12px', fontSize: 15, border: '0.5px solid rgba(0,0,0,0.18)', borderRadius: 10, background: '#fff', color: '#1A1917', outline: 'none' },
  modalActions: { display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20 },
  abt: (color) => ({
    background: 'none',
    border: '0.5px solid ' + (color==='green'?'#1D9E75':color==='red'?'#E24B4A':'#185FA5'),
    borderRadius: 6, padding: '4px 10px', fontSize: 12,
    color: color==='green'?'#1D9E75':color==='red'?'#E24B4A':'#185FA5',
    marginRight: 4, cursor: 'pointer', whiteSpace: 'nowrap',
  }),
  mBtn: (variant) => {
    const map = { blue: { bg: '#185FA5', color: '#fff' }, red: { bg: '#E24B4A', color: '#fff' }, gray: { bg: '#fff', color: '#1A1917', border: '0.5px solid rgba(0,0,0,0.18)' } };
    const v = map[variant] || map.gray;
    return { padding: '11px 20px', fontSize: 15, borderRadius: 10, cursor: 'pointer', border: v.border || 'none', background: v.bg, color: v.color, fontFamily: 'inherit', fontWeight: 500 };
  },
  expandedRow:   { padding: '12px 16px', background: '#EEF4FF', borderBottom: '0.5px solid #BDD0F8' },
  expandedTitle: { fontSize: 11, fontWeight: 700, color: '#185FA5', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 },
  expandedGrid:  { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px 16px' },
  expandedItem:  { display: 'flex', flexDirection: 'column', gap: 2 },
  expandedLabel: { fontSize: 10, color: '#9A9895', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 },
  expandedValue: { fontSize: 12, color: '#1A1917' },
};
