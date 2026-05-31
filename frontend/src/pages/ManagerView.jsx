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
      b.checkin <= date && b.checkout >= date
    );
    if (booking) return {
      status: 'occupied',
      booking,
      officer: booking.officer,
      checkin: booking.checkin,
      checkout: booking.checkout,
      ref: booking.ref,
    };
    return { status: 'available' };
  };

  const isToday = selectedDate === toDateStr(new Date());
  const availCount = rooms.filter(r => getRoomInfo(r).status === 'available').length;
  const occupiedCount = rooms.length - availCount;

  return (
    <div>
      {/* Header */}
      <div style={s.header}>
        <div>
          <h2 style={s.title}>Room Status — Manager View</h2>
          <p style={s.sub}>View room availability and complete guest details</p>
        </div>
        <div style={s.stats}>
          <div style={s.stat}><div style={{ ...s.statNum, color: '#1D9E75' }}>{availCount}</div><div style={s.statLabel}>Available</div></div>
          <div style={s.stat}><div style={{ ...s.statNum, color: '#E24B4A' }}>{occupiedCount}</div><div style={s.statLabel}>Occupied</div></div>
          <div style={s.stat}><div style={{ ...s.statNum, color: '#185FA5' }}>{rooms.length}</div><div style={s.statLabel}>Total</div></div>
        </div>
      </div>

      {/* Date picker */}
      <div style={s.datePicker}>
        <span style={s.dateLabel}>Checking availability for:</span>
        <input type="date" value={selectedDate}
          onChange={e => setSelectedDate(e.target.value)}
          style={s.dateInput} />
        {!isToday && (
          <button style={s.todayBtn} onClick={() => setSelectedDate(toDateStr(new Date()))}>Today</button>
        )}
        <div style={s.dateSummary}>{availCount} of {rooms.length} rooms available on {selectedDate}</div>
      </div>

      {/* Legend */}
      <div style={s.legend}>
        {[['Available','#1D9E75'],['Occupied','#E24B4A'],['Pending','#EF9F27']].map(([l,c]) => (
          <div key={l} style={s.legendItem}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: c }} />
            {l}
          </div>
        ))}
        <div style={{ ...s.legendItem, color: '#185FA5', fontSize: 11 }}>💡 Click occupied room to see full details</div>
      </div>

      {/* Rooms by category */}
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

          <div style={s.grid}>
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
                      <div style={s.roomCat}>{CAT[room.category].label.split(' — ')[1]}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{
                        fontSize: 11, padding: '2px 8px', borderRadius: 99, fontWeight: 500,
                        background: info.status === 'occupied' ? '#FCEBEB' : '#EAF3DE',
                        color: info.status === 'occupied' ? '#A32D2D' : '#3B6D11',
                      }}>
                        {info.status === 'occupied' ? 'Occupied' : 'Available'}
                      </span>
                      {isOccupied && <div style={{ fontSize: 10, color: '#185FA5', marginTop: 4 }}>{isExpanded ? '▲ Less' : '▼ Details'}</div>}
                    </div>
                  </div>

                  {isOccupied && (
                    <div style={s.quickInfo}>
                      <div style={s.qRow}>
                        <span style={s.qLabel}>Guest</span>
                        <span style={s.qVal}>{info.officer.rank} {info.officer.name}</span>
                      </div>
                      <div style={s.qRow}>
                        <span style={s.qLabel}>Mobile</span>
                        <span style={{ ...s.qVal, color: '#185FA5', fontWeight: 600 }}>{info.officer.mobile}</span>
                      </div>
                      <div style={s.qRow}>
                        <span style={s.qLabel}>Stay</span>
                        <span style={s.qVal}>{info.checkin} → {info.checkout}</span>
                      </div>
                    </div>
                  )}

                  {isOccupied && isExpanded && (
                    <div style={s.fullDetails}>
                      <div style={s.detailsTitle}>Complete Guest Details</div>

                      {[
                        ['Booking Ref',   info.ref],
                        ['Full Name',     `${info.officer.rank} ${info.officer.name}`],
                        ['Unit',          info.officer.unit],
                        ['Mobile',        info.officer.mobile],
                        ['Email',         info.officer.email || '—'],
                        ['ID Type',       info.officer.idType || '—'],
                        ['ID Number',     info.officer.idNumber || '—'],
                        ['Arrival Time',  info.officer.arrivalTime || '—'],
                        ['Check-in',      info.checkin],
                        ['Check-out',     info.checkout],
                      ].map(([label, value]) => (
                        <div key={label} style={s.detailRow}>
                          <span style={s.detailLabel}>{label}</span>
                          <span style={{
                            ...s.detailVal,
                            color: label === 'Mobile' ? '#185FA5' : '#1A1917',
                            fontWeight: label === 'Mobile' ? 600 : 400,
                          }}>{value}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {!isOccupied && (
                    <div style={s.availBadge}>✓ Available</div>
                  )}
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
  header:      { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  title:       { fontSize: 22, fontWeight: 500, color: '#1A1917' },
  sub:         { fontSize: 13, color: '#9A9895', marginTop: 4 },
  stats:       { display: 'flex', gap: 12 },
  stat:        { background: '#fff', border: '0.5px solid rgba(0,0,0,0.1)', borderRadius: 10, padding: '10px 16px', textAlign: 'center', minWidth: 70 },
  statNum:     { fontSize: 24, fontWeight: 600 },
  statLabel:   { fontSize: 11, color: '#9A9895', marginTop: 2 },
  datePicker:  { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, background: '#fff', border: '0.5px solid rgba(0,0,0,0.1)', borderRadius: 12, padding: '14px 18px' },
  dateLabel:   { fontSize: 13, fontWeight: 500, color: '#5A5855' },
  dateInput:   { fontSize: 14, padding: '7px 12px', border: '0.5px solid rgba(0,0,0,0.18)', borderRadius: 8, background: '#f7f6f2', color: '#1A1917', outline: 'none' },
  todayBtn:    { fontSize: 12, padding: '6px 12px', background: '#E6F1FB', color: '#185FA5', border: 'none', borderRadius: 8, cursor: 'pointer' },
  dateSummary: { marginLeft: 'auto', fontSize: 13, fontWeight: 500, color: '#3B6D11', background: '#EAF3DE', padding: '6px 14px', borderRadius: 8 },
  legend:      { display: 'flex', gap: 20, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' },
  legendItem:  { display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: '#5A5855' },
  catLabel:    { fontSize: 13, fontWeight: 500, color: '#5A5855', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 },
  catTag:      { fontSize: 11, padding: '2px 8px', borderRadius: 99, fontWeight: 500 },
  grid:        { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 },
  card:        { background: '#fff', border: '0.5px solid rgba(0,0,0,0.1)', borderRadius: 10, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 8, transition: 'box-shadow 0.15s' },
  cardTop:     { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
  roomNo:      { fontSize: 11, color: '#9A9895' },
  roomName:    { fontSize: 15, fontWeight: 600, color: '#1A1917' },
  roomCat:     { fontSize: 11, color: '#9A9895' },
  quickInfo:   { background: '#F7F6F2', borderRadius: 8, padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 4 },
  qRow:        { display: 'flex', justifyContent: 'space-between', fontSize: 12 },
  qLabel:      { color: '#9A9895', minWidth: 50 },
  qVal:        { color: '#1A1917', textAlign: 'right' },
  fullDetails: { background: '#EEF4FF', border: '0.5px solid #BDD0F8', borderRadius: 8, padding: '12px 14px' },
  detailsTitle:{ fontSize: 11, fontWeight: 700, color: '#185FA5', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 },
  detailRow:   { display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '0.5px solid rgba(24,95,165,0.15)', fontSize: 12 },
  detailLabel: { color: '#5A5855', minWidth: 90 },
  detailVal:   { color: '#1A1917', textAlign: 'right', flex: 1 },
  availBadge:  { background: '#EAF3DE', color: '#3B6D11', fontSize: 12, fontWeight: 500, padding: '6px 10px', borderRadius: 6, textAlign: 'center' },
};
