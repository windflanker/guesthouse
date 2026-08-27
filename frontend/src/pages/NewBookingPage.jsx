import { useState } from 'react';
import { api } from '../utils/api.js';

const RANKS = [
  { value: 1, label: 'Mr' },
  { value: 1, label: 'Mrs' },
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

const REQUIRED_FIELDS = ['name', 'rank', 'unit', 'mobile', 'idType', 'idNumber', 'checkin', 'checkout', 'arrivalTime', 'reference'];

function calcNights(checkin, checkout) {
  if (!checkin || !checkout) return 0;
  const a = new Date(checkin);
  const b = new Date(checkout);
  const diff = Math.round((b - a) / (1000 * 60 * 60 * 24));
  return diff > 0 ? diff : 0;
}

const emptyGuest = { name: '', idType: '', idNumber: '' };

export default function NewBookingPage() {
  const [form, setForm] = useState({
    name: '', rank: '', unit: '', mobile: '', email: '',
    idType: '', idNumber: '', checkin: '', checkout: '',
    arrivalTime: '', reference: '',
  });
  const [numRooms, setNumRooms] = useState(1);
  const [guests, setGuests] = useState([]);
  const [touched, setTouched] = useState({});
  const [guestTouched, setGuestTouched] = useState([]);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const touch = (key) => setTouched(t => ({ ...t, [key]: true }));

  const mobileError = form.mobile && !/^\d{10}$/.test(form.mobile) ? 'Must be 10 digits' : '';

  const fieldError = (key) => {
    if (!touched[key]) return '';
    if (key === 'mobile') return mobileError;
    if (key === 'checkout' && form.checkin && form.checkout && form.checkout <= form.checkin)
      return 'Check-out must be after check-in';
    if (REQUIRED_FIELDS.includes(key) && !form[key]) return 'This field is required';
    return '';
  };

  const guestError = (index, key) => {
    if (!guestTouched[index]?.[key]) return '';
    if (key === 'name' && !guests[index]?.name?.trim()) return 'Required';
    return '';
  };

  const nights = calcNights(form.checkin, form.checkout);

  const isFormValid = () => {
    if (!REQUIRED_FIELDS.every(k => form[k])) return false;
    if (!/^\d{10}$/.test(form.mobile)) return false;
    if (nights <= 0) return false;
    for (const g of guests) {
      if (!g.name.trim()) return false;
    }
    return true;
  };

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }));

  const handleNumRoomsChange = (e) => {
    const n = parseInt(e.target.value);
    setNumRooms(n);
    const additionalCount = n - 1;
    const newGuests = Array.from({ length: additionalCount }, (_, i) => guests[i] || { ...emptyGuest });
    setGuests(newGuests);
    setGuestTouched(Array.from({ length: additionalCount }, (_, i) => guestTouched[i] || {}));
  };

  const setGuestField = (index, key) => (e) => {
    setGuests(gs => gs.map((g, i) => i === index ? { ...g, [key]: e.target.value } : g));
  };

  const touchGuest = (index, key) => {
    setGuestTouched(gt => gt.map((g, i) => i === index ? { ...g, [key]: true } : g));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const allTouched = REQUIRED_FIELDS.reduce((acc, k) => ({ ...acc, [k]: true }), {});
    setTouched(allTouched);
    setGuestTouched(guests.map(() => ({ name: true })));
    if (!isFormValid()) return;

    setLoading(true); setError('');
    try {
      if (numRooms === 1) {
        await api.post('/bookings', {
          officer: {
            name: form.name, rank: form.rank, unit: form.unit,
            mobile: form.mobile, email: form.email,
            idType: form.idType, idNumber: form.idNumber,
            arrivalTime: form.arrivalTime, reference: form.reference,
          },
          category: RANKS.find(r => r.label === form.rank)?.value || 1,
          checkin: form.checkin,
          checkout: form.checkout,
        });
      } else {
        await api.post('/bookings/group', {
          mainApplicant: {
            name: form.name, rank: form.rank, unit: form.unit,
            mobile: form.mobile, email: form.email,
            idType: form.idType, idNumber: form.idNumber,
            arrivalTime: form.arrivalTime, reference: form.reference,
          },
          guests,
          category: RANKS.find(r => r.label === form.rank)?.value || 1,
          checkin: form.checkin,
          checkout: form.checkout,
        });
      }
      setSubmitted(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div style={s.page}>
        <div style={s.card}>
          <img src="/logo.jpeg" alt="Logo" style={s.logo} />
          <div style={{ fontSize: 48, margin: '8px 0' }}>✓</div>
          <h2 style={s.heading}>Request Submitted</h2>
          <p style={{ fontSize: 14, color: '#5A5855', marginBottom: 24, textAlign: 'center' }}>
            Your booking request for <strong>{numRooms} room{numRooms > 1 ? 's' : ''}</strong> is pending admin approval. You will receive an SMS once approved.
          </p>
          <button style={s.submitBtn} onClick={() => {
            setSubmitted(false);
            setForm({ name:'', rank:'', unit:'', mobile:'', email:'', idType:'', idNumber:'', checkin:'', checkout:'', arrivalTime:'', reference:'' });
            setNumRooms(1);
            setGuests([]);
            setTouched({});
            setGuestTouched([]);
          }}>
            Submit Another Request
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={s.page}>
      <div style={s.card}>
        <img src="/logo.jpeg" alt="Logo" style={s.logo} />
        <h1 style={s.heading}>Guest Room Booking</h1>
        <p style={s.sub}>Officers' Guest House</p>
        <div style={s.divider} />

        {/* Preview banner */}
        {form.name && form.rank && (
          <div style={s.guestBanner}>
            <div style={s.guestBannerRow}>
              <span style={s.guestBannerLabel}>Guest</span>
              <span style={s.guestBannerVal}>{form.rank} {form.name}</span>
            </div>
            {form.unit && (
              <div style={s.guestBannerRow}>
                <span style={s.guestBannerLabel}>Unit / Guest of</span>
                <span style={s.guestBannerVal}>{form.unit}</span>
              </div>
            )}
            {form.reference && (
              <div style={s.guestBannerRow}>
                <span style={s.guestBannerLabel}>Reference</span>
                <span style={s.guestBannerVal}>{form.reference}</span>
              </div>
            )}
            {numRooms > 1 && guests.filter(g => g.name).length > 0 && (
              <div style={s.guestBannerRow}>
                <span style={s.guestBannerLabel}>Also</span>
                <span style={s.guestBannerVal}>{guests.filter(g => g.name).map(g => g.name).join(', ')}</span>
              </div>
            )}
            {numRooms > 0 && (
              <div style={s.guestBannerRow}>
                <span style={s.guestBannerLabel}>Rooms</span>
                <span style={s.guestBannerVal}>{numRooms} room{numRooms > 1 ? 's' : ''}</span>
              </div>
            )}
          </div>
        )}

        {error && <div style={s.errorBanner}>{error}</div>}

        <form onSubmit={handleSubmit} style={{ width: '100%' }} noValidate>

          <div style={s.sectionLabel}>Applicant Details</div>
          <div className="form-grid" style={s.grid}>
            <Field label="Full Name" error={fieldError('name')} required>
              <input style={inputStyle(fieldError('name'))} value={form.name}
                onChange={set('name')} onBlur={() => touch('name')}
                placeholder="e.g. Rajiv Kumar" />
            </Field>
            <Field label="Rank" error={fieldError('rank')} required>
              <select style={inputStyle(fieldError('rank'))} value={form.rank}
                onChange={set('rank')} onBlur={() => touch('rank')}>
                <option value="">Select rank</option>
                {RANKS.map(r => <option key={r.label} value={r.label}>{r.label}</option>)}
              </select>
            </Field>
            <Field label="Unit / Organisation / Guest of" error={fieldError('unit')} required>
              <input style={inputStyle(fieldError('unit'))} value={form.unit}
                onChange={set('unit')} onBlur={() => touch('unit')}
                placeholder="e.g. 5 Rajput Regiment / Guest of Brig XYZ" />
            </Field>
            <Field label="Mobile Number" error={fieldError('mobile')} required>
              <input style={inputStyle(fieldError('mobile'))} value={form.mobile}
                onChange={e => { const v = e.target.value.replace(/\D/g,'').slice(0,10); setForm(f=>({...f,mobile:v})); }}
                onBlur={() => touch('mobile')} placeholder="10-digit mobile number"
                inputMode="numeric" maxLength={10} />
            </Field>
            <Field label="Email Address">
              <input style={inputStyle('')} type="email" value={form.email}
                onChange={set('email')} placeholder="officer@army.in" />
            </Field>
            <Field label="Govt ID Type" error={fieldError('idType')} required>
              <select style={inputStyle(fieldError('idType'))} value={form.idType}
                onChange={set('idType')} onBlur={() => touch('idType')}>
                <option value="">Select ID type</option>
                <option>Service ID card</option>
                <option>Aadhaar card</option>
                <option>Passport</option>
              </select>
            </Field>
            <Field label="Govt ID Number" error={fieldError('idNumber')} required>
              <input style={inputStyle(fieldError('idNumber'))} value={form.idNumber}
                onChange={set('idNumber')} onBlur={() => touch('idNumber')}
                placeholder="ID number" />
            </Field>
            <Field label="Reference" error={fieldError('reference')} required>
              <input style={inputStyle(fieldError('reference'))} value={form.reference}
                onChange={set('reference')} onBlur={() => touch('reference')}
                placeholder="e.g. Col XYZ Sharma" />
            </Field>
          </div>

          <div style={{ ...s.sectionLabel, marginTop: 24 }}>Stay Details</div>
          <div className="form-grid" style={s.grid}>
            <Field label="Check-in Date" error={fieldError('checkin')} required>
              <input type="date" style={inputStyle(fieldError('checkin'))} value={form.checkin}
                onChange={set('checkin')} onBlur={() => touch('checkin')} />
            </Field>
            <Field label="Check-out Date" error={fieldError('checkout')} required>
              <input type="date" style={inputStyle(fieldError('checkout'))} value={form.checkout}
                onChange={set('checkout')} onBlur={() => touch('checkout')} />
            </Field>
            <Field label="Expected Time of Arrival" error={fieldError('arrivalTime')} required>
              <input type="time" style={inputStyle(fieldError('arrivalTime'))} value={form.arrivalTime}
                onChange={set('arrivalTime')} onBlur={() => touch('arrivalTime')} />
            </Field>
            <Field label="Number of Guest Rooms Needed" required>
              <select style={inputStyle('')} value={numRooms} onChange={handleNumRoomsChange}>
                {[1,2,3,4,5,6,7,8].map(n => (
                  <option key={n} value={n}>{n} room{n > 1 ? 's' : ''}</option>
                ))}
              </select>
            </Field>
          </div>

          {/* Nights counter */}
          {form.checkin && form.checkout && nights > 0 && (
            <div style={s.nightsBox}>
              <div style={s.nightsCount}>
                🌙 <strong>{nights} night{nights > 1 ? 's' : ''}</strong>
                <span style={s.nightsDates}> &nbsp;({form.checkin} → {form.checkout})</span>
              </div>
              <div style={s.checkoutNote}>Check-out time: <strong>1000h</strong></div>
            </div>
          )}

          {!(form.checkin && form.checkout && nights > 0) && (
            <div style={s.checkoutNoteAlone}>Check-out time is <strong>1000h</strong></div>
          )}

          {/* Additional guests */}
          {numRooms > 1 && (
            <div style={{ marginTop: 24 }}>
              <div style={s.sectionLabel}>Additional Guests</div>
              {guests.map((guest, index) => (
                <div key={index} style={s.guestBlock}>
                  <div style={s.guestBlockTitle}>Guest {index + 2}</div>
                  <div className="form-grid" style={s.grid}>
                    <Field label="Full Name" error={guestError(index, 'name')} required>
                      <input style={inputStyle(guestError(index, 'name'))} value={guest.name}
                        onChange={setGuestField(index, 'name')}
                        onBlur={() => touchGuest(index, 'name')}
                        placeholder="e.g. Priya Sharma" />
                    </Field>
                    <Field label="Govt ID Type">
                      <select style={inputStyle('')} value={guest.idType}
                        onChange={setGuestField(index, 'idType')}>
                        <option value="">Select (optional)</option>
                        <option>Service ID card</option>
                        <option>Aadhaar card</option>
                        <option>Passport</option>
                      </select>
                    </Field>
                    <Field label="Govt ID Number">
                      <input style={inputStyle('')} value={guest.idNumber}
                        onChange={setGuestField(index, 'idNumber')}
                        placeholder="ID number (optional)" />
                    </Field>
                  </div>
                </div>
              ))}
            </div>
          )}

          <button type="submit"
            style={{ ...s.submitBtn, opacity: isFormValid() ? 1 : 0.45, cursor: isFormValid() ? 'pointer' : 'not-allowed' }}
            disabled={!isFormValid() || loading}>
            {loading ? 'Submitting…' : `Submit Request for ${numRooms} Room${numRooms > 1 ? 's' : ''}`}
          </button>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children, error, required }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <label style={{ fontSize: 12, fontWeight: 500, color: '#5A5855' }}>
        {label}{required && <span style={{ color: '#E24B4A' }}> *</span>}
      </label>
      {children}
      {error && <span style={{ fontSize: 11, color: '#E24B4A', marginTop: 2 }}>{error}</span>}
    </div>
  );
}

