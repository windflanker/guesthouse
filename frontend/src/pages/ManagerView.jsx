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
      guest: booking.officer.name,
      rank: booking.officer.rank,
      unit: booking.officer.unit,
      mobile: booking.officer.mobile,
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
    <div style={s.page}>
      {/* Header */}
      <div style={s.header}>
        <div style={s.headerLeft}>
          <h2 style={s.title}>Room Status — Manager View</h2>
          <p style={s.sub}>Read-only view of room availability and guest details</p>
        </div>
        <div style={s.stats}>
          <div style={s.stat}>
            <div style={{ ...s.statNum, color: '#1D9E75' }}>{availCount}</div>
            <div style={s.statLabel}>Available</div>
          </div>
          <div style={s.stat}>
            <div style={{ ...s.statNum, color: '#E24B4A' }}>{occupiedCount}</div>
            <div style={s.statLabel}>Occupied</div>
          </div>
          <div style={s.stat}>
            <div style={{ ...s.statNum, color: '#185FA5' }}>{rooms.length}</div>
            <div style={s.statLabel}>Total</div>
          </div>
        </div>
      </div>

      {/* Date picker */}
      <div style={s.datePicker}>
        <span style={s.dateLabel}>Checking availability for:</span>
        <input type="date" value={selectedDate}
          onChange={e => setSelectedDate(e.target.value)}
          style={s.dateInput} />
        {!isToday && (
          <button style={s.todayBtn} onClick={() => setSelectedDate(toDateStr(new Date()))}>
            Today
          </button>
        )}
        <div style={s.dateSummary}>
          {availCount} of {rooms.length} rooms available on {selectedDate}
        </div>
      </div>

      {/* Legend */}
      <div style={s.legend}>
        {[['Available','#1D9E75'],['Occupied','#E24B4A'],['Pending','#EF9F27']].map(([l,c]) => (
          <div key={l} style={s.legendItem}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: c }} />
            {l}
          </div>
        ))}
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
              return (
                <div key={room._id} style={{ ...s.card, borderLeft: `3px solid ${BORDER[info.status] || '#ccc'}` }}>
                  <div style={s.roomNo}>{room.number}</div>
                  <div style={s.roomName}>{room.name}</div>
                  <div style={s.roomCat}>{CAT[room.category].label.split(' — ')[1]}</div>

                  {info.status === 'occupied' ? (
                    <div style={s.guestCard}>
                      <div style={s.guestRow}>
                        <span style={s.guestLabel}>Guest</span>
                        <span style={s.guestVal}>{info.rank} {info.guest}</span>
                      </div>
                      <div style={s.guestRow}>
                        <span style={s.guestLabel}>Unit</span>
                        <span style={s.guestVal}>{info.unit}</span>
                      </div>
                      <div style={s.guestRow}>
                        <span style={s.guestLabel}>Mobile</span>
                        <span style={{ ...s.guestVal, color: '#185FA5', fontWeight: 600 }}>{info.mobile}</span>
                      </div>
                      <div style={s.guestRow}>
                        <span style={s.guestLabel}>Check-in</span>
                        <span style={s.guestVal}>{info.checkin}</span>
                      </div>
                      <div style={s.guestRow}>
                        <span style={s.guestLabel}>Check-out</span>
                        <span style={s.guestVal}>{info.checkout}</span>
                      </div>
                      <div style={s.guestRow}>
                        <span style={s.guestLabel}>Ref</span>
                        <span style={{ ...s.guestVal, color: '#9A9895', fontSize: 11 }}>{info.ref}</span>
                      </div>
                    </div>
                  ) : (
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
  page:      { padding: '0' },
  header:    { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  headerLeft:{ flex: 1 },
  title:     { fontSize: 22, fontWeight: 500, color: '#1A1917' },
  sub:       { fontSize: 13, color: '#9A9895', marginTop: 4 },
  stats:     { display: 'flex', gap: 12 },
  stat:      { background: '#fff', border: '0.5px solid rgba(0,0,0,0.1)', borderRadius: 10, padding: '10px 16px', textAlign: 'center', minWidth: 70 },
  statNum:   { fontSize: 24, fontWeight: 600 },
  statLabel: { fontSize: 11, color: '#9A9895', marginTop: 2 },
  datePicker:{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, background: '#fff', border: '0.5px solid rgba(0,0,0,0.1)', borderRadius: 12, padding: '14px 18px' },
  dateLabel: { fontSize: 13, fontWeight: 500, color: '#5A5855' },
  dateInput: { fontSize: 14, padding: '7px 12px', border: '0.5px solid rgba(0,0,0,0.18)', borderRadius: 8, background: '#f7f6f2', color: '#1A1917', outline: 'none' },
  todayBtn:  { fontSize: 12, padding: '6px 12px', background: '#E6F1FB', color: '#185FA5', border: 'none', borderRadius: 8, cursor: 'pointer' },
  dateSummary:{ marginLeft: 'auto', fontSize: 13, fontWeight: 500, color: '#3B6D11', background: '#EAF3DE', padding: '6px 14px', borderRadius: 8 },
  legend:    { display: 'flex', gap: 20, marginBottom: 16 },
  legendItem:{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: '#5A5855' },
  catLabel:  { fontSize: 13, fontWeight: 500, color: '#5A5855', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 },
  catTag:    { fontSize: 11, padding: '2px 8px', borderRadius: 99, fontWeight: 500 },
  grid:      { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 },
  card:      { background: '#fff', border: '0.5px solid rgba(0,0,0,0.1)', borderRadius: 10, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 4 },
  roomNo:    { fontSize: 11, color: '#9A9895' },
  roomName:  { fontSize: 15, fontWeight: 600, color: '#1A1917' },
  roomCat:   { fontSize: 11, color: '#9A9895', marginBottom: 6 },
  guestCard: { background: '#F7F6F2', borderRadius: 8, padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 5 },
  guestRow:  { display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12 },
  guestLabel:{ color: '#9A9895', minWidth: 60 },
  guestVal:  { color: '#1A1917', fontWeight: 400, textAlign: 'right' },
  availBadge:{ background: '#EAF3DE', color: '#3B6D11', fontSize: 12, fontWeight: 500, padding: '6px 10px', borderRadius: 6, textAlign: 'center', marginTop: 4 },
};
