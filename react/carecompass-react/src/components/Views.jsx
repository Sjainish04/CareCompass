// src/components/Views.jsx  — all remaining views in one file
import { useState, useEffect } from 'react';
import { useApp } from '../hooks/useApp';
import { apiGet, apiPost, apiPatch, apiDelete } from '../lib/api';

/* ═══════════════════════════════════════════════
   HOME
═══════════════════════════════════════════════ */
export function HomeView() {
  const { go } = useApp();
  const [counts, setCounts] = useState([0, 0, 0, 0]);

  useEffect(() => {
    const targets = [10, 94, 12, 88];
    const dur     = [1200, 1400, 1000, 1500];
    targets.forEach((to, i) => {
      let start = null;
      const step = (ts) => {
        if (!start) start = ts;
        const p = Math.min((ts - start) / dur[i], 1);
        const ease = 1 - Math.pow(1 - p, 3);
        setCounts(c => { const n=[...c]; n[i]=Math.round(ease*to); return n; });
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  }, []);

  const features = [
    ['📊','Patient Overview','Stats, upcoming appointments, care journey, and quick actions in one view.','p-overview'],
    ['🧭','Care Journey','5-step visual pathway tracking every milestone from intake to treatment.','p-journey'],
    ['🗺️','Clinic Finder + Map','Interactive GTA map with 12 clinics, language filters, and same-day booking.','find-care'],
    ['🔁','Referral Tracker','Real-time progress bars on every specialist referral, with language reminders.','p-referrals'],
    ['💬','Personal Navigator','Fatima speaks your language and coordinates every booking and reminder.','p-navigator'],
    ['🏥','Provider Dashboard','Smart scheduling, risk scoring, cancellation recovery, multilingual reminders.','prov-overview'],
    ['🌐','AI Translation','Real-time medical translation across 23 languages using clinical-grade AI.','ai-translation'],
    ['🎙','Voice Recorder','Doctor–patient transcription with speaker diarization and AI clinical insights.','ai-recorder'],
    ['🧬','CDISC Mapping','AI-powered EHR extraction to CDISC SDTM standards with Claude compliance review.','ai-cdisc'],
  ];

  const heroStats = [
    [counts[0]+'+','Languages Supported'],
    [counts[1]+'%','Attendance Rate'],
    [counts[2],'GTA Clinics'],
    [counts[3]+'%','Referral Completion'],
  ];

  return (
    <div className="content fade-up">
      {/* Hero */}
      <div style={{ background:'linear-gradient(135deg,rgba(109,40,217,.12),rgba(139,92,246,.05))', border:'1px solid var(--border)', borderRadius:16, padding:'2rem', marginBottom:'1.2rem', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:-60, right:-60, width:200, height:200, background:'radial-gradient(circle,rgba(139,92,246,.15),transparent 70%)', pointerEvents:'none' }}/>
        <div style={{ fontSize:'.62rem', fontWeight:600, letterSpacing:'.14em', textTransform:'uppercase', color:'var(--amethyst)', marginBottom:'.75rem' }}>CareCompass · GTA Healthcare Platform</div>
        <div style={{ fontFamily:"'Playfair Display',serif", fontSize:'2rem', fontWeight:700, lineHeight:1.22, letterSpacing:'-.02em', marginBottom:'.75rem' }}>
          Your health journey,<br/><em style={{ fontStyle:'italic', background:'linear-gradient(135deg,var(--lavender),var(--amethyst))', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>guided in your language.</em>
        </div>
        <div style={{ fontSize:'.82rem', color:'var(--dim)', lineHeight:1.7, maxWidth:560, marginBottom:'1.25rem' }}>
          Multilingual intake, smart matching, and end-to-end referral tracking for newcomers, seniors, and multicultural families across the Greater Toronto Area.
        </div>
        <div style={{ display:'flex', gap:'.65rem', flexWrap:'wrap', marginBottom:'1.5rem' }}>
          <button className="btn btn-p" onClick={()=>go('p-overview')}>🧭 Patient Dashboard</button>
          <button className="btn btn-g" onClick={()=>go('find-care')}>🗺️ Find Care Near Me</button>
          <button className="btn btn-g" onClick={()=>go('prov-overview')}>🏥 Provider Portal</button>
        </div>
        <div style={{ display:'flex', gap:'2.5rem', flexWrap:'wrap' }}>
          {heroStats.map(([n,l])=>(
            <div key={l}><div style={{ fontFamily:"'Playfair Display',serif", fontSize:'1.5rem', fontWeight:700 }}>{n}</div><div style={{ fontSize:'.62rem', color:'var(--muted)', marginTop:'.1rem' }}>{l}</div></div>
          ))}
        </div>
      </div>

      {/* Feature grid */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'.85rem' }}>
        {features.map(([ico,title,desc,id])=>(
          <div key={id} onClick={()=>go(id)} style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:13, padding:'1.1rem', cursor:'pointer', transition:'all .22s', position:'relative', overflow:'hidden' }}
            onMouseEnter={e=>{ e.currentTarget.style.borderColor='var(--bh)'; e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 8px 24px rgba(0,0,0,.25)'; }}
            onMouseLeave={e=>{ e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow=''; }}>
            <div style={{ fontSize:'1.4rem', marginBottom:'.65rem' }}>{ico}</div>
            <div style={{ fontSize:'.83rem', fontWeight:600, marginBottom:'.3rem' }}>{title}</div>
            <div style={{ fontSize:'.7rem', color:'var(--muted)', lineHeight:1.6 }}>{desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   PATIENT JOURNEY
═══════════════════════════════════════════════ */
export function PatientJourney() {
  const { go, openModal } = useApp();
  const [expanded, setExpanded] = useState({});

  const steps = [
    { dot:'done', title:'Initial Intake Complete',   detail:'Multilingual intake form submitted in Igbo + English. All health information securely stored.', chip:'cg', chipLabel:'Completed', date:'Nov 28' },
    { dot:'done', title:'Family Doctor Matched',     detail:'Matched with Dr. Adeyemi at Scarborough Health Network — Igbo-speaking, 1.2km away.', chip:'cg', chipLabel:'Completed', date:'Dec 1' },
    { dot:'done', title:'Blood Work Ordered',        detail:'LifeLabs Scarborough. CBC, lipid panel, HbA1c. Results received Dec 10 and shared with Dr. Adeyemi.', chip:'cg', chipLabel:'Completed', date:'Dec 5' },
    { dot:'now',  title:'Cardiology Consultation',  detail:'Dr. Patel at Mount Sinai confirmed Dec 18 at 10:30 AM. Igbo reminder will be sent Dec 17 at 8 AM.', chip:'cv', chipLabel:'Upcoming · Dec 18, 10:30 AM', date:'', extra:true },
    { dot:'pend', title:'Treatment Plan Review',    detail:'Navigator Fatima will follow up after specialist visit to confirm next steps.', chip:'cgr', chipLabel:'Pending', date:'' },
  ];

  return (
    <div className="content fade-up">
      <div className="g32">
        <div className="card">
          <div className="ch"><div><div className="ch-title">🧭 Cardiology Care Journey</div><div className="ch-sub">Full end-to-end pathway</div></div><span className="chip chip-g">75% complete</span></div>
          {steps.map((s, i) => (
            <div key={i} onClick={()=>setExpanded(e=>({...e,[i]:!e[i]}))} style={{ display:'flex', gap:'.8rem', padding:'.75rem 1.2rem', cursor:'pointer', transition:'background .2s' }}>
              <div style={{ display:'flex', flexDirection:'column', alignItems:'center', flexShrink:0 }}>
                <div style={{ width:26, height:26, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'.72rem', fontWeight:700, flexShrink:0, border:'2px solid',
                  background: s.dot==='done'?'rgba(16,185,129,.15)':s.dot==='now'?'rgba(109,40,217,.2)':'rgba(255,255,255,.04)',
                  borderColor: s.dot==='done'?'var(--green)':s.dot==='now'?'var(--amethyst)':'rgba(255,255,255,.12)',
                  color: s.dot==='done'?'var(--green)':s.dot==='now'?'var(--amethyst)':'var(--muted)',
                  animation: s.dot==='now'?'pulse-j 2s infinite':undefined,
                }}>{s.dot==='done'?'✓':s.dot==='now'?'▶':(i+1)}</div>
                {i<4&&<div style={{ width:2, flex:1, minHeight:20, background:'linear-gradient(var(--border),transparent)', margin:'.18rem 0' }}/>}
              </div>
              <div style={{ flex:1, paddingTop:'.22rem' }}>
                <div style={{ fontSize:'.82rem', fontWeight:600, marginBottom:'.2rem' }}>{s.title}</div>
                <div style={{ fontSize:'.72rem', color:'var(--dim)', lineHeight:1.6, marginBottom:'.4rem' }}>{s.detail}</div>
                <div style={{ display:'flex', alignItems:'center', gap:'.55rem' }}>
                  <span className={`chip chip-${s.chip.replace('c','')}`}>{s.chipLabel}</span>
                  {s.date&&<span style={{ fontSize:'.62rem', color:'var(--muted)' }}>{s.date}</span>}
                </div>
                {s.extra && expanded[i] && (
                  <div style={{ marginTop:'.7rem', padding:'.75rem', background:'rgba(109,40,217,.08)', borderRadius:9, border:'1px solid rgba(139,92,246,.15)', fontSize:'.74rem', color:'var(--dim)', lineHeight:1.7 }}>
                    📍 <b>Location:</b> 600 University Ave, Toronto<br/>
                    🌐 <b>Language:</b> Igbo interpreter confirmed<br/>
                    📄 <b>Documents required:</b> Blood work results (ready), OHIP card<br/>
                    <button className="btn btn-p" style={{ marginTop:'.6rem', fontSize:'.7rem' }} onClick={e=>{e.stopPropagation();openModal('bookAppt');}}>Reschedule if needed</button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        <div className="col">
          <div className="card"><div className="ch"><div className="ch-title">📊 Progress</div></div>
            <div className="cb">
              <div style={{ fontFamily:"'Playfair Display',serif", fontSize:'2.2rem', fontWeight:900 }}>75%</div>
              <div style={{ fontSize:'.7rem', color:'var(--muted)', marginBottom:'.85rem' }}>4 of 5 steps complete</div>
              <div className="pbar" style={{ height:5 }}><div className="pfill" style={{ width:'75%', height:5 }}/></div>
            </div>
          </div>
          <div className="card"><div className="ch"><div className="ch-title">📄 Documents</div></div>
            <div className="cb" style={{ display:'flex', flexDirection:'column', gap:'.4rem' }}>
              {[['📄 Intake Form (Igbo/En)','✓ Submitted'],['🩸 Blood Work Results','✓ Received'],['💌 Cardiology Referral Letter','✓ Sent']].map(([doc,st])=>(
                <div key={doc} style={{ display:'flex', alignItems:'center', gap:'.6rem', fontSize:'.76rem', padding:'.58rem', borderRadius:8, background:'rgba(255,255,255,.025)', border:'1px solid var(--border)' }}>
                  {doc}<span style={{ marginLeft:'auto', fontSize:'.58rem', color:'var(--green)' }}>{st}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="card"><div className="ch"><div className="ch-title">⚡ Actions</div></div>
            <div className="cb">
              <button className="qa" onClick={()=>openModal('bookAppt')}><span className="qa-ico">📅</span>Book next appointment<span className="qa-arr">›</span></button>
              <button className="qa" onClick={()=>go('p-navigator')}><span className="qa-ico">💬</span>Ask Fatima a question<span className="qa-arr">›</span></button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   PATIENT APPOINTMENTS
═══════════════════════════════════════════════ */

function formatDate(dateStr) {
  if (!dateStr) return { day: '—', mo: '', full: 'No date' };
  const parts = dateStr.split('-');
  const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
  return {
    day: d.getDate().toString(),
    mo: d.toLocaleString('en', { month: 'short' }),
    full: d.toLocaleDateString('en-CA', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }),
  };
}

function formatTime(timeStr) {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':');
  const hr = parseInt(h);
  return `${hr > 12 ? hr - 12 : hr || 12}:${m || '00'} ${hr >= 12 ? 'PM' : 'AM'}`;
}

export function PatientAppointments() {
  const { go, openModal, toast } = useApp();
  const [appointments, setAppointments] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [rescheduleId, setRescheduleId] = useState(null);
  const [rescheduleData, setRescheduleData] = useState({ date: '', time: '' });
  const [showReminderSettings, setShowReminderSettings] = useState(false);
  const [reminderPrefs, setReminderPrefs] = useState({ channel: 'Both', language: 'Igbo', timing: '1 day before' });

  useEffect(() => {
    apiGet('/appointments')
      .then(data => setAppointments(Array.isArray(data) ? data : []))
      .catch(() => setAppointments([]));
  }, [refreshKey]);

  useEffect(() => {
    const h = () => setRefreshKey(k => k + 1);
    window.addEventListener('appointments:refresh', h);
    return () => window.removeEventListener('appointments:refresh', h);
  }, []);

  async function cancelAppt(id) {
    try {
      await apiDelete(`/appointments/${id}`);
      toast('Cancelled', 'Appointment removed', '❌');
      setRefreshKey(k => k + 1);
    } catch { toast('Error', 'Could not cancel', '⚠️'); }
  }

  async function confirmReschedule() {
    if (!rescheduleData.date || !rescheduleData.time) { toast('Missing info', 'Pick date and time', '⚠️'); return; }
    try {
      await apiPatch(`/appointments/${rescheduleId}`, { date: rescheduleData.date, time: rescheduleData.time });
      toast('Rescheduled', 'Appointment updated', '📅');
      setRescheduleId(null);
      setRefreshKey(k => k + 1);
    } catch { toast('Error', 'Could not reschedule', '⚠️'); }
  }

  const upcoming = (appointments || []).filter(a => a.status !== 'completed');
  const past = (appointments || []).filter(a => a.status === 'completed');
  const loading = appointments === null;

  const darkInput = { background:'rgba(255,255,255,.06)', border:'1px solid var(--border)', borderRadius:7, padding:'.38rem .6rem', color:'var(--white)', colorScheme:'dark', fontFamily:"'DM Sans',sans-serif", fontSize:'.7rem' };

  return (
    <div className="content fade-up">
      <div className="g32">
        {/* Main appointments list */}
        <div className="card">
          <div className="ch">
            <div><div className="ch-title">📅 Upcoming Appointments</div><div className="ch-sub">{upcoming.length} upcoming</div></div>
            <button className="btn btn-p" style={{ fontSize:'.7rem' }} onClick={()=>openModal('bookAppt')}>+ Book New</button>
          </div>
          <div className="cb">
            {loading ? (
              <div style={{ padding:'1.5rem', textAlign:'center', color:'var(--muted)', fontSize:'.78rem' }}>Loading appointments...</div>
            ) : upcoming.length === 0 ? (
              <div style={{ padding:'2rem 1rem', textAlign:'center' }}>
                <div style={{ fontSize:'2rem', marginBottom:'.6rem' }}>📅</div>
                <div style={{ fontSize:'.82rem', fontWeight:500, marginBottom:'.3rem' }}>No upcoming appointments</div>
                <div style={{ fontSize:'.68rem', color:'var(--muted)', marginBottom:'.85rem' }}>Book your first appointment to get started</div>
                <button className="btn btn-p" style={{ fontSize:'.72rem' }} onClick={()=>openModal('bookAppt')}>+ Book Appointment</button>
              </div>
            ) : (
              upcoming.map((a, i) => {
                const dt = formatDate(a.date);
                const tm = formatTime(a.time);
                const isRescheduling = rescheduleId === a.id;
                return (
                  <div key={a.id} style={{ padding:'.95rem 0', borderBottom: i < upcoming.length - 1 ? '1px solid var(--border)' : 'none' }}>
                    <div style={{ display:'flex', gap:'.85rem', alignItems:'flex-start' }}>
                      {/* Date badge */}
                      <div style={{ width:46, textAlign:'center', flexShrink:0, background:'rgba(109,40,217,.1)', borderRadius:10, padding:'.5rem .2rem' }}>
                        <div style={{ fontFamily:"'Playfair Display',serif", fontSize:'1.35rem', fontWeight:700, lineHeight:1 }}>{dt.day}</div>
                        <div style={{ fontSize:'.58rem', color:'var(--amethyst)', textTransform:'uppercase', letterSpacing:'.06em', marginTop:'.12rem' }}>{dt.mo}</div>
                      </div>
                      {/* Info */}
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:'.5rem', marginBottom:'.25rem' }}>
                          <span style={{ fontSize:'.82rem', fontWeight:600 }}>{a.type || 'Appointment'}</span>
                          <span className={`chip chip-${a.status === 'confirmed' ? 'g' : a.status === 'cancelled' ? 'r' : 'v'}`} style={{ fontSize:'.52rem' }}>
                            {a.status === 'confirmed' ? '✓ Confirmed' : a.status === 'cancelled' ? 'Cancelled' : a.status}
                          </span>
                        </div>
                        {a.provider_name && <div style={{ fontSize:'.74rem', color:'var(--dim)', marginBottom:'.15rem' }}>🏥 {a.provider_name}</div>}
                        <div style={{ fontSize:'.72rem', color:'var(--muted)', display:'flex', flexWrap:'wrap', gap:'.6rem' }}>
                          <span>🕐 {tm || a.time || 'TBD'}</span>
                          <span>📆 {dt.full}</span>
                        </div>
                        {a.notes && <div style={{ fontSize:'.66rem', color:'var(--muted)', marginTop:'.25rem', fontStyle:'italic' }}>📝 {a.notes}</div>}
                      </div>
                      {/* Actions */}
                      <div style={{ display:'flex', flexDirection:'column', gap:'.3rem', flexShrink:0 }}>
                        <button className="btn btn-g" style={{ fontSize:'.65rem', padding:'.28rem .6rem' }} onClick={()=>{ setRescheduleId(isRescheduling ? null : a.id); setRescheduleData({ date: a.date || '', time: a.time || '' }); }}>
                          {isRescheduling ? '✕ Close' : '📅 Reschedule'}
                        </button>
                        <button className="btn btn-g" style={{ fontSize:'.65rem', padding:'.28rem .6rem' }} onClick={()=>toast('Reminder sent','SMS reminder scheduled','📱')}>📱 Remind</button>
                        <button onClick={()=>cancelAppt(a.id)} style={{ fontSize:'.65rem', padding:'.28rem .6rem', borderRadius:6, border:'1px solid rgba(239,68,68,.2)', background:'rgba(239,68,68,.08)', color:'var(--red)', cursor:'pointer', fontFamily:"'DM Sans',sans-serif", fontWeight:500 }}>🗑 Cancel</button>
                      </div>
                    </div>
                    {/* Reschedule form */}
                    {isRescheduling && (
                      <div style={{ marginTop:'.65rem', marginLeft:'3.8rem', padding:'.75rem', background:'rgba(109,40,217,.06)', border:'1px solid rgba(139,92,246,.15)', borderRadius:10 }}>
                        <div style={{ fontSize:'.68rem', fontWeight:600, color:'var(--lavender)', marginBottom:'.5rem' }}>Reschedule Appointment</div>
                        <div style={{ display:'flex', gap:'.5rem', alignItems:'flex-end', flexWrap:'wrap' }}>
                          <div>
                            <div style={{ fontSize:'.58rem', color:'var(--muted)', marginBottom:'.2rem' }}>New Date</div>
                            <input type="date" value={rescheduleData.date} onChange={e=>setRescheduleData(p=>({...p,date:e.target.value}))} style={darkInput} />
                          </div>
                          <div>
                            <div style={{ fontSize:'.58rem', color:'var(--muted)', marginBottom:'.2rem' }}>New Time</div>
                            <input type="time" value={rescheduleData.time} onChange={e=>setRescheduleData(p=>({...p,time:e.target.value}))} style={darkInput} />
                          </div>
                          <button className="btn btn-p" style={{ fontSize:'.68rem', padding:'.38rem .85rem' }} onClick={confirmReschedule}>Confirm</button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Past appointments */}
          {past.length > 0 && (<>
            <div className="ch" style={{ borderTop:'1px solid var(--border)' }}><div className="ch-title">📁 Past Appointments</div></div>
            <div className="cb">
              {past.map((a, i) => {
                const dt = formatDate(a.date);
                return (
                  <div key={a.id} style={{ display:'flex', alignItems:'center', gap:'.85rem', padding:'.7rem 0', borderBottom: i < past.length - 1 ? '1px solid var(--border)' : 'none', opacity: .7 }}>
                    <div style={{ width:38, textAlign:'center', flexShrink:0 }}>
                      <div style={{ fontFamily:"'Playfair Display',serif", fontSize:'1.1rem', fontWeight:700 }}>{dt.day}</div>
                      <div style={{ fontSize:'.55rem', color:'var(--muted)', textTransform:'uppercase' }}>{dt.mo}</div>
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:'.76rem', fontWeight:500 }}>{a.type}{a.provider_name ? ` · ${a.provider_name}` : ''}</div>
                      <div style={{ fontSize:'.64rem', color:'var(--muted)' }}>{formatTime(a.time)} · {dt.full}</div>
                    </div>
                    <span className="chip chip-gr">Completed</span>
                  </div>
                );
              })}
            </div>
          </>)}
        </div>

        {/* Sidebar */}
        <div className="col">
          <div className="card"><div className="ch"><div className="ch-title">⚡ Quick Book</div></div>
            <div className="cb">
              {[['🏥','Book appointment',()=>openModal('bookAppt')],['🗺️','Find a specialist',()=>go('find-care')],['💻','Virtual visit',()=>openModal('bookAppt')]].map(([ico,lbl,fn],i)=>(
                <button key={i} className="qa" onClick={fn}><span className="qa-ico">{ico}</span>{lbl}<span className="qa-arr">›</span></button>
              ))}
            </div>
          </div>
          <div className="card"><div className="ch"><div className="ch-title">🔔 Reminder Settings</div></div>
            <div className="cb" style={{ display:'flex', flexDirection:'column', gap:'.5rem' }}>
              {!showReminderSettings ? (
                <>
                  <div style={{ padding:'.6rem', borderRadius:8, background:'rgba(109,40,217,.08)', border:'1px solid rgba(139,92,246,.15)', fontSize:'.72rem', color:'var(--dim)' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'.2rem' }}><span style={{ color:'var(--muted)' }}>Channel</span><span>{reminderPrefs.channel}</span></div>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'.2rem' }}><span style={{ color:'var(--muted)' }}>Language</span><span>{reminderPrefs.language}</span></div>
                    <div style={{ display:'flex', justifyContent:'space-between' }}><span style={{ color:'var(--muted)' }}>Timing</span><span>{reminderPrefs.timing}</span></div>
                  </div>
                  <button className="qa" onClick={()=>setShowReminderSettings(true)}><span className="qa-ico">⚙️</span>Edit preferences<span className="qa-arr">›</span></button>
                </>
              ) : (
                <div style={{ padding:'.85rem', background:'rgba(109,40,217,.06)', border:'1px solid rgba(139,92,246,.12)', borderRadius:10 }}>
                  <div style={{ fontSize:'.7rem', fontWeight:600, marginBottom:'.6rem', color:'var(--lavender)' }}>Reminder Preferences</div>
                  {[['Channel', 'channel', ['SMS','Email','Both','None']], ['Language', 'language', ['Igbo','English','Urdu','Mandarin','Hindi']], ['Timing', 'timing', ['1 day before','2 hours before','1 hour before','30 min before']]].map(([label, key, opts]) => (
                    <div key={key} className="mfield" style={{ marginBottom:'.5rem' }}>
                      <label className="mlbl" style={{ fontSize:'.62rem' }}>{label}</label>
                      <select className="minput" style={{ fontSize:'.7rem', padding:'.4rem .6rem' }} value={reminderPrefs[key]} onChange={e=>setReminderPrefs(p=>({...p,[key]:e.target.value}))}>
                        {opts.map(o=><option key={o}>{o}</option>)}
                      </select>
                    </div>
                  ))}
                  <div style={{ display:'flex', gap:'.4rem' }}>
                    <button className="btn btn-p" style={{ fontSize:'.68rem', flex:1 }} onClick={()=>{toast('Saved',`${reminderPrefs.channel} · ${reminderPrefs.language} · ${reminderPrefs.timing}`,'🔔');setShowReminderSettings(false);}}>Save</button>
                    <button className="btn btn-g" style={{ fontSize:'.68rem' }} onClick={()=>setShowReminderSettings(false)}>Cancel</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   PATIENT REFERRALS
═══════════════════════════════════════════════ */
// Specialty keywords to match referrals against booked appointments
const REFERRAL_SPECIALTY_MAP = {
  'Cardiology': ['cardiology', 'heart', 'cardiac', 'mount sinai cardiology'],
  'Hematology': ['hematology', 'blood', 'lifelabs'],
  'Orthopaedics': ['orthopaedics', 'orthopedics', 'ortho', 'sunnybrook', 'bone'],
  'Mental Health': ['mental', 'psychiatry', 'psychology', 'camh', 'wellness'],
  'Family Medicine': ['family', 'general', 'gp'],
  'Internal Medicine': ['internal', 'medicine'],
  'Paediatrics': ['paediatrics', 'pediatrics', 'sickkids', 'children'],
};

function isReferralMatchedByAppt(referralTitle, appointments) {
  const titleLower = referralTitle.toLowerCase();
  for (const [spec, keywords] of Object.entries(REFERRAL_SPECIALTY_MAP)) {
    if (keywords.some(kw => titleLower.includes(kw))) {
      // Check if any booked appointment matches this specialty
      return appointments.some(a => {
        const provLower = (a.provider_name || '').toLowerCase();
        const typeLower = (a.type || '').toLowerCase();
        const notesLower = (a.notes || '').toLowerCase();
        const combined = provLower + ' ' + typeLower + ' ' + notesLower;
        return keywords.some(kw => combined.includes(kw)) ||
               combined.includes(spec.toLowerCase());
      });
    }
  }
  return false;
}

export function PatientReferrals() {
  const { go, toast } = useApp();
  const [referralsData, setReferralsData] = useState(null);
  const [appointments, setAppointments] = useState([]);

  function fetchData() {
    apiGet('/referrals').then(setReferralsData).catch(() => {});
    apiGet('/appointments')
      .then(data => { if (Array.isArray(data)) setAppointments(data.filter(a => a.status !== 'cancelled')); })
      .catch(() => {});
  }

  useEffect(() => { fetchData(); }, []);

  // Refresh when appointments change
  useEffect(() => {
    const h = () => fetchData();
    window.addEventListener('appointments:refresh', h);
    return () => window.removeEventListener('appointments:refresh', h);
  }, []);

  // Build referral display: cross-reference booked appointments
  const baseRefs = [
    {ico:'❤️',spec:'Cardiology',title:'Cardiology — Dr. Patel, Mount Sinai',detail:'Routine · Referred by Dr. Adeyemi · Dec 1',baseChip:'g',baseLabel:'Booked · Dec 18',baseSteps:'3/4',baseW:'75%',btnLabel:'Details',btnCls:'btn-g',btnFn:()=>toast('Referral details','Cardiology referral — Dr. Patel · Active','❤️')},
    {ico:'🩸',spec:'Hematology',title:'Hematology — LifeLabs Scarborough',detail:'Routine · Blood work complete · Results Dec 10',baseChip:'g',baseLabel:'Completed',baseSteps:'4/4',baseW:'100%',btnLabel:'Results',btnCls:'btn-g',btnFn:()=>toast('Results ready','Blood work results available · Dec 10','🩸')},
    {ico:'🦴',spec:'Orthopaedics',title:'Orthopaedics — Sunnybrook Health Sciences',detail:'Semi-urgent · Referred Dec 8 · Awaiting booking',baseChip:'y',baseLabel:'Pending',baseSteps:'1/4',baseW:'20%',barColor:'linear-gradient(90deg,#d97706,var(--yellow))',btnLabel:'Book Now →',btnCls:'btn-p',btnFn:()=>go('find-care')},
  ];

  // Augment with any new referrals from booked appointments that don't match existing
  const bookedSpecs = new Set();
  appointments.forEach(a => {
    const notes = (a.notes || '').toLowerCase();
    const provider = (a.provider_name || '').toLowerCase();
    for (const [spec, keywords] of Object.entries(REFERRAL_SPECIALTY_MAP)) {
      if (keywords.some(kw => notes.includes(kw) || provider.includes(kw))) {
        bookedSpecs.add(spec);
      }
    }
  });

  const refs = (referralsData?.referrals ?? baseRefs).map(r => {
    const matched = isReferralMatchedByAppt(r.title || r.specialty || '', appointments);
    if (matched && (r.baseChip === 'y' || r.chip === 'y' || r.baseLabel === 'Pending' || r.chipLabel === 'Pending')) {
      // This pending referral now has a matching appointment — mark as booked
      const matchingAppt = appointments.find(a => {
        const combined = ((a.provider_name || '') + ' ' + (a.notes || '') + ' ' + (a.type || '')).toLowerCase();
        const titleLower = (r.title || r.specialty || '').toLowerCase();
        for (const [, keywords] of Object.entries(REFERRAL_SPECIALTY_MAP)) {
          if (keywords.some(kw => titleLower.includes(kw)) && keywords.some(kw => combined.includes(kw))) return true;
        }
        return false;
      });
      const apptDate = matchingAppt?.date
        ? new Date(matchingAppt.date + 'T12:00:00').toLocaleDateString('en', { month:'short', day:'numeric' })
        : '';
      return {
        ...r,
        chip: r.baseChip ? undefined : r.chip,
        baseChip: 'g',
        baseLabel: `Booked${apptDate ? ' · ' + apptDate : ''}`,
        baseSteps: '3/4',
        baseW: '75%',
        barColor: undefined,
        btnLabel: 'Details',
        btnCls: 'btn-g',
        btnFn: () => toast('Appointment booked', `${matchingAppt?.provider_name || r.title} · ${apptDate}`, '✅'),
        detail: r.detail?.replace('Awaiting booking', `Booked${matchingAppt?.provider_name ? ' at ' + matchingAppt.provider_name : ''}`) || r.detail,
      };
    }
    return r;
  });

  const displayRefs = refs.map(r => ({
    ico: r.ico,
    title: r.title || r.specialty || '',
    detail: r.detail || r.notes || '',
    chip: r.baseChip || r.chip || 'gr',
    chipLabel: r.baseLabel || r.chipLabel || r.status || '',
    steps: r.baseSteps || r.steps || '0/4',
    w: r.baseW || r.w || '0%',
    barColor: r.barColor,
    btnLabel: r.btnLabel || 'View',
    btnCls: r.btnCls || 'btn-g',
    btnFn: r.btnFn || (() => {}),
  }));

  const pendingCount = displayRefs.filter(r => r.chip === 'y').length;
  const activeCount = displayRefs.length;

  return (
    <div className="content fade-up">
      <div className="card gap">
        <div className="ch"><div><div className="ch-title">🔁 All Referrals</div><div className="ch-sub">{activeCount} active · {pendingCount} pending booking</div></div></div>
        {displayRefs.map((r,i)=>(
          <div key={i} style={{ display:'flex', alignItems:'center', gap:'.7rem', padding:'.82rem 1.2rem', borderBottom: i<displayRefs.length-1?'1px solid var(--border)':'none' }}>
            <div style={{ fontSize:'1.1rem', flexShrink:0, width:28, textAlign:'center' }}>{r.ico}</div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:'.78rem', fontWeight:500 }}>{r.title}</div>
              <div style={{ fontSize:'.65rem', color:'var(--muted)', marginTop:'.1rem' }}>{r.detail}</div>
              <div style={{ display:'flex', alignItems:'center', gap:'.5rem', marginTop:'.32rem' }}>
                <span className={`chip chip-${r.chip}`}>{r.chipLabel}</span>
                <span style={{ fontSize:'.6rem', color:'var(--muted)' }}>{r.steps} steps</span>
              </div>
              <div className="pbar"><div className="pfill" style={{ width:r.w, background:r.barColor||undefined }}/></div>
            </div>
            <button className={`btn ${r.btnCls}`} style={{ marginLeft:'auto', flexShrink:0, fontSize:'.69rem' }} onClick={r.btnFn}>{r.btnLabel}</button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   PATIENT RECORDS
═══════════════════════════════════════════════ */
export function PatientRecords() {
  const { toast } = useApp();
  return (
    <div className="content fade-up">
      <div className="g2">
        <div className="card">
          <div className="ch"><div className="ch-title">📋 Health Profile</div><button className="btn btn-g" style={{ fontSize:'.69rem' }} onClick={()=>toast('Edit mode','Profile editing available in full product','📋')}>Edit</button></div>
          <div className="cb">
            {[['CONDITIONS',['Hypertension','Iron-deficiency Anaemia'],'hcond'],['MEDICATIONS',['Lisinopril 10mg','Iron supplements 65mg'],'hmed'],['ALLERGIES',['⚠ Penicillin','⚠ Sulfa drugs'],'hallergy']].map(([label,items,cls])=>(
              <div key={label}>
                <div style={{ fontSize:'.58rem', fontWeight:600, letterSpacing:'.1em', textTransform:'uppercase', color:'var(--muted)', marginBottom:'.42rem', marginTop: label!=='CONDITIONS'?'.85rem':0 }}>{label}</div>
                <div style={{ display:'flex', flexWrap:'wrap', marginBottom: label==='ALLERGIES'?0:'.4rem' }}>
                  {items.map(item=><span key={item} className={`htag ${cls}`}>{item}</span>)}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="col">
          <div className="card"><div className="ch"><div className="ch-title">🆔 OHIP</div></div>
            <div className="cb" style={{ display:'flex', flexDirection:'column', gap:'.45rem', fontSize:'.78rem' }}>
              {[['Card #','****-****-**42'],['Expiry','March 2026'],['Version','XP']].map(([l,v])=>(
                <div key={l} style={{ display:'flex', justifyContent:'space-between' }}><span style={{ color:'var(--muted)' }}>{l}</span><span style={{ fontFamily: l==='Card #'?"'DM Mono',monospace":'inherit' }}>{v}</span></div>
              ))}
            </div>
          </div>
          <div className="card"><div className="ch"><div className="ch-title">🆘 Emergency Contact</div></div>
            <div className="cb" style={{ fontSize:'.78rem', display:'flex', flexDirection:'column', gap:'.35rem' }}>
              {[['Name','Chukwuemeka Nwosu'],['Relation','Spouse'],['Phone','(416) 555-0187']].map(([l,v])=>(
                <div key={l}><span style={{ color:'var(--muted)' }}>{l}: </span>{v}</div>
              ))}
            </div>
          </div>
          <div className="card"><div className="ch"><div className="ch-title">📄 Documents</div></div>
            <div className="cb" style={{ display:'flex', flexDirection:'column', gap:'.38rem', fontSize:'.76rem' }}>
              {['📄 Intake Form (Igbo/En)','🩸 Blood Work Dec 10'].map(d=>(
                <div key={d} style={{ display:'flex', alignItems:'center', gap:'.58rem', padding:'.55rem', borderRadius:8, background:'rgba(255,255,255,.025)', border:'1px solid var(--border)' }}>
                  {d}<span style={{ marginLeft:'auto', fontSize:'.58rem', color:'var(--green)' }}>✓</span>
                </div>
              ))}
              <button className="qa" onClick={()=>toast('Download started','Downloading all records as PDF','📄')}><span className="qa-ico">⬇️</span>Download all records<span className="qa-arr">›</span></button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   PROVIDER OVERVIEW
═══════════════════════════════════════════════ */
export function ProviderOverview() {
  const { openModal, toast } = useApp();
  const [bars, setBars] = useState(false);
  const [appointments, setAppointments] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [analytics, setAnalytics] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [referrals, setReferrals] = useState([
    { id: 1, ico:'🏥', title:'Yemi Okafor → General Practice', detail:'Yoruba · St. Michael\'s · Chest pain workup', chip:'r', chipLabel:'Urgent' },
    { id: 2, ico:'💊', title:'Hiroshi Tanaka → Med Review', detail:'Japanese · Self-referral · Diabetes mgmt', chip:'y', chipLabel:'Semi' },
    { id: 3, ico:'👁️', title:'Maria Costa → Annual Check-up', detail:'Portuguese · Community referral · Routine', chip:'gr', chipLabel:'Routine' },
  ]);

  useEffect(() => {
    const t = setTimeout(() => setBars(true), 120);
    apiGet('/analytics/provider')
      .then(setAnalytics)
      .catch(() => {});
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    apiGet('/appointments/provider/mine')
      .then(data => {
        if (Array.isArray(data)) setAppointments(data);
      })
      .catch(() => setAppointments([]));
  }, [refreshKey]);

  async function updateStatus(apptId, status) {
    setActionLoading(apptId);
    try {
      await apiPatch(`/appointments/provider/${apptId}/status`, { status });
      toast(status === 'confirmed' ? 'Approved' : 'Rejected', `Appointment ${status}`, '');
      setRefreshKey(k => k + 1);
    } catch (err) {
      toast('Error', err.message || 'Failed to update', '');
    } finally {
      setActionLoading(null);
    }
  }

  function acceptReferral(id) {
    const ref = referrals.find(r => r.id === id);
    setReferrals(prev => prev.filter(r => r.id !== id));
    toast('Accepted', `${ref?.title || 'Referral'} intake sent`, '');
  }

  const mbarRows = analytics?.performanceMetrics ?? [['Attendance','fill-g','94%',94],['Referrals Done','fill-b','88%',88],['No-Show Rate','fill-r','6%',6],['Slot Recovery','fill-y','78%',78]];
  const langRows = analytics?.languageMix ?? [['Igbo',28],['Urdu',22],['Mandarin',18],['Tagalog',14],['Hindi',11]];

  const totalAppts = appointments.length;
  const confirmedAppts = appointments.filter(a => a.status === 'confirmed').length;
  const pendingAppts = appointments.filter(a => a.status !== 'confirmed' && a.status !== 'cancelled' && a.status !== 'completed').length;

  return (
    <div className="content fade-up">
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'.7rem', marginBottom:'.7rem' }}>
        {[['📅','ig',String(totalAppts),'Total Appointments'],['✅','it',String(confirmedAppts),'Confirmed'],['⏳','iy',String(pendingAppts),'Pending Review']].map(([ico,cls,num,lbl],i)=>(
          <div key={i} className="sc">
            <div className="sc-top"><div className={`sc-ico ${cls}`}>{ico}</div></div>
            <div className="sc-num">{num}</div><div className="sc-lbl">{lbl}</div>
          </div>
        ))}
      </div>

      <div className="card gap">
        <div className="ch"><div><div className="ch-title">📅 My Appointments</div><div className="ch-sub">{appointments.length} appointments booked with you</div></div>
          <div style={{ display:'flex', gap:'.38rem' }}>
            <button className="btn btn-g" style={{ fontSize:'.69rem' }} onClick={()=>toast('Export ready','Schedule PDF exported','')}>Export</button>
          </div>
        </div>
        <div style={{ overflowX:'auto' }}>
          <table className="sch-tbl">
            <thead><tr><th>Date</th><th>Time</th><th>Patient</th><th>Type</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {appointments.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign:'center', padding:'1.5rem', color:'var(--muted)', fontSize:'.78rem' }}>No appointments booked with you yet</td></tr>
              ) : appointments.map((a)=>{
                const initials = (a.patient_name || 'UK').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
                const statusChip = a.status === 'confirmed' ? 'g' : a.status === 'cancelled' ? 'r' : 'y';
                const statusLabel = a.status === 'confirmed' ? '✓ Confirmed' : a.status === 'cancelled' ? '✕ Cancelled' : a.status === 'completed' ? '✓ Completed' : a.status;
                return (
                  <tr key={a.id}>
                    <td style={{ fontFamily:"'DM Mono',monospace", fontSize:'.73rem', color:'var(--dim)', whiteSpace:'nowrap' }}>{a.date || '—'}</td>
                    <td style={{ fontFamily:"'DM Mono',monospace", fontSize:'.73rem', color:'var(--dim)', whiteSpace:'nowrap' }}>{a.time || '—'}</td>
                    <td><div style={{ display:'flex', alignItems:'center', gap:'.55rem' }}>
                      <div style={{ width:26, height:26, borderRadius:'50%', background:'linear-gradient(135deg,#374151,#1f2937)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'Playfair Display',serif", fontSize:'.62rem', fontWeight:700, flexShrink:0, border:'1px solid rgba(255,255,255,.12)' }}>{initials}</div>
                      <div style={{ fontSize:'.77rem', fontWeight:500 }}>{a.patient_name || 'Unknown'}</div>
                    </div></td>
                    <td style={{ fontSize:'.74rem', color:'var(--dim)' }}>{a.type || '—'}</td>
                    <td><span className={`chip chip-${statusChip}`}>{statusLabel}</span></td>
                    <td>
                      {a.status !== 'completed' && a.status !== 'cancelled' && (
                        <div style={{ display:'flex', gap:'.3rem' }}>
                          <button className="btn btn-p" style={{ fontSize:'.64rem', padding:'.25rem .55rem' }} disabled={actionLoading === a.id} onClick={() => updateStatus(a.id, 'confirmed')}>Approve</button>
                          <button className="btn btn-g" style={{ fontSize:'.64rem', padding:'.25rem .55rem', borderColor:'rgba(239,68,68,.3)', color:'var(--red)' }} disabled={actionLoading === a.id} onClick={() => updateStatus(a.id, 'cancelled')}>Reject</button>
                        </div>
                      )}
                      {a.status === 'cancelled' && <span style={{ fontSize:'.67rem', color:'var(--muted)' }}>Rejected</span>}
                      {a.status === 'completed' && <span style={{ fontSize:'.67rem', color:'var(--green)' }}>Done</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="g23">
        <div className="col">
          <div className="card">
            <div className="ch"><div><div className="ch-title">🔁 Referral Queue</div><div className="ch-sub">Sorted by urgency</div></div></div>
            {referrals.length === 0 ? (
              <div style={{ padding:'1.5rem 1.2rem', textAlign:'center', fontSize:'.78rem', color:'var(--muted)' }}>No pending referrals</div>
            ) : referrals.map((r,i)=>(
              <div key={r.id} style={{ display:'flex', alignItems:'center', gap:'.7rem', padding:'.82rem 1.2rem', borderBottom: i<referrals.length-1?'1px solid var(--border)':'none' }}>
                <div style={{ fontSize:'1.1rem', flexShrink:0 }}>{r.ico}</div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:'.78rem', fontWeight:500 }}>{r.title}</div>
                  <div style={{ fontSize:'.65rem', color:'var(--muted)', marginTop:'.1rem' }}>{r.detail}</div>
                </div>
                <span className={`chip chip-${r.chip}`} style={{ flexShrink:0 }}>{r.chipLabel}</span>
                <button className="btn btn-p" style={{ marginLeft:'.4rem', flexShrink:0, fontSize:'.67rem', padding:'.3rem .65rem' }} onClick={()=>acceptReferral(r.id)}>Accept</button>
              </div>
            ))}
          </div>
        </div>

        <div className="col">
          <div className="card">
            <div className="ch"><div className="ch-title">📊 Clinic Performance</div></div>
            <div className="cb">
              {mbarRows.map(([lbl,cls,val,w])=>(
                <div key={lbl} style={{ display:'flex', alignItems:'center', gap:'.65rem', marginBottom:'.62rem' }}>
                  <span style={{ fontSize:'.68rem', color:'var(--dim)', width:90, flexShrink:0 }}>{lbl}</span>
                  <div style={{ flex:1, background:'rgba(255,255,255,.06)', borderRadius:100, height:5, overflow:'hidden' }}>
                    <div className={`pfill ${cls}`} style={{ width: bars?`${w}%`:'0%', height:'100%', transition:`width 1.2s cubic-bezier(.4,0,.2,1)` }}/>
                  </div>
                  <span style={{ fontFamily:"'DM Mono',monospace", fontSize:'.68rem', color:'var(--white)', width:30, textAlign:'right', flexShrink:0 }}>{val}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="card">
            <div className="ch"><div className="ch-title">🌐 Patient Language Mix</div></div>
            <div className="cb">
              {langRows.map(([lang,pct])=>(
                <div key={lang} style={{ display:'flex', alignItems:'center', gap:'.6rem', marginBottom:'.55rem' }}>
                  <span style={{ fontSize:'.68rem', color:'var(--dim)', width:72, flexShrink:0 }}>{lang}</span>
                  <div style={{ flex:1, background:'rgba(255,255,255,.06)', borderRadius:100, height:4, overflow:'hidden' }}>
                    <div style={{ height:'100%', borderRadius:100, background:'linear-gradient(90deg,var(--violet),var(--amethyst))', width: bars?`${pct}%`:'0%', transition:`width 1.2s cubic-bezier(.4,0,.2,1)` }}/>
                  </div>
                  <span style={{ fontFamily:"'DM Mono',monospace", fontSize:'.65rem', color:'var(--muted)', width:28, textAlign:'right', flexShrink:0 }}>{pct}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   SETTINGS
═══════════════════════════════════════════════ */
export function SettingsView() {
  const { toast } = useApp();
  const [settings, setSettings] = useState({
    preferredLanguage: 'English',
    notificationChannel: 'SMS + Email',
    reminderTiming: '1 day before',
    theme: 'Dark'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet('/settings/me')
      .then(data => {
        if (data) setSettings(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    try {
      await apiPost('/settings/me', settings);
      toast('Settings saved', 'Preferences updated', '⚙️');
    } catch (error) {
      toast('Settings saved', 'Preferences updated (demo mode)', '⚙️');
    }
  };

  if (loading) {
    return (
      <div className="content fade-up">
        <div className="card" style={{ maxWidth:560, textAlign:'center', padding:'2rem' }}>
          <div className="pipe-spin" style={{ margin:'0 auto 1rem' }}/>
          <div style={{ fontSize:'.75rem', color:'var(--muted)' }}>Loading settings...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="content fade-up">
      <div className="card" style={{ maxWidth:560 }}>
        <div className="ch"><div className="ch-title">⚙️ Settings</div></div>
        <div className="cb" style={{ display:'flex', flexDirection:'column', gap:'.7rem' }}>
          <div className="mfield" style={{ margin:0 }}>
            <label className="mlbl">Preferred Language</label>
            <select className="minput" value={settings.preferredLanguage} onChange={e=>setSettings({...settings, preferredLanguage: e.target.value})}>
              <option>English</option>
              <option>Igbo</option>
              <option>French</option>
              <option>Spanish</option>
              <option>Mandarin</option>
              <option>Urdu</option>
              <option>Hindi</option>
            </select>
          </div>
          <div className="mfield" style={{ margin:0 }}>
            <label className="mlbl">Notification Channel</label>
            <select className="minput" value={settings.notificationChannel} onChange={e=>setSettings({...settings, notificationChannel: e.target.value})}>
              <option>SMS + Email</option>
              <option>SMS only</option>
              <option>Email only</option>
              <option>Push notifications</option>
            </select>
          </div>
          <div className="mfield" style={{ margin:0 }}>
            <label className="mlbl">Reminder Timing</label>
            <select className="minput" value={settings.reminderTiming} onChange={e=>setSettings({...settings, reminderTiming: e.target.value})}>
              <option>1 day before</option>
              <option>2 days before</option>
              <option>3 days before</option>
              <option>1 week before</option>
              <option>Morning of appointment</option>
            </select>
          </div>
          <div className="mfield" style={{ margin:0 }}>
            <label className="mlbl">Theme</label>
            <select className="minput" value={settings.theme} onChange={e=>setSettings({...settings, theme: e.target.value})}>
              <option>Dark</option>
              <option>Light</option>
              <option>Auto (system)</option>
            </select>
          </div>
          <button className="btn btn-p" style={{ alignSelf:'flex-start' }} onClick={handleSave}>Save Changes</button>
        </div>
      </div>
    </div>
  );
}
