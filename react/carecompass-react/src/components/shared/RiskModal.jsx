import { useApp } from '../../hooks/useApp';
export default function RiskModal() {
  const { closeModal, toast } = useApp();
  return (
    <div className="modal-box">
      <div className="mhd"><div className="mhd-ico">⚠️</div><div><div className="mhd-name">High No-Show Risk — Patricia Reyes</div><div className="mhd-sub">CareCompass AI risk flag</div></div><button className="mclose" onClick={closeModal}>✕</button></div>
      <div className="mbody">
        <div style={{ background:'var(--rbg)', border:'1px solid rgba(239,68,68,.18)', borderRadius:9, padding:'.9rem', marginBottom:'.9rem', fontSize:'.75rem', lineHeight:1.9, color:'rgba(255,255,255,.62)' }}>
          🔴 <b>Risk factors:</b> 2 prior no-shows · Forms incomplete · No reminder acknowledged<br/>
          🌐 <b>Language:</b> Tagalog — preferred language reminder not yet sent<br/>
          📍 <b>Travel:</b> 18km · No transit confirmed
        </div>
        <div style={{ display:'flex', gap:'.65rem' }}>
          <button className="mcta" onClick={() => { closeModal(); toast('Tagalog reminder sent!','SMS dispatched to Patricia Reyes','📱'); }}>Send Tagalog Reminder</button>
          <button className="btn btn-g" style={{ flexShrink:0 }} onClick={() => { closeModal(); toast('Backup activated','Smart recovery for 11 AM slot','⚡'); }}>Prepare Backup</button>
        </div>
      </div>
    </div>
  );
}
