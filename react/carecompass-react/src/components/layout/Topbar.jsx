// src/components/layout/Topbar.jsx
import { useApp } from '../../hooks/useApp';

export default function Topbar() {
  const { view, go, toast, openModal, badgeCounts } = useApp();

  const today = new Date().toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' });

  const TOPBAR = {
    'home':          { t:'Welcome to CareCompass',         s:'GTA Healthcare Navigation Platform' },
    'p-overview':    { t:'Patient Dashboard',              s: today },
    'p-journey':     { t:'My Care Journey',                s:'Cardiology referral pathway · 75% complete' },
    'find-care':     { t:'Find Care Near You 🗺️',          s:'12 clinics across the GTA · click pins or search' },
    'p-appointments':{ t:'My Appointments',               s:`${badgeCounts.appointments || 0} upcoming` },
    'p-referrals':   { t:'Referral Tracker',               s:`${badgeCounts.referrals || 0} active referrals` },
    'p-navigator':   { t:'My Navigator — Fatima',          s:'Online · Igbo · English · Yoruba' },
    'p-records':     { t:'Health Records',                 s:'PHIPA-compliant · Encrypted · Read-only' },
    'prov-appointments': { t:'Appointments',    s: `${badgeCounts.providerPending || 0} pending review` },
    'prov-schedule':     { t:'Schedule Builder', s: 'Set your weekly availability' },
    'prov-patients':     { t:'My Patients',      s: 'Patients who booked with you' },
    'prov-analytics':    { t:'Analytics',        s: 'Performance metrics and insights' },
    'settings':      { t:'Settings',                       s:'Preferences and account management' },
    'ai-translation':{ t:'🌐 Real-Time AI Translation',   s:'Cohere command-a-translate-08-2025 · 23 languages' },
    'ai-recorder':   { t:'🎙 Voice Recorder',              s:'Real-time transcription · Speaker diarization · AI insights' },
    'ai-cdisc':      { t:'🧬 CDISC / SDTM Mapping',       s:'Multi-modal AI extraction → CDISC standards → CSV export' },
  };

  const td = TOPBAR[view] || { t: view, s: '' };

  const renderButtons = () => {
    switch(view) {
      case 'p-overview':
        return <>
          <button className="btn btn-p" onClick={() => openModal('bookAppt')}>+ Book Appointment</button>
          <div onClick={() => toast('No new notifications','All caught up!','🔔')} style={{ width:30, height:30, borderRadius:7, background:'rgba(255,255,255,.04)', border:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', position:'relative', fontSize:'.8rem' }}>
            🔔<span style={{ position:'absolute', top:4, right:4, width:6, height:6, borderRadius:'50%', background:'var(--amethyst)', border:'1.5px solid var(--surface)' }}/>
          </div>
        </>;
      case 'p-appointments':
        return <button className="btn btn-p" onClick={() => openModal('bookAppt')}>+ New Booking</button>;
      case 'p-navigator':
        return <button className="btn btn-g">🗑️ Clear Chat</button>;
      case 'prov-appointments':
        return <>
          <button className="btn btn-p" onClick={() => openModal('bookAppt')}>+ New Appointment</button>
          <div onClick={() => toast('No new notifications','All caught up!','🔔')} style={{ width:30, height:30, borderRadius:7, background:'rgba(255,255,255,.04)', border:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', position:'relative', fontSize:'.8rem' }}>
            🔔<span style={{ position:'absolute', top:4, right:4, width:6, height:6, borderRadius:'50%', background:'var(--amethyst)', border:'1.5px solid var(--surface)' }}/>
          </div>
        </>;
      case 'prov-schedule':
      case 'prov-patients':
      case 'prov-analytics':
        return null;
      case 'find-care':
        return <button className="btn btn-g" onClick={() => openModal('bookAppt')}>📅 Book Appointment</button>;
      case 'ai-translation':
        return <span style={{ fontSize:'.63rem', color:'var(--green)' }}>Server-side AI</span>;
      case 'ai-recorder':
        return <button className="btn btn-teal" style={{ fontSize:'.7rem' }} onClick={() => toast('AI Insights','Click AI Insights button in the recorder panel','🤖')}>🤖 AI Insights</button>;
      case 'ai-cdisc':
        return <button className="btn btn-p" style={{ fontSize:'.7rem' }} onClick={() => toast('Pipeline','Click Run Pipeline inside the CDISC panel','🚀')}>🚀 Run Pipeline</button>;
      default: return null;
    }
  };

  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'.9rem 1.5rem', borderBottom:'1px solid var(--border)', background:'rgba(19,10,37,.95)', backdropFilter:'blur(18px)', flexShrink:0, zIndex:10, minHeight:'var(--topbar-h)', gap:'1rem' }}>
      <div style={{ minWidth:0 }}>
        <div style={{ fontFamily:"'Playfair Display',serif", fontSize:'1.1rem', fontWeight:700, letterSpacing:'-.01em', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{td.t}</div>
        <div style={{ fontSize:'.67rem', color:'var(--muted)', marginTop:'.08rem', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{td.s}</div>
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:'.48rem', flexShrink:0 }}>{renderButtons()}</div>
    </div>
  );
}
