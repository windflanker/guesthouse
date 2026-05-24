import { STATUS_STYLES } from '../utils/helpers';

export default function StatusBadge({ status }) {
  return (
    <span className={`badge ${STATUS_STYLES[status] || 'bg-gray-100 text-gray-700'}`}>
      {status}
    </span>
  );
}
