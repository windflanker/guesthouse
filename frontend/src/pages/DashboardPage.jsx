import { useEffect, useState } from 'react';
import { api } from '../utils/api.js';

const DOMI_ROOM_NAMES = ['Tololing', 'Hilli', 'Zojila', 'Rizangla'];

const PERIODS = [
  { value: 'week',    label: 'Week' },
  { value: 'month',   label: 'Month' },
  { value: 'quarter', label: 'Quarter' },
  { value: 'year',    label: 'Year' },
];

export default function DashboardPage() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);

  const [period, setPeriod]         = useState('month');
  const [trend, setTrend]           = useState(null);
  const [trendLoading, setTrendLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard')
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    setTrendLoading(true);
    api.get(`/dashboard/trend?period=${period}`)
      .then(setTrend)
      .catch(console.error)
      .finally(() => setTrendLoading(false));
  }, [period]);

  if (loading) return (
    <div style={{ padding: 40, color: '#9A9895', fontSize: 14 }}>Loading dashboard…</div>
  );

  const { domiStats, sahyadriStats, stalePending, upcomingCheckins, upcomingCheckouts } = data;
  const maxCount = trend ? Math.max(...trend.buckets.map(b => b.count), 1) : 1;

  return (
    <div style={s.page}>
      <style>{`
        .dash-grid-2 { display: grid; grid-template-columns: 1fr; gap: 12px; }
        @media (min-width: 700px) {
          .dash-grid-2 { grid-template-columns: 1fr 1fr; gap: 16px; }
        }
        .dash-trend-track { display: flex; align-items: flex-end; gap: 6px; height: 130px; min-width: 480px; }
        @media (min-width: 700px) {
          .dash-trend-track { min-width: 0; }
        }
      `}</style>

      <div style={s.pageHeader}>
        <h1 style={s.pageTitle}>Dashboard</h1>
        <p style={s.pageSub}>Live overview of occupancy and booking activity</p>
      </div>

      {stalePending > 0 && (
        <div style={s.alert}>
          {stalePending} booking{stalePending > 1 ? 's' : ''} pending approval for more than 24 hours
        </div>
      )}

      {/* Status of Rooms */}
      <div style={s.sectionHeading}>Status of Rooms</div>
      <div className="dash-grid-2" style={{ marginBottom: 20 }}>
        <BlockCard title="Sahyadri" sub="Main block" occupied={sahyadriStats.occupied} vacant={sahyadriStats.available} total={sahyadriStats.total} color="#1D9E75" />
        <BlockCard title="DOMI" sub={DOMI_ROOM_NAMES.join(', ')} occupied={domiStats.occupied} vacant={domiStats.available} total={domiStats.total} color="#185FA5" />
      </div>

      {/* Avg Occupancy trend */}
      <div style={s.card}>
        <div style={s.cardHeaderRow}>
          <div style={s.cardTitle}>Avg Occupancy</div>
          <select value={period} onChange={e => setPeriod(e.target.value)} style={s.periodSelect}>
            {PERIODS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
        </div>
        {trendLoading || !trend ? (
          <div style={{ color: '#9A9895', fontSize: 13, padding: '20px 0' }}>Loading…</div>
        ) : (
          <div style={{ overflowX: 'auto', paddingTop: 8 }}>
            <div className="dash-trend-track">
              {trend.buckets.map((b, i) => (
                <div key={i} style={s.barCol}>
                  <div style={s.barWrap}>
                    <div style={{ ...s.bar, height: `${Math.round((b.count / maxCount) * 100)}%` }} />
                  </div>
                  <div style={s.barLabel}>{b.label}</div>
                  {b.count > 0 && <div style={s.barCount}>{b.count}</div>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Upcoming check-ins & check-outs */}
      <div style={s.sectionHeading}>Upcoming</div>
      <div className="dash-grid-2">
        <div style={s.card}>
          <div style={s.cardTitle}>Check-ins <span style={s.smallBadge}>next 7 days</span></div>
          {upcomingCheckins.length === 0
            ? <div style={s.empty}>No upcoming check-ins</div>
            : upcomingCheckins.map(b => (
              <div key={b._id} style={s.listRow}>
                <div>
                  <div style={s.listName}>{b.officer.rank} {b.officer.name}</div>
                  <div style={s.listSub}>{b.room ? b.room.name : 'No room'}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ ...s.listDate, color: '#185FA5' }}>{b.checkin}</div>
                  <div style={s.listSub}>{b.officer.arrivalTime || 'Time TBD'}</div>
                </div>
              </div>
            ))
          }
        </div>

        <div style={s.card}>
          <div style={s.cardTitle}>Check-outs <span style={s.smallBadge}>next 7 days</span></div>
          {upcomingCheckouts.length === 0
            ? <div style={s.empty}>No upcoming check-outs</div>
            : upcomingCheckouts.map(b => (
              <div key={b._id} style={s.listRow}>
                <div>
                  <div style={s.listName}>{b.officer.rank} {b.officer.name}</div>
                  <div style={s.listSub}>{b.room ? b.room.name : 'No room'}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ ...s.listDate, color: '#E24B4A' }}>{b.checkout}</div>
                  <div style={s.listSub}>By 1000h</div>
                </div>
              </div>
            ))
          }
        </div>
      </div>
    </div>
  );
}

function BlockCard({ title, sub, occupied, vacant, total, color }) {
  return (
    <div style={{ ...s.blockCard, borderTop: `3px solid ${color}` }}>
      <div style={s.blockTitle}>{title}</div>
      <div style={s.blockSub}>{sub}</div>
      <div style={s.blockMetrics}>
        <div style={s.blockMetric}>
          <div style={{ ...s.blockNum, color: '#E24B4A' }}>{occupied}</div>
          <div style={s.blockMetricLabel}>Occupied</div>
        </div>
        <div style={s.blockMetric}>
          <div style={{ ...s.blockNum, color: '#1D9E75' }}>{vacant}</div>
          <div style={s.blockMetricLabel}>Vacant</div>
        </div>
        <div style={s.blockMetric}>
          <div style={s.blockNum}>{total}</div>
          <div style={s.blockMetricLabel}>Total</div>
        </div>
      </div>
    </div>
  );
}

const s = {
  page:             { padding: '16px 16px 32px', maxWidth: 900, margin: '0 auto' },
  pageHeader:       { marginBottom: 16 },
  pageTitle:        { fontSize: 20, fontWeight: 500, color: '#1A1917' },
  pageSub:          { fontSize: 13, color: '#9A9895', marginTop: 4 },
  alert:            { background: '#FAEEDA', border: '0.5px solid #EF9F27', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#854F0B', marginBottom: 16 },
  sectionHeading:   { fontSize: 13, fontWeight: 600, color: '#5A5855', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 10 },
  card:             { background: '#fff', border: '0.5px solid rgba(0,0,0,0.08)', borderRadius: 12, padding: '16px 18px', marginBottom: 20 },
  cardHeaderRow:    { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4, flexWrap: 'wrap', gap: 8 },
  cardTitle:        { fontSize: 14, fontWeight: 600, color: '#1A1917' },
  periodSelect:     { fontSize: 13, padding: '6px 10px', border: '0.5px solid rgba(0,0,0,0.18)', borderRadius: 8, background: '#F7F6F2', color: '#1A1917', outline: 'none' },
  blockCard:        { background: '#fff', border: '0.5px solid rgba(0,0,0,0.08)', borderRadius: 12, padding: '16px 18px' },
  blockTitle:       { fontSize: 15, fontWeight: 600, color: '#1A1917', marginBottom: 2 },
  blockSub:         { fontSize: 12, color: '#9A9895', marginBottom: 14 },
  blockMetrics:     { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 },
  blockMetric:      { textAlign: 'center' },
  blockNum:         { fontSize: 24, fontWeight: 600, color: '#1A1917' },
  blockMetricLabel: { fontSize: 11, color: '#9A9895', marginTop: 2 },
  barCol:           { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, minWidth: 32 },
  barWrap:          { width: '100%', height: 90, display: 'flex', alignItems: 'flex-end' },
  bar:              { width: '100%', minHeight: 2, borderRadius: '4px 4px 0 0', background: '#185FA5', transition: 'height 0.3s' },
  barLabel:         { fontSize: 10, color: '#9A9895' },
  barCount:         { fontSize: 10, color: '#185FA5', fontWeight: 600 },
  smallBadge:       { fontSize: 10, background: '#E6F1FB', color: '#185FA5', padding: '2px 7px', borderRadius: 99, marginLeft: 6, fontWeight: 400 },
  listRow:          { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '0.5px solid rgba(0,0,0,0.06)' },
  listName:         { fontSize: 13, fontWeight: 500, color: '#1A1917' },
  listSub:          { fontSize: 11, color: '#9A9895', marginTop: 2 },
  listDate:         { fontSize: 13, fontWeight: 500 },
  empty:            { fontSize: 13, color: '#9A9895', padding: '12px 0' },
};
