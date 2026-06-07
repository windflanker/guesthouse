import { useEffect, useState } from 'react';
import { api } from '../utils/api.js';

const CAT = {
  1: { label: 'Category 1 — Up to Lt Col',        bg: '#E6F1FB', text: '#185FA5' },
  2: { label: 'Category 2 — Colonel & Brigadier',  bg: '#FAEEDA', text: '#854F0B' },
  3: { label: 'Category 3 — Brigadier & above',    bg: '#EAF3DE', text: '#3B6D11' },
};
const BORDER = { available: '#1D9E75', pending: '#EF9F27', occupied: '#E24B4A' };
function toDateStr(d) { return d.toISOString().split('T')[0]; }

export default function ManagerView() {
  const [rooms, setRooms]       = useState([]);
  const [bookings, setBookings] = useState([]);
  const [selectedDate, setSelectedDate] = useState(toDateStr(new Date()));
  const [popup, setPopup] = useState(null);

  useEffect(() => {
    Promise.all([api.get('/rooms'), api.get('/bookings')])
      .then(([r, b]) => { setRooms(r); setBookings(b); })
      .catch(console.error);
  }, []);

  const getRoomInfo = (room) => {
    const date = selectedDate;
    const booking = bookings.find(b =>
      b.room?._id === room._id &&
      ['Approved', 'Checked In'].includes(b.status) &&
      b.checkin <= date && b.checkout > date
    );
    if (booking) return { status: 'occupied', booking, officer: booking.officer, checkin: booking.checkin, checkout: booking.checkout, ref: booking.ref };
    return { status: 'available' };
  };

  const isToday = selectedDate === toDateStr(new Date());
  const availCount = rooms.filter(r => getRoomInfo(r).status === 'available').length;
  const occupiedCount = rooms.length - availCount;

  return (
    <div>
      <div className="manager-header" style={s.header}>
        <div>
          <h2 style={s.title}>Room Status — Manager View</h2>
          <p style={s.sub}>View room availability and complete guest details</p>
        </div>
        <div className="manager-stats" style={s.stats}>
          <div style={s.stat}><div style={{ ...s.statNum, color: '#1D9E75' }}>{availCount}</div><div style={s.statLabel}>Available</div></div>
          <div style={s.stat}><div style={{ ...s.statNum, color: '#E24B4A' }}>{occupiedCount}</div><div style={s.statLabel}>Occupied</div></div>
          <div style={s.stat}><div style={{ ...s.statNum, color: '#185FA5' }}>{rooms.length}</div><div style={s.statLabel}>Total</div></div>
        </div>
      </div>

      <div className="date-picker-row" style={s.datePicker}>
        <span style={s.dateLabel}>Availability for:</span>
        <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} style={s.dateInput} />
        {!isToday && <button style={s.todayBtn} onClick={() => setSelectedDate(toDateStr(new Date()))}>Today</button>}
        <div className="date-summary" style={s.dateSummary}>{availCount} of {rooms.length} available</div>
      </div>

      <div style={s.legend}>
        {[['Available','#1D9E75'],['Occupied','#E24B4A'],['Pending','#EF9F27']].map(([l,c]) => (
          <div key={l} style={s.legendItem}><div style={{ width: 8, height: 8, borderRadius: '50%', background: c }} />{l}</div>
        ))}
        <div style={{ ...s.legendItem, color: '#185FA5', fontSize: 11 }}>💡 Tap occupied room for full details</div>
      </div>

      {[1, 2, 3].map(cat => (
        <div key={cat} style={{ marginBottom: 28 }}>
          <div style={s.catLabel}>
            {CAT[cat].label}
            <span style={{ ...s.catTag, background: CAT[cat].bg, color: CAT[cat].text }}>{rooms.filter(r => r.category === cat).length} rooms</span>
            <span style={{ ...s.catTag, background: '#EAF3DE', color: '#3B6D11', marginLeft: 4 }}>{rooms.filter(r => r.category === cat && getRoomInfo(r).status === 'available').length} available</span>
          </div>
          <div className="manager-grid" style={s.grid}>
            {rooms.filter(r => r.category === cat).map(room => {
              const info = getRoomInfo(room);
              const isOccupied = info.status === 'occupied';
              return (
                <div key={room._id}
                  style={{ ...s.card, borderLeft: `3px solid ${BORDER[info.status] || '#ccc'}`, cursor: isOccupied ? 'pointer' : 'default' }}
                  onClick={() => isOccupied && setPopup(info)}>
                  <div style={s.cardTop}>
                    <div>
                      <div style={s.roomNo}>{room.number}</div>
                      <div style={s.roomName}>{room.name}</div>
                      <div style={s.roomCat}>{CAT[room.category].label.split(' — ')[1]}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 99, fontWeight: 500, background: isOccupied ? '#FCEBEB' : '#EAF3DE', color: isOccupied ? '#A32D2D' : '#3B6D11' }}>
                        {isOccupied ? 'Occupied' : 'Available'}
                      </span>
                      {isOccupied && <div style={{ fontSize: 10, color: '#185FA5', marginTop: 4 }}>▼ Tap for details</div>}
                    </div>
                  </div>
                  {isOccupied && (
                    <div style={s.quickInfo}>
                      <div style={s.qRow}><span style={s.qLabel}>Guest</span><span style={s.qVal}>{info.officer.rank} {info.officer.name}</span></div>
                      <div style={s.qRow}><span style={s.qLabel}>Mobile</span><span style={{ ...s.qVal, color: '#185FA5', fontWeight: 600 }}>{info.officer.mobile}</span></div>
                      <div style={s.qRow}><span style={s.qLabel}>Stay</span><span style={s.qVal}>{info.checkin} → {info.checkout}</span></div>
                    </div>
                  )}
                  {!isOccupied && <div style={s.availBadge}>✓ Available</div>}
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Full details popup */}
      {popup && (
        <div style={overlay} onClick={() => setPopup(null)}>
          <div style={popupBox} onClick={e => e.stopPropagation()}>
            <div style={popupHeader}>
              <div style={popupTitle}>Guest Details</div>
              <button style={closeBtn} onClick={() => setPopup(null)}>✕</button>
            </div>
            <div style={popupBody}>
              {[
                ['Booking Ref',    popup.ref],
                ['Full Name',      `${popup.officer.rank} ${popup.officer.name}`],
                ['Unit',           popup.officer.unit],
                ['Mobile',         popup.officer.mobile],
                ['Email',          popup.officer.email || '—'],
                ['ID Type',        popup.officer.idType || '—'],
                ['ID Number',      popup.officer.idNumber || '—'],
                ['Arrival Time',   popup.officer.arrivalTime || '—'],
                ['Check-in',       popup.checkin],
                ['Check-out',      popup.checkout],
              ].map(([label, value]) => (
                <div key={label} style={detailRow}>
                  <span style={detailLabel}>{label}</span>
                  <span style={{ ...detailVal, color: label === 'Mobile' ? '#185FA5' : '#1A1917', fontWeight: label === 'Mobile' ? 600 : 400 }}>{value}</span>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
              <button style={doneBtn} onClick={() => setPopup(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const overlay  = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 };
const popupBox = { background: '#fff', borderRadius: 14, width: '100%', maxWidth: 480, maxHeight: '85vh', overflow: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' };
const popupHeader = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '0.5px solid rgba(0,0,0,0.1)' };
const popupTitle = { fontSize: 16, fontWeight: 600, color: '#1A1917' };
const closeBtn = { background: 'none', border: 'none', fontSize: 18, color: '#9A9895', cursor: 'pointer', padding: '2px 6px' };
const popupBody = { padding: '8px 20px' };
const detailRow = { display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: '0.5px solid rgba(0,0,0,0.06)', fontSize: 13, gap: 12 };
const detailLabel = { color: '#9A9895', minWidth: 100, flexShrink: 0 };
const detailVal = { color: '#1A1917', textAlign: 'right', wordBreak: 'break-all' };
const doneBtn = { background: '#185FA5', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 20px', fontSize: 13, cursor: 'pointer' };

const s = {
  header:      { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  title:       { fontSize: 20, fontWeight: 500, color: '#1A1917' },
  sub:         { fontSize: 13, color: '#9A9895', marginTop: 4 },
  stats:       { display: 'flex', gap: 10 },
  stat:        { background: '#fff', border: '0.5px solid rgba(0,0,0,0.1)', borderRadius: 10, padding: '8px 14px', textAlign: 'center', minWidth: 64 },
  statNum:     { fontSize: 22, fontWeight: 600 },
  statLabel:   { fontSize: 11, color: '#9A9895', marginTop: 2 },
  datePicker:  { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, background: '#fff', border: '0.5px solid rgba(0,0,0,0.1)', borderRadius: 12, padding: '12px 16px', flexWrap: 'wrap' },
  dateLabel:   { fontSize: 13, fontWeight: 500, color: '#5A5855' },
  dateInput:   { fontSize: 14, padding: '7px 10px', border: '0.5px solid rgba(0,0,0,0.18)', borderRadius: 8, background: '#f7f6f2', color: '#1A1917', outline: 'none' },
  todayBtn:    { fontSize: 12, padding: '6px 12px', background: '#E6F1FB', color: '#185FA5', border: 'none', borderRadius: 8, cursor: 'pointer' },
  dateSummary: { fontSize: 13, fontWeight: 500, color: '#3B6D11', background: '#EAF3DE', padding: '6px 12px', borderRadius: 8 },
  legend:      { display: 'flex', gap: 16, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' },
  legendItem:  { display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#5A5855' },
  catLabel:    { fontSize: 13, fontWeight: 500, color: '#5A5855', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  catTag:      { fontSize: 11, padding: '2px 8px', borderRadius: 99, fontWeight: 500 },
  grid:        { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 },
  card:        { background: '#fff', border: '0.5px solid rgba(0,0,0,0.1)', borderRadius: 10, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 8 },
  cardTop:     { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
  roomNo:      { fontSize: 11, color: '#9A9895' },
  roomName:    { fontSize: 15, fontWeight: 600, color: '#1A1917' },
  roomCat:     { fontSize: 11, color: '#9A9895' },
  quickInfo:   { background: '#F7F6F2', borderRadius: 8, padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 4 },
  qRow:        { display: 'flex', justifyContent: 'space-between', fontSize: 12 },
  qLabel:      { color: '#9A9895', minWidth: 50 },
  qVal:        { color: '#1A1917', textAlign: 'right', wordBreak: 'break-all' },
  availBadge:  { background: '#EAF3DE', color: '#3B6D11', fontSize: 12, fontWeight: 500, padding: '6px 10px', borderRadius: 6, textAlign: 'center' },
};
