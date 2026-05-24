import { useEffect, useState } from 'react';
import api from '../../utils/api';
import { StatusBadge, Spinner } from '../common';
import { CATEGORY_LABELS } from '../../utils/constants';

const CAT_COLORS = { 1: 'bg-blue-500', 2: 'bg-amber-500', 3: 'bg-green-500' };

export default function Dashboard() {
  const [stats, setStats]       = useState(null);
  const [recent, setRecent]     = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/bookings/stats/summary'),
      api.get('/bookings?limit=6'),
    ]).then(([s, b]) => {
      setStats(s.data);
      setRecent(b.data.bookings);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64"><Spinner /></div>
  );

  const roomMap   = Object.fromEntries((stats?.roomStats   || []).map(r => [r.status, parseInt(r.count)]));
  const statusMap = Object.fromEntries((stats?.bookingStats || []).map(b => [b.status, parseInt(b.count)]));

  const metrics = [
    { label: 'Total rooms',      value: 12,                          color: 'text-army-500' },
    { label: 'Available',        value: roomMap.available || 0,      color: 'text-green-600' },
    { label: 'Occupied',         value: roomMap.occupied  || 0,      color: 'text-red-600' },
    { label: 'Pending approval', value: statusMap.pending || 0,      color: 'text-amber-600' },
    { label: 'Checked out',      value: statusMap.checked_out || 0,  color: 'text-gray-500' },
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-0.5">Live overview of occupancy and requests</p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-5 gap-4 mb-6">
        {metrics.map(m => (
          <div key={m.label} className="card p-4">
            <div className="text-xs text-gray-500 mb-1">{m.label}</div>
            <div className={`text-2xl font-semibold ${m.color}`}>{m.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Recent bookings */}
        <div className="card p-5">
          <h2 className="text-sm font-medium text-gray-900 mb-4">Recent activity</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-400 border-b border-gray-100">
                <th className="text-left pb-2 font-medium">Officer</th>
                <th className="text-left pb-2 font-medium">Rank</th>
                <th className="text-left pb-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {recent.map(b => (
                <tr key={b.id} className="border-b border-gray-50 last:border-0">
                  <td className="py-2.5 font-medium text-gray-800">{b.officer_name}</td>
                  <td className="py-2.5 text-gray-500">{b.rank}</td>
                  <td className="py-2.5"><StatusBadge status={b.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Category occupancy */}
        <div className="card p-5">
          <h2 className="text-sm font-medium text-gray-900 mb-4">Category occupancy</h2>
          <div className="space-y-4">
            {(stats?.catStats || []).map(c => {
              const pct = Math.round((parseInt(c.occupied) / parseInt(c.total)) * 100);
              return (
                <div key={c.category}>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-gray-500">Cat {c.category} — {CATEGORY_LABELS[c.category]}</span>
                    <span className="font-medium text-gray-700">{c.occupied}/{c.total}</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${CAT_COLORS[c.category]} transition-all`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
