export const CATEGORY_LABELS = {
  1: 'Up to Lt Col',
  2: 'Colonel',
  3: 'Colonel & above',
};

export const RANKS_BY_CATEGORY = {
  1: ['2Lt', 'Lt', 'Capt', 'Major', 'Lt Col'],
  2: ['Colonel'],
  3: ['Brigadier', 'Maj Gen', 'Lt Gen', 'General'],
};

export const ALL_RANKS = [
  { label: '2Lt / Lt / Capt / Major', value: '1' },
  { label: 'Lt Col',                  value: '1' },
  { label: 'Colonel',                 value: '2' },
  { label: 'Brigadier',               value: '3' },
  { label: 'Maj Gen / Lt Gen / General', value: '3' },
];

export const STATUS_STYLES = {
  pending:     'bg-amber-100 text-amber-800',
  approved:    'bg-green-100 text-green-800',
  checked_in:  'bg-blue-100 text-blue-800',
  checked_out: 'bg-gray-100 text-gray-700',
  cancelled:   'bg-red-100 text-red-700',
  rejected:    'bg-red-100 text-red-700',
};

export const STATUS_LABELS = {
  pending:     'Pending',
  approved:    'Approved',
  checked_in:  'Checked In',
  checked_out: 'Checked Out',
  cancelled:   'Cancelled',
  rejected:    'Rejected',
};

export const ROOM_STATUS_STYLES = {
  available: 'border-l-4 border-l-green-500',
  pending:   'border-l-4 border-l-amber-500',
  occupied:  'border-l-4 border-l-red-500',
};
