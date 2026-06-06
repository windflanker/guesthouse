import { useEffect, useState, useCallback } from 'react';
import { api } from '../utils/api.js';
import Badge from '../components/Badge.jsx';
import Modal from '../components/Modal.jsx';

const CAT = {
  1: { label: 'Category 1 — Up to Lt Col',         bg: '#E6F1FB', text: '#185FA5' },
  2: { label: 'Category 2 — Colonel & Brigadier',   bg: '#FAEEDA', text: '#854F0B' },
  3: { label: 'Category 3 — Brigadier & above',     bg: '#EAF3DE', text: '#3B6D11' },
};

const RANKS = [
  { value: 1, label: 'Lt' },
  { value: 1, label: 'Capt' },
  { value: 1, label: 'Major' },
  { value: 1, label: 'Lt Col' },
  { value: 2, label: 'Colonel' },
  { value: 2, label: 'Brigadier' },
  { value: 3, label: 'Maj Gen' },
  { value: 3, label: 'Lt Gen' },
  { value: 3, label: 'General' },
];

const BORDER = { available: '#1D9E75', pending: '#EF9F27', occupied: '#E24B4A' };

function toDateStr(d) { return d.toISOString().split('T')[0]; }

const emptyForm = {
  name: '', rank: '', unit: '', mobile: '', email: '',
  idType: '', idNumber: '', checkin: '', checkout: '', arrivalTime: '',
};

