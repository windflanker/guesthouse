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
  const [expanded, setExpanded] = useState(null);

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
      <style>{`
        @media (max-width: 600px) {
          .mgr-grid { grid-template-columns: 1fr !important; }
          .mgr-stats { gap: 8px !important; }
          .mgr-stat { min-width: 60px !important; padding: 8px 10px !important; }
          .mgr-statnum { font-size: 20px !important; }
          .mgr-datepicker { flex-wrap: wrap !important; gap: 8px !important; }
          .mgr-datesummary { margin-left: 0 !important; width: 100% !important; text-align: center !important; }
          .mgr-header { flex-direction: column !important; gap: 12px !important; }
          .mgr-detail-grid { grid-template-columns: 1fr 1fr !important; }
        }
      `}</style>

      <div style={s.header} className="mgr-header">
        <div>
          <h2 style={s.title}>Room Status</h2>
          <p style={s.sub}>Click occupied room to see full details</p>
        </div>
        <div style={s.stats} className="mgr-stats">
          <div style={s.stat} className="mgr-stat"><div style={{ ...s.statNum, color: '#1D9E75' }} className="mgr-statnum">{availCount}</div><div style={s.statLabel}>Available</div></div>
          <div style={s.stat} className="mgr-stat"><div style={{ ...s.statNum, color: '#E24B4A' }} className="mgr-statnum">{occupiedCount}</div><div style={s.statLabel}>Occupied</div></div>
          <div style={s.stat} className="mgr-stat"><div style={{ ...s.statNum, color: '#185FA5' }} className="mgr-statnum">{rooms.length}</div><div style={s.statLabel}>Total</div></div>
        </div>
      </div>

      <div style={s.datePicker} className="mgr-datepicker">
        <span style={s.dateLabel}>Availability for:</span>
        <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} style={s.dateInput} />
        {!isToday && <button style={s.todayBtn} onClick={() => setSelectedDate(toDateStr(new Date()))}>Today</button>}
        <div style={s.dateSummary} className="mgr-datesummary">{availCount} of {rooms.length} available</div>
      </div>

      <div style={s.legend}>
        {[['Available','#1D9E75'],['Occupied','#E24B4A']].map(([l,c]) => (
          <div key={l} style={s.legendItem}><div style={{ width: 8, height: 8, borderRadius: '50%', background: c }} />{l}</div>
        ))}
      </div>

      {[1, 2, 3].map(cat => (
        <div key={cat} style={{ marginBottom: 24 }}>
          <div style={s.catLabel}>
            {CAT[cat].label}
            <span style={{ ...s.catTag, background: CAT[cat].bg, color: CAT[cat].text }}>{rooms.filter(r => r.category === cat && getRoomInfo(r).status === 'available').length} available</span>
          </div>
          <div style={s.grid} className="mgr-grid">
            {rooms.filter(r => r.category === cat).map(room => {
              const info = getRoomInfo(room);
              const isExpanded = expanded === room._id;
              const isOccupied = info.status === 'occupied';
              return (
                <div key={room._id}
                  style={{ ...s.card, borderLeft: `3px solid ${BORDER[info.status] || '#ccc'}`, cursor: isOccupied ? 'pointer' : 'default' }}
                  onClick={() => isOccupied && setExpanded(isExpanded ? null : room._id)}>

                  <div style={s.cardTop}>
                    <div>
                      <div style={s.roomNo}>{room.number}</div>
                      <div style={s.roomName}>{room.name}</div>
                    </div>
                    <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 99, fontWeight: 500, background: isOccupied ? '#FCEBEB' : '#EAF3DE', color: isOccupied ? '#A32D2D' : '#3B6D11' }}>
                      {isOccupied ? 'Occupied' : 'Available'}
                    </span>
                  </div>

                  {isOccupied && (
                    <div style={s.quickInfo}>
                      <div style={s.qRow}><span style={s.qLabel}>Guest</span><span style={s.qVal}>{info.officer.rank} {info.officer.name}</span></div>
                      <div style={s.qRow}><span style={s.qLabel}>Mobile</span><span style={{ ...s.qVal, color: '#185FA5', fontWeight: 600 }}>{info.officer.mobile}</span></div>
                      <div style={s.qRow}><span style={s.qLabel}>Stay</span><span style={s.qVal}>{info.checkin} → {info.checkout}</span></div>
                      {info.officer.reference && <div style={s.qRow}><span style={s.qLabel}>Ref</span><span style={s.qVal}>{info.officer.reference}</span></div>}
                      <div style={{ fontSize: 11, color: '#185FA5', marginTop: 4, textAlign: 'right' }}>{isExpanded ? '▲ Less' : '▼ Full details'}</div>
                    </div>
                  )}

                  {isOccupied && isExpanded && (
                    <div style={s.fullDetails}>
                      <div style={s.detailsTitle}>Complete Guest Details</div>
                      <div style={s.detailGrid} className="mgr-detail-grid">
                        {[
                          ['Booking Ref', info.ref],
                          ['Full Name', `${info.officer.rank} ${info.officer.name}`],
                          ['Unit', info.officer.unit],
                          ['Mobile', info.officer.mobile],
                          ['Email', info.officer.email || '—'],
                          ['ID Type', info.officer.idType || '—'],
                          ['ID Number', info.officer.idNumber || '—'],
                          ['Arrival Time', info.officer.arrivalTime || '—'],
                          ['Reference', info.officer.reference || '—'],
                          ['Check-in', info.checkin],
                          ['Check-out', info.checkout],
                        ].map(([label, value]) => (
                          <div key={label} style={s.detailItem}>
                            <span style={s.detailLabel}>{label}</span>
                            <span style={{ ...s.detailVal, color: label === 'Mobile' ? '#185FA5' : '#1A1917', fontWeight: label === 'Mobile' ? 600 : 400 }}>{value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {!isOccupied && <div style={s.availBadge}>✓ Available</div>}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

const s = {
  header:      { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  title:       { fontSize: 20, fontWeight: 500, color: '#1A1917' },
  sub:         { fontSize: 12, color: '#9A9895', marginTop: 3 },
  stats:       { display: 'flex', gap: 10 },
  stat:        { background: '#fff', border: '0.5px solid rgba(0,0,0,0.1)', borderRadius: 10, padding: '10px 14px', textAlign: 'center', minWidth: 70 },
  statNum:     { fontSize: 22, fontWeight: 600 },
  statLabel:   { fontSize: 11, color: '#9A9895', marginTop: 2 },
  datePicker:  { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, background: '#fff', border: '0.5px solid rgba(0,0,0,0.1)', borderRadius: 12, padding: '12px 14px' },
  dateLabel:   { fontSize: 13, fontWeight: 500, color: '#5A5855', whiteSpace: 'nowrap' },
  dateInput:   { fontSize: 14, padding: '7px 10px', border: '0.5px solid rgba(0,0,0,0.18)', borderRadius: 8, background: '#f7f6f2', color: '#1A1917', outline: 'none', flex: 1 },
  todayBtn:    { fontSize: 12, padding: '6px 10px', background: '#E6F1FB', color: '#185FA5', border: 'none', borderRadius: 8, cursor: 'pointer', whiteSpace: 'nowrap' },
  dateSummary: { marginLeft: 'auto', fontSize: 12, fontWeight: 500, color: '#3B6D11', background: '#EAF3DE', padding: '6px 12px', borderRadius: 8, whiteSpace: 'nowrap' },
  legend:      { display: 'flex', gap: 16, marginBottom: 14, alignItems: 'center' },
  legendItem:  { display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#5A5855' },
  catLabel:    { fontSize: 13, fontWeight: 500, color: '#5A5855', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  catTag:      { fontSize: 11, padding: '2px 8px', borderRadius: 99, fontWeight: 500 },
  grid:        { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 },
  card:        { background: '#fff', border: '0.5px solid rgba(0,0,0,0.1)', borderRadius: 10, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 },
  cardTop:     { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
  roomNo:      { fontSize: 11, color: '#9A9895' },
  roomName:    { fontSize: 14, fontWeight: 600, color: '#1A1917' },
  quickInfo:   { background: '#F7F6F2', borderRadius: 8, padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 5 },
  qRow:        { display: 'flex', justifyContent: 'space-between', fontSize: 12, gap: 8 },
  qLabel:      { color: '#9A9895', flexShrink: 0 },
  qVal:        { color: '#1A1917', textAlign: 'right', wordBreak: 'break-all' },
  fullDetails: { background: '#EEF4FF', border: '0.5px solid #BDD0F8', borderRadius: 8, padding: '12px' },
  detailsTitle:{ fontSize: 11, fontWeight: 700, color: '#185FA5', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 },
  detailGrid:  { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 12px' },
  detailItem:  { display: 'flex', flexDirection: 'column', gap: 2 },
  detailLabel: { fontSize: 10, color: '#9A9895', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 },
  detailVal:   { fontSize: 12, color: '#1A1917', wordBreak: 'break-all' },
  availBadge:  { background: '#EAF3DE', color: '#3B6D11', fontSize: 12, fontWeight: 500, padding: '6px 10px', borderRadius: 6, textAlign: 'center' },
};
