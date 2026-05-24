import { useEffect, useState } from 'react';
import api from '../utils/api';
import { CAT_LABELS, formatDate } from '../utils/helpers';

const STATUS_STYLES = {
  available: 'border-l-green-500 bg-white',
  pending:   'border-l-amber-400 bg-amber-50/30',
  occupied:  'border-l-red-400 bg-red-50/20',
};
const STATUS_BADGE = {
  available: 'bg-green-100 text-green-800',
  pending:   'bg-amber-100 text-amber-800',
  occupied:  'bg-red-100 text-red-800',
};

export default function Rooms() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/rooms').then(r => setRooms(r.data.rooms)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-sm text-gray-400">Loading…</div>;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-5">
        <h1 className="text-xl font-semibold text-gray-900">Room status</h1>
        <p className="text-sm text-gray-500 mt-0.5">All 12 rooms across 3 officer categories</p>
      </div>

      {/* Legend */}
      <div className="flex gap-5 mb-6 text-xs text-gray-500">
        {[['bg-green-500','Available'],['bg-amber-400','Pending check-in'],['bg-red-400','Occupied']].map(([c,l]) => (
          <div key={l} className="flex items-center gap-1.5">
            <div className={`w-2.5 h-2.5 rounded-full ${c}`} />
            {l}
          </div>
        ))}
      </div>

      {[1, 2, 3].map(cat => {
        const catRooms = rooms.filter(r => r.category === cat);
        return (
          <div key={cat} className="mb-7">
            <h2 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">
              {CAT_LABELS[cat]} <span className="ml-1 text-gray-300">({catRooms.length} rooms)</span>
            </h2>
            <div className="grid grid-cols-4 gap-3">
              {catRooms.map(r => (
                <div
                  key={r.id}
                  className={`rounded-xl border border-gray-100 border-l-4 p-4 ${STATUS_STYLES[r.status]}`}
                >
                  <div className="font-semibold text-gray-800 text-sm mb-0.5">{r.room_no}</div>
                  <div className="text-xs text-gray-400 mb-3">Cat {r.category}</div>
                  {r.officer_name && (
                    <div className="text-xs text-gray-600 mb-1 truncate">{r.officer_name}</div>
                  )}
                  {r.checkin_date && (
                    <div className="text-xs text-gray-400">
                      {formatDate(r.checkin_date)} → {formatDate(r.checkout_date)}
                    </div>
                  )}
                  <span className={`badge mt-2 ${STATUS_BADGE[r.status]}`}>
                    {r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
