import { useApp } from '../../hooks/useApp';
export default function FillSlotModal() {
  const { closeModal, toast } = useApp();
  return (
    <div className="modal-box">
      <div className="mhd"><div className="mhd-ico">⚡</div><div><div className="mhd-name">Smart Cancellation Recovery</div><div className="mhd-sub">Auto-notify waitlisted patients in their language</div></div><button className="mclose" onClick={closeModal}>✕</button></div>
      <div className="mbody">
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'.65rem' }}>
          <div className="mfield"><label className="mlbl">Date</label><input className="minput" type="date"/></div>
          <div className="mfield"><label className="mlbl">Time</label><input className="minput" type="time"/></div>
        </div>
        <div className="mfield"><label className="mlbl">Type</label><select className="minput"><option>Follow-up</option><option>Initial Consult</option><option>Virtual</option></select></div>
        <div style={{ background:'rgba(99,102,241,.1)', border:'1px solid rgba(99,102,241,.18)', borderRadius:9, padding:'.75rem .9rem', fontSize:'.75rem', color:'#c7d2fe', marginBottom:'.82rem', lineHeight:1.7 }}>
          🤖 CareCompass will notify the top 3 waitlisted patients and confirm the first acceptance automatically.
        </div>
        <button className="mcta" onClick={() => { closeModal(); toast('Smart recovery activated!','3 patients notified · awaiting confirmation','⚡'); }}>Activate Smart Recovery</button>
      </div>
    </div>
  );
}
