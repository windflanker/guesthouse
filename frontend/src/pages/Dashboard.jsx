import { useEffect, useState } from 'react';
import api from '../utils/api';
import StatusBadge from '../components/StatusBadge';
import { formatDate, CAT_LABELS } from '../utils/helpers';

const CAT_COLORS = { 1: 'bg-blue-500', 2: 'bg-amber-500', 3: 'bg-green-500' };

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard').then(r => setData(r.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-sm text-gray-400">Loading…</div>;

  const { rooms, bookings, recentBookings, categoryOccupancy } = data;

  const metrics = [
    { label: 'Total rooms',      value: rooms.total,      color: 'text-army' },
    { label: 'Available',        value: rooms.available,  color: 'text-green-700' },
    { label: 'Occupied',         value: rooms.occupied,   color: 'text-red-700' },
    { label: 'Pending approval', value: bookings.pending, color: 'text-amber-700' },
    { label: 'Checked out',      value: bookings.checkedOut, color: 'text-gray-600' },
  ];

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-0.5">Live overview of occupancy and booking activity</p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-5 gap-4 mb-6">
        {metrics.map(m => (
          <div key={m.label} className="bg-gray-50 rounded-xl p-4">
            <p className="text-xs text-gray-500 mb-1">{m.label}</p>
            <p className={`text-2xl font-semibold ${m.color}`}>{m.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-5">
        {/* Recent activity */}
        <div className="card p-5">
          <h2 className="text-sm font-medium text-gray-800 mb-4">Recent activity</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-400 border-b border-gray-100">
                <th className="text-left pb-2 font-medium">Officer</th>
                <th className="text-left pb-2 font-medium">Rank</th>
                <th className="text-left pb-2 font-medium">Date</th>
                <th className="text-left pb-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {recentBookings.map(b => (
                <tr key={b.ref} className="border-b border-gray-50 last:border-0">
                  <td className="py-2.5 font-medium text-gray-800">{b.officer_name}</td>
                  <td className="py-2.5 text-gray-500 text-xs">{b.rank}</td>
                  <td className="py-2.5 text-gray-400 text-xs">{formatDate(b.created_at)}</td>
                  <td className="py-2.5"><StatusBadge status={b.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Category occupancy */}
        <div className="card p-5">
          <h2 className="text-sm font-medium text-gray-800 mb-4">Category occupancy</h2>
          <div className="space-y-5">
            {categoryOccupancy.map(c => {
              const pct = Math.round((c.occupied / c.total) * 100);
              return (
                <div key={c.category}>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-gray-500">{CAT_LABELS[c.category]}</span>
                    <span className="font-medium text-gray-800">{c.occupied}/{c.total}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${CAT_COLORS[c.category]}`}
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
