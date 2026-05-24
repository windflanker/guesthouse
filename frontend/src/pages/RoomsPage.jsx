import { useEffect, useState } from 'react';
import { api } from '../utils/api.js';
import Badge from '../components/Badge.jsx';

const CAT = {
  1: { label: 'Category 1 — Up to Lt Col',       bg: '#E6F1FB', text: '#185FA5', border: '#1D9E75' },
  2: { label: 'Category 2 — Colonel & Brigadier', bg: '#FAEEDA', text: '#854F0B', border: '#EF9F27' },
  3: { label: 'Category 3 — Brigadier & above',   bg: '#EAF3DE', text: '#3B6D11', border: '#E24B4A' },
};

const BORDER = { available: '#1D9E75', pending: '#EF9F27', occupied: '#E24B4A' };

function toDateStr(date) {
  return date.toISOString().split('T')[0];
}

export default function RoomsPage() {
  const [rooms, setRooms] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [selectedDate, setSelectedDate] = useState(toDateStr(new Date()));
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const [r, b] = await Promise.all([
      api.get('/rooms'),
      api.get('/bookings'),
    ]);
    setRooms(r);
    setBookings(b);
  };

  useEffect(() => { load(); }, []);

  const getRoomStatusOnDate = (room) => {
    const date = selectedDate;
    const booking = bookings.find(b =>
      b.room?._id === room._id &&
      ['Approved', 'Checked In'].includes(b.status) &&
      b.checkin <= date && b.checkout >= date
    );
    if (booking) return { status: 'occupied', guest: booking.officer.name, checkin: booking.checkin, checkout: booking.checkout };
    return { status: 'available', guest: null };
  };

  const saveName = async (room) => {
    setSaving(true);
    try {
      await api.patch(`/rooms/${room._id}`, { name: editing.name });
      setEditing(null); load();
    } finally { setSaving(false); }
  };

  const isToday = selectedDate === toDateStr(new Date());

  return (
    <div>
      <div style={s.pageHeader}>
        <h2 style={s.pageTitle}>Room Status</h2>
        <p style={s.pageSub}>Check room availability for any date</p>
      </div>

      {/* Date picker */}
      <div style={s.datePicker}>
        <div style={s.datePickerLabel}>Check availability for:</div>
        <input type="date" value={selectedDate}
          onChange={e => setSelectedDate(e.target.value)}
          style={s.dateInput} />
        {!isToday && (
          <button style={s.todayBtn} onClick={() => setSelectedDate(toDateStr(new Date()))}>
            Today
          </button>
        )}
        <div style={s.dateSummary}>
          {rooms.filter(r => getRoomStatusOnDate(r).status === 'available').length} of {rooms.length} rooms available
        </div>
      </div>

      {/* Legend */}
      <div style={s.legend}>
        {[['Available','#1D9E75'],['Occupied','#E24B4A']].map(([l,c]) => (
          <div key={l} style={s.legendItem}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: c }} />
            {l}
          </div>
        ))}
        <div style={s.legendItem}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#9A9895' }} />
          Click room name to edit
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
              {rooms.filter(r => r.category === cat && getRoomStatusOnDate(r).status === 'available').length} available
            </span>
          </div>
          <div style={s.grid}>
            {rooms.filter(r => r.category === cat).map(room => {
              const info = getRoomStatusOnDate(room);
              return (
                <div key={room._id} style={{ ...s.roomCard, borderLeft: `3px solid ${BORDER[info.status] || '#9A9895'}` }}>
                  <div style={s.roomNo}>{room.number}</div>

                  {editing?.roomId === room._id ? (
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center', margin: '4px 0' }}>
                      <input style={s.nameInput} value={editing.name}
                        onChange={e => setEditing(ed => ({ ...ed, name: e.target.value }))} autoFocus />
                      <button style={s.saveBtn} onClick={() => saveName(room)} disabled={saving}>✓</button>
                      <button style={s.cancelBtn} onClick={() => setEditing(null)}>✕</button>
                    </div>
                  ) : (
                    <div style={s.roomName} onClick={() => setEditing({ roomId: room._id, name: room.name || '' })}>
                      {room.name || <span style={{ color: '#9A9895', fontStyle: 'italic' }}>Add name…</span>}
                      <span style={{ fontSize: 10, color: '#9A9895', marginLeft: 4 }}>✎</span>
                    </div>
                  )}

                  <div style={s.roomCat}>{CAT[room.category].label.split(' — ')[1]}</div>

                  {info.status === 'occupied' ? (
                    <div style={s.occupiedInfo}>
                      <div style={{ fontWeight: 500, fontSize: 12 }}>{info.guest}</div>
                      <div style={{ fontSize: 11, color: '#5A5855', marginTop: 2 }}>{info.checkin} → {info.checkout}</div>
                    </div>
                  ) : null}

                  <Badge status={info.status} />
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
  pageHeader: { marginBottom: 20 },
  pageTitle:  { fontSize: 22, fontWeight: 500, color: '#1A1917' },
  pageSub:    { fontSize: 13, color: '#9A9895', marginTop: 4 },
  datePicker: {
    display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20,
    background: '#fff', border: '0.5px solid rgba(0,0,0,0.1)',
    borderRadius: 12, padding: '14px 18px',
  },
  datePickerLabel: { fontSize: 13, fontWeight: 500, color: '#5A5855' },
  dateInput: {
    fontSize: 14, padding: '7px 12px',
    border: '0.5px solid rgba(0,0,0,0.18)', borderRadius: 8,
    background: '#f7f6f2', color: '#1A1917', outline: 'none',
  },
  todayBtn: {
    fontSize: 12, padding: '6px 12px',
    background: '#E6F1FB', color: '#185FA5',
    border: 'none', borderRadius: 8, cursor: 'pointer',
  },
  dateSummary: {
    marginLeft: 'auto', fontSize: 13, fontWeight: 500, color: '#3B6D11',
    background: '#EAF3DE', padding: '6px 14px', borderRadius: 8,
  },
  legend: { display: 'flex', gap: 20, marginBottom: 16 },
  legendItem: { display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: '#5A5855' },
  catLabel: { fontSize: 13, fontWeight: 500, color: '#5A5855', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 },
  catTag: { fontSize: 11, padding: '2px 8px', borderRadius: 99, fontWeight: 500 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 },
  roomCard: {
    background: '#fff', border: '0.5px solid rgba(0,0,0,0.1)',
    borderRadius: 10, padding: '12px 14px',
    display: 'flex', flexDirection: 'column', gap: 4,
  },
  roomNo:   { fontSize: 11, color: '#9A9895' },
  roomName: { fontSize: 14, fontWeight: 500, color: '#1A1917', cursor: 'pointer', display: 'flex', alignItems: 'center' },
  roomCat:  { fontSize: 11, color: '#9A9895' },
  occupiedInfo: { background: '#FCEBEB', borderRadius: 6, padding: '6px 8px', marginTop: 4 },
  nameInput: { flex: 1, padding: '4px 8px', fontSize: 13, border: '0.5px solid #185FA5', borderRadius: 6, outline: 'none', color: '#1A1917', background: '#fff' },
  saveBtn:   { background: '#1D9E75', color: '#fff', border: 'none', borderRadius: 6, padding: '3px 8px', cursor: 'pointer', fontSize: 13 },
  cancelBtn: { background: 'none', color: '#9A9895', border: '0.5px solid rgba(0,0,0,0.18)', borderRadius: 6, padding: '3px 8px', cursor: 'pointer', fontSize: 13 },
};