const inputStyle = (error) => ({
  padding: '9px 12px', fontSize: 14, width: '100%',
  border: `0.5px solid ${error ? '#E24B4A' : 'rgba(0,0,0,0.18)'}`,
  borderRadius: 10, outline: 'none',
  background: error ? '#FFF5F5' : '#fff',
  color: '#1A1917',
  boxShadow: error ? '0 0 0 3px rgba(226,75,74,0.1)' : 'none',
});

const s = {
  page:             { minHeight: '100vh', background: 'linear-gradient(135deg, #f7f6f2 0%, #e8e6df 100%)', display: 'flex', justifyContent: 'center', padding: '24px 12px' },
  card:             { background: '#fff', border: '0.5px solid rgba(0,0,0,0.1)', borderRadius: 20, padding: '28px 20px', width: '100%', maxWidth: 700, alignSelf: 'flex-start', boxShadow: '0 8px 40px rgba(0,0,0,0.08)', display: 'flex', flexDirection: 'column', alignItems: 'center' },
  logo:             { width: 72, height: 72, objectFit: 'contain', marginBottom: 12 },
  heading:          { fontFamily: 'var(--font-serif)', fontSize: 22, fontWeight: 400, color: '#1A1917', marginBottom: 4, textAlign: 'center' },
  sub:              { fontSize: 12, color: '#9A9895', letterSpacing: '0.04em', textTransform: 'uppercase' },
  divider:          { width: 48, height: 2, background: '#185FA5', borderRadius: 99, margin: '14px 0 18px', opacity: 0.4 },
  guestBanner:      { width: '100%', background: '#E6F1FB', border: '0.5px solid #B8D4F0', borderRadius: 10, padding: '12px 16px', marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 4 },
  guestBannerRow:   { display: 'flex', gap: 12, fontSize: 13 },
  guestBannerLabel: { color: '#185FA5', fontWeight: 500, minWidth: 90 },
  guestBannerVal:   { color: '#1A1917' },
  errorBanner:      { width: '100%', background: '#FCEBEB', color: '#A32D2D', fontSize: 13, padding: '10px 14px', borderRadius: 8, marginBottom: 16 },
  sectionLabel:     { width: '100%', fontSize: 11, fontWeight: 500, color: '#9A9895', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 },
  grid:             { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, width: '100%' },
  nightsBox:        { width: '100%', background: '#E6F1FB', border: '0.5px solid #B8D4F0', borderRadius: 10, padding: '12px 16px', marginTop: 16, display: 'flex', flexDirection: 'column', gap: 6 },
  nightsCount:      { fontSize: 15, color: '#185FA5' },
  nightsDates:      { fontSize: 13, color: '#5A5855' },
  checkoutNote:     { fontSize: 13, color: '#854F0B' },
  checkoutNoteAlone:{ width: '100%', marginTop: 14, fontSize: 13, color: '#854F0B', background: '#FAEEDA', border: '0.5px solid #F5C97A', borderRadius: 8, padding: '10px 14px' },
  guestBlock:       { background: '#F7F6F2', border: '0.5px solid rgba(0,0,0,0.08)', borderRadius: 10, padding: '14px 16px', marginBottom: 12 },
  guestBlockTitle:  { fontSize: 12, fontWeight: 600, color: '#185FA5', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' },
  submitBtn:        { marginTop: 24, background: '#185FA5', color: '#fff', border: 'none', padding: '13px 32px', fontSize: 15, fontWeight: 500, borderRadius: 10, width: '100%', cursor: 'pointer' },
};
