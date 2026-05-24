export const RANKS = [
  { value: '2Lt',      label: '2Lt (Second Lieutenant)',    category: 1 },
  { value: 'Lt',       label: 'Lt (Lieutenant)',             category: 1 },
  { value: 'Capt',     label: 'Capt (Captain)',              category: 1 },
  { value: 'Major',    label: 'Major',                       category: 1 },
  { value: 'Lt Col',   label: 'Lt Col (Lieutenant Colonel)', category: 1 },
  { value: 'Colonel',  label: 'Colonel',                     category: 2 },
  { value: 'Brigadier',label: 'Brigadier',                   category: 3 },
  { value: 'Maj Gen',  label: 'Maj Gen (Major General)',     category: 3 },
  { value: 'Lt Gen',   label: 'Lt Gen (Lieutenant General)', category: 3 },
  { value: 'General',  label: 'General',                     category: 3 },
];

export const CAT_LABELS = {
  1: 'Category 1 — Up to Lt Col',
  2: 'Category 2 — Colonel',
  3: 'Category 3 — Colonel & above',
};

export const STATUS_STYLES = {
  'Pending':    'bg-amber-100 text-amber-800',
  'Approved':   'bg-green-100 text-green-800',
  'Rejected':   'bg-red-100 text-red-800',
  'Checked In': 'bg-blue-100 text-blue-800',
  'Checked Out':'bg-gray-100 text-gray-700',
  'Cancelled':  'bg-red-100 text-red-700',
};

export function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function rankToCategory(rank) {
  return RANKS.find(r => r.value === rank)?.category || null;
}
