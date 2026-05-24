import { STATUS_STYLES, STATUS_LABELS } from '../../utils/constants';

// ── Status Badge ─────────────────────────────────────────────
export function StatusBadge({ status }) {
  return (
    <span className={`badge ${STATUS_STYLES[status] || 'bg-gray-100 text-gray-600'}`}>
      {STATUS_LABELS[status] || status}
    </span>
  );
}

// ── Category Tag ──────────────────────────────────────────────
const CAT_STYLES = {
  1: 'bg-blue-50 text-blue-700',
  2: 'bg-amber-50 text-amber-700',
  3: 'bg-green-50 text-green-700',
};
const CAT_LABELS = { 1: 'Cat 1', 2: 'Cat 2', 3: 'Cat 3' };

export function CatTag({ category }) {
  return (
    <span className={`badge ${CAT_STYLES[category]}`}>
      {CAT_LABELS[category]}
    </span>
  );
}

// ── Spinner ───────────────────────────────────────────────────
export function Spinner({ size = 'md' }) {
  const sz = size === 'sm' ? 'h-4 w-4' : 'h-8 w-8';
  return (
    <div className={`animate-spin rounded-full border-2 border-gray-200 border-t-army-500 ${sz}`} />
  );
}

// ── Modal ─────────────────────────────────────────────────────
export function Modal({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
         onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 overflow-hidden"
           onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="font-medium text-gray-900">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
        </div>
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────
export function Empty({ message = 'No records found' }) {
  return (
    <div className="py-16 text-center text-gray-400 text-sm">{message}</div>
  );
}

// ── Info row (label + value) ──────────────────────────────────
export function InfoRow({ label, value }) {
  return (
    <div className="flex justify-between py-2 border-b border-gray-50 text-sm last:border-0">
      <span className="text-gray-500">{label}</span>
      <span className="text-gray-900 font-medium">{value || '—'}</span>
    </div>
  );
}
