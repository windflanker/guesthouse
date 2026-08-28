import { useEffect, useState } from 'react';
import { api } from '../utils/api.js';
import Badge from '../components/Badge.jsx';

export default function DashboardPage() {
  const [data, setData]           = useState(null);
  const [loading, setLoading]     = useState(true);
  const [dateStats, setDateStats] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [dateLoading, setDateLoading]   = useState(false);

  useEffect(() => {
    api.get('/dashboard')
      .then(d => setData(d))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedDate) return;
    setDateLoading(true);
    api.get(`/dashboard/date/${selectedDate}`)
      .then(d => setDateStats(d))
      .catch(console.error)
      .finally(() => setDateLoading(false));
  }, [selectedDate]);

  if (loading) return (
    <div style={{ padding: 40, color: '#9A9895', fontSize: 14 }}>Loading dashboard…</div>
  );

  const {
    roomStats, bookingStats, categoryOccupancy,
    domiStats, sahyadriStats, overallPendingApproval,
    upcomingCheckins, upcomingCheckouts,
    recentBookings, stalePending,
  } = data;

  const CAT_LABELS = {
    1: 'Cat 1 — Up to Lt Col',
    2: 'Cat 2 — Colonel & Brigadier',
    3: 'Cat 3 — Brigadier & above',
  };

  const CAT_COLORS = {
    1: { bar: '#185FA5' },
    2: { bar: '#EF9F27' },
    3: { bar: '#1D9E75' },
  };

  return (
    <div style={s.page}>
      <div style={s.pageHeader}>
        <h1 style={s.pageTitle}>Dashboard</h1>
        <p style={s.pageSub}>Live overview of occupancy and booking activity</p>
      </div>

      {/* Stale pending alert */}
      {stalePending > 0 && (
        <div style={s.alert}>
          {stalePending} booking{stalePending > 1 ? 's' : ''} pending approval for more than 24 hours
        </div>
      )}

      {/* Overall metrics */}
      <div style={s.metricsGrid}>
        {[
          { label: 'Total Rooms',      value: roomStats.total,              color: '#185FA5' },
          { label: 'Available Today',  value: roomStats.available,          color: '#1D9E75' },
          { label: 'Occupied Today',   value: roomStats.occupied,           color: '#E24B4A' },
          { label: 'Pending Approval', value: bookingStats.pendingApproval, color: '#EF9F27' },
          { label: 'Checked Out',      value: bookingStats.checkedOut,      color: '#9A9895' },
        ].map(m => (
          <div key={m.label} style={s.metricCard}>
            <div style={s.metricLabel}>{m.label}</div>
            <div style={{ ...s.metricValue, color: m.color }}>{m.value}</div>
          </div>
        ))}
      </div>

      {/* Block stats — DOMI and Sahyadri */}
      <div style={s.blockGrid}>
        {/* DOMI Block */}
        <div style={{ ...s.blockCard, borderTop: '3px solid #185FA5' }}>
          <div style={s.blockTitle}>DOMI Block</div>
          <div style={s.blockSub}>R-113 to R-116 — 4 rooms</div>
          <div style={s.blockMetrics}>
            <div style={s.blockMetric}>
              <div style={{ ...s.blockNum, color: '#185FA5' }}>{domiStats.total}</div>
              <div style={s.blockMetricLabel}>Total</div>
            </div>
            <div style={s.blockMetric}>
              <div style={{ ...s.blockNum, color: '#1D9E75' }}>{domiStats.available}</div>
              <div style={s.blockMetricLabel}>Available</div>
            </div>
            <div style={s.blockMetric}>
              <div style={{ ...s.blockNum, color: '#E24B4A' }}>{domiStats.occupied}</div>
              <div style={s.blockMetricLabel}>Occupied</div>
            </div>
            <div style={s.blockMetric}>
              <div style={{ ...s.blockNum, color: '#EF9F27' }}>{overallPendingApproval}</div>
              <div style={s.blockMetricLabel}>Pending</div>
            </div>
          </div>
          <div style={s.barWrap}>
            <div style={{ ...s.bar, width: `${domiStats.total > 0 ? Math.round((domiStats.occupied / domiStats.total) * 100) : 0}%`, background: '#185FA5' }} />
          </div>
          <div style={s.barLabel}>{domiStats.total > 0 ? Math.round((domiStats.occupied / domiStats.total) * 100) : 0}% occupied</div>
        </div>

        {/* Sahyadri Block */}
        <div style={{ ...s.blockCard, borderTop: '3px solid #1D9E75' }}>
          <div style={s.blockTitle}>Sahyadri Block</div>
          <div style={s.blockSub}>R-101 to R-112 — 12 rooms</div>
          <div style={s.blockMetrics}>
            <div style={s.blockMetric}>
              <div style={{ ...s.blockNum, color: '#185FA5' }}>{sahyadriStats.total}</div>
              <div style={s.blockMetricLabel}>Total</div>
            </div>
            <div style={s.blockMetric}>
              <div style={{ ...s.blockNum, color: '#1D9E75' }}>{sahyadriStats.available}</div>
              <div style={s.blockMetricLabel}>Available</div>
            </div>
            <div style={s.blockMetric}>
              <div style={{ ...s.blockNum, color: '#E24B4A' }}>{sahyadriStats.occupied}</div>
              <div style={s.blockMetricLabel}>Occupied</div>
            </div>
            <div style={s.blockMetric}>
              <div style={{ ...s.blockNum, color: '#EF9F27' }}>{overallPendingApproval}</div>
              <div style={s.blockMetricLabel}>Pending</div>
            </div>
          </div>
          <div style={s.barWrap}>
            <div style={{ ...s.bar, width: `${sahyadriStats.total > 0 ? Math.round((sahyadriStats.occupied / sahyadriStats.total) * 100) : 0}%`, background: '#1D9E75' }} />
          </div>
          <div style={s.barLabel}>{sahyadriStats.total > 0 ? Math.round((sahyadriStats.occupied / sahyadriStats.total) * 100) : 0}% occupied</div>
        </div>
      </div>

      {/* Date-based room status */}
      <div style={s.dateSection}>
        <div style={s.dateSectionHeader}>
          <div>
            <div style={s.sectionTitle}>Room Status by Date</div>
            <div style={s.sectionSub}>Select a date to see availability breakdown</div>
          </div>
          <input type="date" value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            style={s.dateInput} />
        </div>

        {dateLoading ? (
          <div style={{ padding: 20, color: '#9A9895', fontSize: 13 }}>Loading…</div>
        ) : dateStats && (
          <div style={s.dateStatsWrap}>
            {/* Header */}
            <div style={s.dateStatsHeader}>
              <div style={{ flex: 2 }}>Block</div>
              <div style={s.dateStatsCol}>Total</div>
              <div style={s.dateStatsCol}>Available</div>
              <div style={s.dateStatsCol}>Occupied</div>
              <div style={s.dateStatsCol}>Pending Approval</div>
            </div>

            {/* DOMI row */}
            <div style={s.dateStatsRow}>
              <div style={{ flex: 2 }}>
                <div style={s.dateBlockName}>DOMI</div>
                <div style={s.dateBlockSub}>R-113 to R-116</div>
              </div>
              <div style={{ ...s.dateStatsCol, ...s.dateNum, color: '#185FA5' }}>{dateStats.domi.total}</div>
              <div style={{ ...s.dateStatsCol, ...s.dateNum, color: '#1D9E75' }}>{dateStats.domi.available}</div>
              <div style={{ ...s.dateStatsCol, ...s.dateNum, color: '#E24B4A' }}>{dateStats.domi.occupied}</div>
              <div style={{ ...s.dateStatsCol, ...s.dateNum, color: '#EF9F27' }}>{dateStats.domi.pendingApproval}</div>
            </div>

            {/* Sahyadri row */}
            <div style={s.dateStatsRow}>
              <div style={{ flex: 2 }}>
                <div style={s.dateBlockName}>Sahyadri</div>
                <div style={s.dateBlockSub}>R-101 to R-112</div>
              </div>
              <div style={{ ...s.dateStatsCol, ...s.dateNum, color: '#185FA5' }}>{dateStats.sahyadri.total}</div>
              <div style={{ ...s.dateStatsCol, ...s.dateNum, color: '#1D9E75' }}>{dateStats.sahyadri.available}</div>
              <div style={{ ...s.dateStatsCol, ...s.dateNum, color: '#E24B4A' }}>{dateStats.sahyadri.occupied}</div>
              <div style={{ ...s.dateStatsCol, ...s.dateNum, color: '#EF9F27' }}>{dateStats.sahyadri.pendingApproval}</div>
            </div>

            {/* Overall row */}
            <div style={{ ...s.dateStatsRow, background: '#F7F6F2', borderRadius: '0 0 10px 10px' }}>
              <div style={{ flex: 2 }}>
                <div style={{ ...s.dateBlockName, fontWeight: 700 }}>Overall</div>
                <div style={s.dateBlockSub}>All 16 rooms</div>
              </div>
              <div style={{ ...s.dateStatsCol, ...s.dateNum, color: '#185FA5', fontWeight: 700 }}>{dateStats.overall.total}</div>
              <div style={{ ...s.dateStatsCol, ...s.dateNum, color: '#1D9E75', fontWeight: 700 }}>{dateStats.overall.available}</div>
              <div style={{ ...s.dateStatsCol, ...s.dateNum, color: '#E24B4A', fontWeight: 700 }}>{dateStats.overall.occupied}</div>
              <div style={{ ...s.dateStatsCol, ...s.dateNum, color: '#EF9F27', fontWeight: 700 }}>{dateStats.overall.pendingApproval}</div>
            </div>
          </div>
        )}
      </div>

      {/* Category occupancy */}
      <div style={s.card}>
        <div style={s.sectionTitle}>Category Occupancy — Today</div>
        <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {categoryOccupancy.map(c => {
            const pct = c.total > 0 ? Math.round((c.occupied / c.total) * 100) : 0;
            return (
              <div key={c.category}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                  <span style={{ color: '#5A5855' }}>{CAT_LABELS[c.category]}</span>
                  <span style={{ fontWeight: 500, color: '#1A1917' }}>{c.occupied}/{c.total}</span>
                </div>
                <div style={{ height: 8, background: '#F0EFEB', borderRadius: 99, overflow: 'hidden' }}>
                  <div style={{ height: '100%', borderRadius: 99, background: CAT_COLORS[c.category].bar, width: `${pct}%`, transition: 'width 0.4s ease' }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Upcoming checkins and checkouts */}
      <div style={s.twoCol}>
        <div style={s.card}>
          <div style={s.sectionTitle}>
            Upcoming Check-ins
            <span style={s.sectionBadge}>Next 7 days</span>
          </div>
          {upcomingCheckins.length === 0
            ? <div style={s.empty}>No upcoming check-ins</div>
            : upcomingCheckins.map(b => (
              <div key={b._id} style={s.listRow}>
                <div>
                  <div style={s.listName}>{b.officer.rank} {b.officer.name}</div>
                  <div style={s.listSub}>{b.officer.unit}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={s.listDate}>{b.checkin}</div>
                  <div style={s.listSub}>{b.room ? b.room.name : 'No room'}</div>
                </div>
              </div>
            ))
          }
        </div>

        <div style={s.card}>
          <div style={s.sectionTitle}>
            Upcoming Check-outs
            <span style={s.sectionBadge}>Next 7 days</span>
          </div>
          {upcomingCheckouts.length === 0
            ? <div style={s.empty}>No upcoming check-outs</div>
            : upcomingCheckouts.map(b => (
              <div key={b._id} style={s.listRow}>
                <div>
                  <div style={s.listName}>{b.officer.rank} {b.officer.name}</div>
                  <div style={s.listSub}>{b.officer.unit}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={s.listDate}>{b.checkout}</div>
                  <div style={s.listSub}>{b.room ? b.room.name : 'No room'}</div>
                </div>
              </div>
            ))
          }
        </div>
      </div>

      {/* Recent bookings */}
      <div style={{ ...s.card, marginTop: 16 }}>
        <div style={s.sectionTitle}>Recent Bookings</div>
        <div style={{ overflowX: 'auto', marginTop: 12 }}>
          <table style={s.table}>
            <thead>
              <tr>
                {['Ref', 'Officer', 'Rank', 'Unit', 'Check-in', 'Check-out', 'Status'].map(h => (
                  <th key={h} style={s.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentBookings.map(b => (
                <tr key={b._id}>
                  <td style={{ ...s.td, color: '#9A9895', fontSize: 12 }}>{b.ref}</td>
                  <td style={{ ...s.td, fontWeight: 500 }}>{b.officer.name}</td>
                  <td style={{ ...s.td, color: '#5A5855', fontSize: 12 }}>{b.officer.rank}</td>
                  <td style={{ ...s.td, color: '#5A5855', fontSize: 12 }}>{b.officer.unit}</td>
                  <td style={{ ...s.td, fontSize: 12 }}>{b.checkin}</td>
                  <td style={{ ...s.td, fontSize: 12 }}>{b.checkout}</td>
                  <td style={s.td}><Badge status={b.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const s = {
  page:             { padding: '24px 28px', maxWidth: 1100, margin: '0 auto' },
  pageHeader:       { marginBottom: 20 },
  pageTitle:        { fontSize: 22, fontWeight: 500, color: '#1A1917' },
  pageSub:          { fontSize: 13, color: '#9A9895', marginTop: 4 },
  alert:            { background: '#FAEEDA', border: '0.5px solid #EF9F27', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#854F0B', marginBottom: 16 },
  metricsGrid:      { display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 20 },
  metricCard:       { background: '#fff', border: '0.5px solid rgba(0,0,0,0.08)', borderRadius: 12, padding: '14px 16px' },
  metricLabel:      { fontSize: 11, color: '#9A9895', marginBottom: 6, fontWeight: 500 },
  metricValue:      { fontSize: 28, fontWeight: 600 },
  blockGrid:        { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 },
  blockCard:        { background: '#fff', border: '0.5px solid rgba(0,0,0,0.08)', borderRadius: 12, padding: '18px 20px' },
  blockTitle:       { fontSize: 15, fontWeight: 600, color: '#1A1917', marginBottom: 4 },
  blockSub:         { fontSize: 12, color: '#9A9895', marginBottom: 16 },
  blockMetrics:     { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 14 },
  blockMetric:      { textAlign: 'center' },
  blockNum:         { fontSize: 24, fontWeight: 600 },
  blockMetricLabel: { fontSize: 11, color: '#9A9895', marginTop: 2 },
  barWrap:          { height: 6, background: '#F0EFEB', borderRadius: 99, overflow: 'hidden', marginBottom: 6 },
  bar:              { height: '100%', borderRadius: 99, transition: 'width 0.4s ease' },
  barLabel:         { fontSize: 11, color: '#9A9895', textAlign: 'right' },
  dateSection:      { background: '#fff', border: '0.5px solid rgba(0,0,0,0.08)', borderRadius: 12, padding: '18px 20px', marginBottom: 20 },
  dateSectionHeader:{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, flexWrap: 'wrap', gap: 12 },
  sectionTitle:     { fontSize: 14, fontWeight: 600, color: '#1A1917' },
  sectionSub:       { fontSize: 12, color: '#9A9895', marginTop: 2 },
  sectionBadge:     { fontSize: 11, background: '#E6F1FB', color: '#185FA5', padding: '2px 8px', borderRadius: 99, marginLeft: 8, fontWeight: 400 },
  dateInput:        { fontSize: 14, padding: '7px 12px', border: '0.5px solid rgba(0,0,0,0.18)', borderRadius: 8, background: '#f7f6f2', color: '#1A1917', outline: 'none' },
  dateStatsWrap:    { border: '0.5px solid rgba(0,0,0,0.08)', borderRadius: 10, overflow: 'hidden' },
  dateStatsHeader:  { display: 'flex', alignItems: 'center', padding: '10px 16px', background: '#F7F6F2', fontSize: 11, fontWeight: 600, color: '#9A9895', textTransform: 'uppercase', letterSpacing: '0.05em' },
  dateStatsRow:     { display: 'flex', alignItems: 'center', padding: '12px 16px', borderTop: '0.5px solid rgba(0,0,0,0.06)' },
  dateStatsCol:     { flex: 1, textAlign: 'center' },
  dateBlockName:    { fontSize: 13, fontWeight: 600, color: '#1A1917' },
  dateBlockSub:     { fontSize: 11, color: '#9A9895', marginTop: 2 },
  dateNum:          { fontSize: 18, fontWeight: 600 },
  card:             { background: '#fff', border: '0.5px solid rgba(0,0,0,0.08)', borderRadius: 12, padding: '18px 20px', marginBottom: 16 },
  twoCol:           { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 0 },
  listRow:          { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '0.5px solid rgba(0,0,0,0.06)' },
  listName:         { fontSize: 13, fontWeight: 500, color: '#1A1917' },
  listSub:          { fontSize: 11, color: '#9A9895', marginTop: 2 },
  listDate:         { fontSize: 13, fontWeight: 500, color: '#185FA5' },
  empty:            { fontSize: 13, color: '#9A9895', padding: '16px 0', textAlign: 'center' },
  table:            { width: '100%', borderCollapse: 'collapse', fontSize: 13 },
  th:               { textAlign: 'left', padding: '8px 10px', fontSize: 11, color: '#9A9895', borderBottom: '0.5px solid rgba(0,0,0,0.08)', fontWeight: 600, textTransform: 'uppercase',