export default function RoomsPage() {
  const [rooms, setRooms]         = useState([]);
  const [bookings, setBookings]   = useState([]);
  const [selectedDate, setSelectedDate] = useState(toDateStr(new Date()));
  const [editing, setEditing]     = useState(null);
  const [saving, setSaving]       = useState(false);
  const [modal, setModal]         = useState(null);
  const [modalMode, setModalMode] = useState('assign');
  const [form, setForm]           = useState(emptyForm);
  const [formLoading, setFormLoading] = useState(false);
  const [success, setSuccess]     = useState('');
  const [errors, setErrors]       = useState({});

  const load = useCallback(async () => {
    try {
      const [r, b] = await Promise.all([
        api.get('/rooms'),
        api.get('/bookings'),
      ]);
      setRooms([...r]);
      setBookings([...b]);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const getRoomInfo = (room) => {
    const date = selectedDate;
    const booking = bookings.find(b =>
      b.room?._id === room._id &&
      ['Approved', 'Checked In'].includes(b.status) &&
      b.checkin <= date && b.checkout >= date
    );
    if (booking) return {
      status: 'occupied',
      guest: booking.officer.name,
      rank: booking.officer.rank,
      checkin: booking.checkin,
      checkout: booking.checkout,
      booking,
    };
    return { status: 'available', guest: null, booking: null };
  };

  const saveName = async (room) => {
    setSaving(true);
    try {
      await api.patch(`/rooms/${room._id}`, { name: editing.name });
      setEditing(null);
      await load();
    } finally { setSaving(false); }
  };

  const openModal = (room) => {
    const info = getRoomInfo(room);
    setForm({ ...emptyForm, checkin: selectedDate });
    setErrors({});
    setSuccess('');
    setModalMode('assign');
    setModal({ room, info });
  };

  const setField = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }));

  const validate = () => {
    const errs = {};
    if (!form.name.trim())   errs.name     = 'Required';
    if (!form.rank)          errs.rank     = 'Required';
    if (!form.unit.trim())   errs.unit     = 'Required';
    if (!form.mobile.trim()) errs.mobile   = 'Required';
    if (!/^\d{10}$/.test(form.mobile)) errs.mobile = 'Must be 10 digits';
    if (!form.checkin)       errs.checkin  = 'Required';
    if (!form.checkout)      errs.checkout = 'Required';
    if (!form.arrivalTime)   errs.arrivalTime = 'Required';
    if (form.checkin && form.checkout && form.checkout <= form.checkin)
      errs.checkout = 'Must be after check-in';
    return errs;
  };

  const handleAssign = async () => {
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setFormLoading(true);
    try {
      const category = RANKS.find(r => r.label === form.rank)?.value || 1;
      const booking = await api.post('/bookings', {
        officer: {
          name: form.name, rank: form.rank, unit: form.unit,
          mobile: form.mobile, email: form.email,
          idType: form.idType, idNumber: form.idNumber,
          arrivalTime: form.arrivalTime,
        },
        category,
        checkin: form.checkin,
        checkout: form.checkout,
      });
      await api.patch(`/bookings/${booking._id}/approve`, { roomId: modal.room._id });
      setSuccess(`✅ ${modal.room.name} assigned to ${form.rank} ${form.name} from ${form.checkin} to ${form.checkout}.`);
      await load();
    } catch (err) {
      setErrors({ submit: err.message });
    } finally { setFormLoading(false); }
  };

  const handleReassign = async () => {
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setFormLoading(true);
    try {
      if (modal.info.booking) {
        await api.patch(`/bookings/${modal.info.booking._id}/cancel`, {
          cancelReason: `Room reassigned to ${form.name} by admin`,
        });
      }
      await api.patch(`/rooms/${modal.room._id}`, {
        status: 'available', currentGuest: null, currentBooking: null,
      });
      await new Promise(r => setTimeout(r, 800));
      const category = RANKS.find(r => r.label === form.rank)?.value || 1;
      const newBooking = await api.post('/bookings', {
        officer: {
          name: form.name, rank: form.rank, unit: form.unit,
          mobile: form.mobile, email: form.email,
          idType: form.idType, idNumber: form.idNumber,
          arrivalTime: form.arrivalTime,
        },
        category,
        checkin: form.checkin,
        checkout: form.checkout,
      });
      await api.patch(`/bookings/${newBooking._id}/approve`, { roomId: modal.room._id });
      await load();
      setSuccess(`✅ ${modal.room.name} reassigned to ${form.rank} ${form.name} from ${form.checkin} to ${form.checkout}.`);
    } catch (err) {
      setErrors({ submit: err.message });
      await load();
    } finally { setFormLoading(false); }
  };

  const handleVacate = async () => {
    setFormLoading(true);
    try {
      if (modal.info.booking) {
        await api.patch(`/bookings/${modal.info.booking._id}/cancel`, {
          cancelReason: 'Room vacated by admin',
        });
      }
      await api.patch(`/rooms/${modal.room._id}`, {
        status: 'available', currentGuest: null, currentBooking: null,
      });
      await load();
      setSuccess(`✅ ${modal.room.name} has been made vacant.`);
    } catch (err) {
      setErrors({ submit: err.message });
    } finally { setFormLoading(false); }
  };

  const isToday = selectedDate === toDateStr(new Date());
  const availCount = rooms.filter(r => getRoomInfo(r).status === 'available').length;

  const bookingForm = (onSubmit, submitLabel) => (
    <>
      {errors.submit && <div style={fs.errorBox}>{errors.submit}</div>}
      <div style={fs.sectionLabel}>Officer Details</div>
      <div className="form-grid" style={fs.grid}>
        <Field label="Full Name" error={errors.name} required>
          <input style={inp(errors.name)} value={form.name} onChange={setField('name')} placeholder="e.g. Rajiv Kumar" />
        </Field>
        <Field label="Rank" error={errors.rank} required>
          <select style={inp(errors.rank)} value={form.rank} onChange={setField('rank')}>
            <option value="">Select rank</option>
            {RANKS.map(r => <option key={r.label} value={r.label}>{r.label}</option>)}
          </select>
        </Field>
        <Field label="Unit / Organisation" error={errors.unit} required>
          <input style={inp(errors.unit)} value={form.unit} onChange={setField('unit')} placeholder="e.g. 5 Rajput" />
        </Field>
        <Field label="Mobile Number" error={errors.mobile} required>
          <input style={inp(errors.mobile)} value={form.mobile}
            onChange={e => setForm(f => ({ ...f, mobile: e.target.value.replace(/\D/g,'').slice(0,10) }))}
            placeholder="10-digit mobile" inputMode="numeric" maxLength={10} />
        </Field>
        <Field label="Email Address">
          <input style={inp('')} type="email" value={form.email} onChange={setField('email')} placeholder="officer@army.in" />
        </Field>
        <Field label="Govt ID Type">
          <select style={inp('')} value={form.idType} onChange={setField('idType')}>
            <option value="">Select</option>
            <option>Service ID card</option>
            <option>Aadhaar card</option>
            <option>Passport</option>
          </select>
        </Field>
        <Field label="Govt ID Number">
          <input style={inp('')} value={form.idNumber} onChange={setField('idNumber')} placeholder="ID number" />
        </Field>
      </div>
      <div style={{ ...fs.sectionLabel, marginTop: 14 }}>Stay Details</div>
      <div className="form-grid" style={fs.grid}>
        <Field label="Check-in Date" error={errors.checkin} required>
          <input type="date" style={inp(errors.checkin)} value={form.checkin} onChange={setField('checkin')} />
        </Field>
        <Field label="Check-out Date" error={errors.checkout} required>
          <input type="date" style={inp(errors.checkout)} value={form.checkout} onChange={setField('checkout')} />
        </Field>
        <Field label="Expected Arrival Time" error={errors.arrivalTime} required>
          <input type="time" style={inp(errors.arrivalTime)} value={form.arrivalTime} onChange={setField('arrivalTime')} />
        </Field>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20 }}>
        <button style={mBtn('gray')} onClick={() => setModal(null)}>Cancel</button>
        <button style={mBtn('blue')} onClick={onSubmit} disabled={formLoading}>
          {formLoading ? 'Saving…' : submitLabel}
        </button>
      </div>
    </>
  );

  return (
    <div>
      <div style={s.pageHeader}>
        <h2 style={s.pageTitle}>Room Status</h2>
        <p style={s.pageSub}>Click any room to assign, reassign or vacate</p>
      </div>

      <div className="date-picker-row" style={s.datePicker}>
        <div style={s.dateLabel}>Check availability for:</div>
        <input type="date" value={selectedDate}
          onChange={e => setSelectedDate(e.target.value)}
          style={s.dateInput} />
        {!isToday && (
          <button style={s.todayBtn} onClick={() => setSelectedDate(toDateStr(new Date()))}>Today</button>
        )}
        <div className="date-summary" style={s.dateSummary}>{availCount} of {rooms.length} available</div>
      </div>

      <div style={s.legend}>
        {[['Available','#1D9E75'],['Occupied','#E24B4A'],['Pending','#EF9F27']].map(([l,c]) => (
          <div key={l} style={s.legendItem}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: c }} />
            {l}
          </div>
        ))}
        <div style={{ ...s.legendItem, marginLeft: 8, color: '#185FA5', fontSize: 11 }}>
          💡 Tap any room to manage
        </div>
      </div>

      {[1, 2, 3].map(cat => (
        <div key={cat} style={{ marginBottom: 28 }}>
          <div style={s.catLabel}>
            {CAT[cat].label}
            <span style={{ ...s.catTag, background: CAT[cat].bg, color: CAT[cat].text }}>
              {rooms.filter(r => r.category === cat).length} rooms
            </span>
            <span style={{ ...s.catTag, background: '#EAF3DE', color: '#3B6D11', marginLeft: 4 }}>
              {rooms.filter(r => r.category === cat && getRoomInfo(r).status === 'available').length} available
            </span>
          </div>
          <div className="rooms-grid" style={s.grid}>
            {rooms.filter(r => r.category === cat).map(room => {
              const info = getRoomInfo(room);
              return (
                <div key={room._id}
                  style={{ ...s.roomCard, borderLeft: `3px solid ${BORDER[info.status] || '#9A9895'}`, cursor: 'pointer' }}
                  onClick={() => openModal(room)}>
                  <div style={s.roomNo}>{room.number}</div>

                  {editing?.roomId === room._id ? (
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center', margin: '4px 0' }}
                      onClick={e => e.stopPropagation()}>
                      <input style={s.nameInput} value={editing.name}
                        onChange={e => setEditing(ed => ({ ...ed, name: e.target.value }))} autoFocus />
                      <button style={s.saveBtn} onClick={() => saveName(room)} disabled={saving}>✓</button>
                      <button style={s.cancelNameBtn} onClick={() => setEditing(null)}>✕</button>
                    </div>
                  ) : (
                    <div style={s.roomName}
                      onClick={e => { e.stopPropagation(); setEditing({ roomId: room._id, name: room.name || '' }); }}>
                      {room.name || <span style={{ color: '#9A9895', fontStyle: 'italic' }}>Add name…</span>}
                      <span style={{ fontSize: 10, color: '#9A9895', marginLeft: 4 }}>✎</span>
                    </div>
                  )}

                  <div style={s.roomCat}>{CAT[room.category].label.split(' — ')[1]}</div>

                  {info.status === 'occupied' ? (
                    <div style={s.occupiedInfo}>
                      <div style={{ fontWeight: 500, fontSize: 12 }}>{info.rank} {info.guest}</div>
                      <div style={{ fontSize: 11, color: '#5A5855', marginTop: 2 }}>{info.checkin} → {info.checkout}</div>
                    </div>
                  ) : (
                    <div style={s.assignHint}>+ Tap to assign</div>
                  )}

                  <Badge status={info.status} />
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {modal && (
        <Modal
          title={`${modal.room.name} (${modal.room.number})`}
          onClose={() => { setModal(null); setSuccess(''); setErrors({}); }}>

          {success ? (
            <>
              <div style={doneBox}>{success}</div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
                <button style={mBtn('blue')} onClick={() => { setModal(null); setSuccess(''); }}>Done</button>
              </div>
            </>
          ) : (
            <>
              <div style={fs.roomInfo}>
                <span style={{ ...fs.catTag, background: CAT[modal.room.category].bg, color: CAT[modal.room.category].text }}>
                  {CAT[modal.room.category].label}
                </span>
                <Badge status={modal.info.status} />
                {modal.info.guest && (
                  <span style={{ fontSize: 13, color: '#5A5855' }}>
                    Currently: <strong>{modal.info.rank} {modal.info.guest}</strong> ({modal.info.checkin} → {modal.info.checkout})
                  </span>
                )}
              </div>

              <div style={fs.tabs}>
                {modal.info.status === 'available' ? (
                  <div style={fs.tabActive}>Assign to Guest</div>
                ) : (
                  <>
                    <div
                      style={modalMode === 'reassign' ? fs.tabActive : fs.tab}
                      onClick={() => { setModalMode('reassign'); setErrors({}); }}>
                      Reassign to New Guest
                    </div>
                    <div
                      style={modalMode === 'vacate-confirm'
                        ? { ...fs.tabActive, background: '#FCEBEB', color: '#A32D2D', borderColor: '#E24B4A' }
                        : { ...fs.tab, color: '#A32D2D' }}
                      onClick={() => { setModalMode('vacate-confirm'); setErrors({}); }}>
                      Make Vacant
                    </div>
                  </>
                )}
              </div>

              {(modal.info.status === 'available' || modalMode === 'reassign') &&
                bookingForm(
                  modal.info.status === 'available' ? handleAssign : handleReassign,
                  modal.info.status === 'available'
                    ? `Assign ${modal.room.name}`
                    : `Reassign ${modal.room.name} to New Guest`
                )
              }

              {modal.info.status !== 'available' && modalMode === 'vacate-confirm' && (
                <div>
                  <div style={fs.vacateWarning}>
                    ⚠️ This will cancel the current booking for <strong>{modal.info.guest}</strong> and make <strong>{modal.room.name}</strong> vacant immediately.
                  </div>
                  {errors.submit && <div style={fs.errorBox}>{errors.submit}</div>}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20 }}>
                    <button style={mBtn('gray')} onClick={() => setModal(null)}>Cancel</button>
                    <button style={{ ...mBtn('gray'), background: '#A32D2D', color: '#fff', border: 'none' }}
                      onClick={handleVacate} disabled={formLoading}>
                      {formLoading ? 'Processing…' : 'Confirm — Make Vacant'}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </Modal>
      )}
    </div>
  );
}

function Field({ label, children, error, required }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label style={{ fontSize: 11, fontWeight: 600, color: '#5A5855' }}>
        {label}{required && <span style={{ color: '#E24B4A' }}> *</span>}
      </label>
      {children}
      {error && <span style={{ fontSize: 10, color: '#E24B4A' }}>{error}</span>}
    </div>
  );
}

const inp = (error) => ({
  padding: '7px 10px', fontSize: 13, width: '100%',
  border: `0.5px solid ${error ? '#E24B4A' : 'rgba(0,0,0,0.18)'}`,
  borderRadius: 8, outline: 'none',
  background: error ? '#FFF5F5' : '#fff', color: '#1A1917',
});

const doneBox = {
  background: '#EAF3DE', border: '0.5px solid #97C459',
  borderRadius: 8, padding: '12px 14px', fontSize: 13, color: '#3B6D11',
};

const mBtn = (variant) => {
  const map = {
    blue: { bg: '#185FA5', color: '#fff', border: 'none' },
    gray: { bg: '#fff', color: '#1A1917', border: '0.5px solid rgba(0,0,0,0.18)' },
  };
  const v = map[variant];
  return { padding: '8px 18px', fontSize: 13, borderRadius: 10, cursor: 'pointer', background: v.bg, color: v.color, border: v.border, fontFamily: 'inherit' };
};

const fs = {
  roomInfo:     { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, flexWrap: 'wrap' },
  catTag:       { fontSize: 11, padding: '3px 10px', borderRadius: 99, fontWeight: 500 },
  tabs:         { display: 'flex', gap: 8, marginBottom: 16, borderBottom: '0.5px solid rgba(0,0,0,0.1)', paddingBottom: 12, flexWrap: 'wrap' },
  tab:          { fontSize: 13, padding: '6px 14px', borderRadius: 8, cursor: 'pointer', border: '0.5px solid rgba(0,0,0,0.18)', color: '#5A5855', background: '#fff' },
  tabActive:    { fontSize: 13, padding: '6px 14px', borderRadius: 8, cursor: 'pointer', border: '0.5px solid #185FA5', color: '#185FA5', background: '#E6F1FB', fontWeight: 500 },
  sectionLabel: { fontSize: 11, fontWeight: 600, color: '#9A9895', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 },
  grid:         { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
  errorBox:     { background: '#FCEBEB', color: '#A32D2D', fontSize: 13, padding: '10px 14px', borderRadius: 8, marginBottom: 12 },
  vacateWarning:{ background: '#FAEEDA', border: '0.5px solid #EF9F27', borderRadius: 8, padding: '12px 14px', fontSize: 13, color: '#854F0B', marginTop: 8 },
};

const s = {
  pageHeader:   { marginBottom: 20 },
  pageTitle:    { fontSize: 20, fontWeight: 500, color: '#1A1917' },
  pageSub:      { fontSize: 13, color: '#9A9895', marginTop: 4 },
  datePicker:   { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, background: '#fff', border: '0.5px solid rgba(0,0,0,0.1)', borderRadius: 12, padding: '12px 16px', flexWrap: 'wrap' },
  dateLabel:    { fontSize: 13, fontWeight: 500, color: '#5A5855' },
  dateInput:    { fontSize: 14, padding: '7px 10px', border: '0.5px solid rgba(0,0,0,0.18)', borderRadius: 8, background: '#f7f6f2', color: '#1A1917', outline: 'none' },
  todayBtn:     { fontSize: 12, padding: '6px 12px', background: '#E6F1FB', color: '#185FA5', border: 'none', borderRadius: 8, cursor: 'pointer' },
  dateSummary:  { fontSize: 13, fontWeight: 500, color: '#3B6D11', background: '#EAF3DE', padding: '6px 12px', borderRadius: 8 },
  legend:       { display: 'flex', gap: 16, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' },
  legendItem:   { display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: '#5A5855' },
  catLabel:     { fontSize: 13, fontWeight: 500, color: '#5A5855', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  catTag:       { fontSize: 11, padding: '2px 8px', borderRadius: 99, fontWeight: 500 },
  grid:         { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 },
  roomCard:     { background: '#fff', border: '0.5px solid rgba(0,0,0,0.1)', borderRadius: 10, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 4 },
  roomNo:       { fontSize: 11, color: '#9A9895' },
  roomName:     { fontSize: 14, fontWeight: 500, color: '#1A1917', cursor: 'pointer', display: 'flex', alignItems: 'center' },
  roomCat:      { fontSize: 11, color: '#9A9895' },
  occupiedInfo: { background: '#FCEBEB', borderRadius: 6, padding: '6px 8px', marginTop: 4 },
  assignHint:   { fontSize: 11, color: '#1D9E75', fontWeight: 500, marginTop: 2 },
  nameInput:    { flex: 1, padding: '4px 8px', fontSize: 13, border: '0.5px solid #185FA5', borderRadius: 6, outline: 'none', color: '#1A1917', background: '#fff' },
  saveBtn:      { background: '#1D9E75', color: '#fff', border: 'none', borderRadius: 6, padding: '3px 8px', cursor: 'pointer', fontSize: 13 },
  cancelNameBtn:{ background: 'none', color: '#9A9895', border: '0.5px solid rgba(0,0,0,0.18)', borderRadius: 6, padding: '3px 8px', cursor: 'pointer', fontSize: 13 },
};
