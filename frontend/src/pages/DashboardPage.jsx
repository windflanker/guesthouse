import { useEffect, useState } from 'react';
import { api } from '../utils/api.js';
import Badge from '../components/Badge.jsx';

const CAT_LABELS = { 1: 'Up to Lt Col', 2: 'Col & Brig', 3: 'Brig & above' };
const CAT_COLORS = { 1: '#185FA5', 2: '#EF9F27', 3: '#1D9E75' };
const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function DashboardPage() {
  const [data, setData] = useState(null);

  useEffect(() => { api.get('/dashboard').then(setData).catch(console.error); }, []);

  if (!data) return <p style={{ color: '#9A9895', padding: 20 }}>Loading dashboard…</p>;

  const {
    roomStats, occupancyRate, bookingStats, cancellationRate, avgStay,
    categoryOccupancy, monthlyBookings, upcomingCheckins, upcomingCheckouts,
    stalePending, thisMonthCount, lastMonthCount, recentBookings,
  } = data;

  const maxMonthly = Math.max(...monthlyBookings.map(m => m.count), 1);
  const monthChange = lastMonthCount > 0
    ? Math.round(((thisMonthCount - lastMonthCount) / lastMonthCount) * 100) : 0;

  return (
    <div>
      <div style={s.pageHeader}>
        <h2 style={s.pageTitle}>Dashboard</h2>
        <p style={s.pageSub}>Live overview — Officers' Guest House</p>
      </div>

      {/* Stale pending alert */}
      {stalePending > 0 && (
        <div style={s.alert}>
          ⚠️ {stalePending} booking request{stalePending > 1 ? 's have' : ' has'} been pending for more than 24 hours. Please review.
        </div>
      )}

      {/* Top metrics */}
      <div style={s.metrics5}>
        {[
          { label: 'Total Rooms',     value: roomStats.total,              color: '#185FA5', sub: '3 categories' },
          { label: 'Available Now',   value: roomStats.available,          color: '#1D9E75', sub: `${occupancyRate}% occupied` },
          { label: 'Occupied',        value: roomStats.occupied,           color: '#E24B4A', sub: 'Checked in' },
          { label: 'Pending Approval',value: bookingStats.pendingApproval, color: '#EF9F27', sub: 'Awaiting review' },
          { label: 'Avg Stay',        value: `${avgStay}d`,               color: '#5A5855', sub: 'Per booking' },
        ].map(m => (
          <div key={m.label} style={s.metric}>
            <div style={s.metricLabel}>{m.label}</div>
            <div style={{ ...s.metricValue, color: m.color }}>{m.value}</div>
            <div style={s.metricSub}>{m.sub}</div>
          </div>
        ))}
      </div>

      {/* Monthly bookings chart + monthly comparison */}
      <div style={s.grid2}>
        <div style={s.card}>
          <div style={s.cardHeader}>
            <div style={s.cardTitle}>Bookings per month</div>
            <div style={s.monthBadge}>
              <span>This month: {thisMonthCount}</span>
              <span style={{ color: monthChange >= 0 ? '#1D9E75' : '#E24B4A', marginLeft: 10, fontWeight: 500 }}>
                {monthChange >= 0 ? '▲' : '▼'} {Math.abs(monthChange)}% vs last month
              </span>
            </div>
          </div>
          <div style={s.barChart}>
            {monthlyBookings.map((m, i) => (
              <div key={i} style={s.barCol}>
                <div style={s.barWrap}>
                  <div style={{ ...s.bar, height: `${Math.round((m.count / maxMonthly) * 100)}%`, background: m.count === Math.max(...monthlyBookings.map(x=>x.count)) ? '#185FA5' : '#B8D4F0' }} />
                </div>
                <div style={s.barLabel}>{m.month.split(' ')[0]}</div>
                {m.count > 0 && <div style={s.barCount}>{m.count}</div>}
              </div>
            ))}
          </div>
        </div>

        {/* Category occupancy */}
        <div style={s.card}>
          <div style={s.cardTitle}>Category occupancy</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18, marginTop: 12 }}>
            {categoryOccupancy.map(c => {
              const pct = c.total ? Math.round((c.occupied / c.total) * 100) : 0;
              return (
                <div key={c.category}>
                  <div style={s.barHeader}>
                    <span style={{ fontSize: 13, color: '#5A5855' }}>Cat {c.category} — {CAT_LABELS[c.category]}</span>
                    <span style={{ fontSize: 13, fontWeight: 500 }}>{c.occupied}/{c.total} occupied</span>
                  </div>
                  <div style={s.trackBar}>
                    <div style={{ ...s.fillBar, width: pct + '%', background: CAT_COLORS[c.category] }} />
                  </div>
                  <div style={{ fontSize: 11, color: '#9A9895', marginTop: 4 }}>{c.bookings} total bookings in this category</div>
                </div>
              );
            })}
          </div>
          {/* Cancellation rate */}
          <div style={s.statRow}>
            <span style={{ color: '#5A5855', fontSize: 13 }}>Cancellation rate</span>
            <span style={{ fontWeight: 500, color: cancellationRate > 20 ? '#E24B4A' : '#1D9E75' }}>{cancellationRate}%</span>
          </div>
          <div style={s.statRow}>
            <span style={{ color: '#5A5855', fontSize: 13 }}>Total bookings (all time)</span>
            <span style={{ fontWeight: 500 }}>{bookingStats.total}</span>
          </div>
        </div>
      </div>

      {/* Upcoming check-ins & check-outs + Recent activity */}
      <div style={s.grid3}>
        <div style={s.card}>
          <div style={s.cardTitle}>Upcoming check-ins <span style={s.smallBadge}>next 7 days</span></div>
          {upcomingCheckins.length === 0
            ? <p style={s.empty}>No upcoming check-ins</p>
            : upcomingCheckins.map(b => (
              <div key={b._id} style={s.listRow}>
                <div>
                  <div style={{ fontWeight: 500, fontSize: 13 }}>{b.officer.rank} {b.officer.name}</div>
                  <div style={{ fontSize: 11, color: '#9A9895' }}>{b.officer.unit}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 12, color: '#185FA5', fontWeight: 500 }}>{b.checkin}</div>
                  <div style={{ fontSize: 11, color: '#9A9895' }}>{b.room?.name || b.room?.number || 'TBD'}</div>
                </div>
              </div>
            ))
          }
        </div>

        <div style={s.card}>
          <div style={s.cardTitle}>Upcoming check-outs <span style={s.smallBadge}>next 7 days</span></div>
          {upcomingCheckouts.length === 0
            ? <p style={s.empty}>No upcoming check-outs</p>
            : upcomingCheckouts.map(b => (
              <div key={b._id} style={s.listRow}>
                <div>
                  <div style={{ fontWeight: 500, fontSize: 13 }}>{b.officer.rank} {b.officer.name}</div>
                  <div style={{ fontSize: 11, color: '#9A9895' }}>{b.room?.name || b.room?.number || '—'}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 12, color: '#E24B4A', fontWeight: 500 }}>{b.checkout}</div>
                </div>
              </div>
            ))
          }
        </div>

        <div style={s.card}>
          <div style={s.cardTitle}>Recent activity</div>
          <table style={s.table}>
            <thead><tr>
              <th style={s.th}>Officer</th>
              <th style={s.th}>Rank</th>
              <th style={s.th}>Status</th>
            </tr></thead>
            <tbody>
              {recentBookings.map(b => (
                <tr key={b._id}>
                  <td style={s.td}><span style={{ fontWeight: 500 }}>{b.officer.name}</span></td>
                  <td style={{ ...s.td, color: '#5A5855' }}>{b.officer.rank}</td>
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
  pageHeader: { marginBottom: 20 },
  pageTitle:  { fontSize: 22, fontWeight: 500, color: '#1A1917' },
  pageSub:    { fontSize: 13, color: '#9A9895', marginTop: 4 },
  alert: {
    background: '#FAEEDA', border: '0.5px solid #EF9F27',
    borderRadius: 10, padding: '12px 16px', fontSize: 13,
    color: '#854F0B', marginBottom: 20,
  },
  metrics5: { display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 12, marginBottom: 20 },
  metric: { background: '#F7F6F2', border: '0.5px solid rgba(0,0,0,0.08)', borderRadius: 10, padding: '14px 16px' },
  metricLabel: { fontSize: 12, color: '#9A9895', marginBottom: 6 },
  metricValue: { fontSize: 24, fontWeight: 500 },
  metricSub:   { fontSize: 11, color: '#9A9895', marginTop: 2 },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 },
  grid3: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 },
  card: { background: '#fff', border: '0.5px solid rgba(0,0,0,0.08)', borderRadius: 14, padding: '18px 20px' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  cardTitle:  { fontSize: 14, fontWeight: 500, color: '#1A1917', marginBottom: 14 },
  monthBadge: { fontSize: 12, color: '#5A5855' },
  barChart: { display: 'flex', alignItems: 'flex-end', gap: 4, height: 120, paddingTop: 8 },
  barCol:  { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 },
  barWrap: { width: '100%', height: 90, display: 'flex', alignItems: 'flex-end' },
  bar:     { width: '100%', borderRadius: '4px 4px 0 0', minHeight: 2, transition: 'height 0.3s' },
  barLabel:{ fontSize: 9, color: '#9A9895' },
  barCount:{ fontSize: 9, color: '#185FA5', fontWeight: 500 },
  barHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: 6 },
  trackBar: { height: 6, background: '#F7F6F2', borderRadius: 99, overflow: 'hidden' },
  fillBar:  { height: '100%', borderRadius: 99 },
  statRow: { display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderTop: '0.5px solid rgba(0,0,0,0.06)', marginTop: 8 },
  listRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: '0.5px solid rgba(0,0,0,0.06)' },
  empty: { fontSize: 13, color: '#9A9895', padding: '12px 0' },
  smallBadge: { fontSize: 10, background: '#E6F1FB', color: '#185FA5', padding: '2px 7px', borderRadius: 99, marginLeft: 6, fontWeight: 400 },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 13 },
  th: { textAlign: 'left', padding: '6px 8px', fontSize: 11, color: '#9A9895', borderBottom: '0.5px solid rgba(0,0,0,0.08)', fontWeight: 500 },
  td: { padding: '9px 8px', borderBottom: '0.5px solid rgba(0,0,0,0.06)', color: '#1A1917' },
};
