export default function Modal({ title, children, onClose }) {
  return (
    <div style={styles.backdrop} onClick={onClose}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        <div style={styles.header}>
          <h3 style={styles.title}>{title}</h3>
          <button onClick={onClose} style={styles.closeBtn}>x</button>
        </div>
        <div style={styles.body}>{children}</div>
      </div>
    </div>
  );
}

const styles = {
  backdrop: {
    position: 'fixed', inset: 0,
    background: 'rgba(0,0,0,0.30)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 1000,
  },
  modal: {
    background: 'var(--surface)',
    borderRadius: 'var(--radius-lg)',
    border: '0.5px solid var(--border)',
    width: 500,
    maxWidth: '95vw',
    maxHeight: '90vh',
    overflow: 'auto',
    boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
  },
  header: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '18px 24px 14px',
    borderBottom: '0.5px solid var(--border)',
  },
  title: { fontSize: 15, fontWeight: 500, color: 'var(--text-1)' },
  closeBtn: {
    background: 'none', border: 'none', fontSize: 16,
    color: 'var(--text-3)', padding: '2px 6px', borderRadius: 4,
  },
  body: { padding: '20px 24px 24px' },
};
