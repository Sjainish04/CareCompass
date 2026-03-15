// src/components/shared/Toast.jsx
import { useApp } from '../../hooks/useApp';
import BookApptModal   from './BookApptModal';
import FillSlotModal   from './FillSlotModal';
import RiskModal       from './RiskModal';
import ClinicBookModal from './ClinicBookModal';

export function ToastContainer() {
  const { toasts } = useApp();
  return (
    <div className="toast-wrap">
      {toasts.map(t => (
        <div key={t.id} className="toast">
          <span style={{ fontSize:'1.05rem' }}>{t.icon}</span>
          <div>
            <b style={{ display:'block', marginBottom:'.06rem', fontSize:'.8rem' }}>{t.title}</b>
            {t.sub && <span style={{ fontSize:'.65rem', color:'var(--muted)' }}>{t.sub}</span>}
          </div>
        </div>
      ))}
    </div>
  );
}

const MODALS = {
  bookAppt:   BookApptModal,
  fillSlot:   FillSlotModal,
  riskAlert:  RiskModal,
  clinicBook: ClinicBookModal,
};

export function ModalHost() {
  const { modal, closeModal } = useApp();
  if (!modal) return null;
  const Comp = MODALS[modal.id];
  if (!Comp) return null;
  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) closeModal(); }}>
      <Comp {...modal.props} />
    </div>
  );
}
