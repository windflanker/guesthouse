const MAP = {
  'Pending':     { bg: 'var(--amber-bg)',  color: 'var(--amber-text)' },
  'Approved':    { bg: 'var(--green-bg)',  color: 'var(--green-text)' },
  'Rejected':    { bg: 'var(--red-bg)',    color: 'var(--red-text)'   },
  'Checked In':  { bg: 'var(--blue-bg)',   color: 'var(--blue-text)'  },
  'Checked Out': { bg: 'var(--gray-bg)',   color: 'var(--gray-text)'  },
  'Cancelled':   { bg: 'var(--red-bg)',    color: 'var(--red-text)'   },
  'available':   { bg: 'var(--green-bg)',  color: 'var(--green-text)' },
  'pending':     { bg: 'var(--amber-bg)',  color: 'var(--amber-text)' },
  'occupied':    { bg: 'var(--red-bg)',    color: 'var(--red-text)'   },
};

export default function Badge({ status }) {
  const s = MAP[status] || { bg: 'var(--gray-bg)', color: 'var(--gray-text)' };
  return (
    <span style={{
      display: 'inline-block',
      fontSize: 11,
      padding: '2px 9px',
      borderRadius: 99,
      background: s.bg,
      color: s.color,
      whiteSpace: 'nowrap',
      fontWeight: 500,
    }}>
      {status}
    </span>
  );
}
