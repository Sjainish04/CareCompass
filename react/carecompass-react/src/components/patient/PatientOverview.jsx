// src/components/patient/PatientOverview.jsx
import { useState, useEffect } from 'react';
import { useApp } from '../../hooks/useApp';
import { apiGet } from '../../lib/api';

function StatCard({ icon, cls, label, num, delta, dc, onClick }) {
  return (
    <div className="sc" onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default' }}>
      <div className="sc-top"><div className={`sc-ico ${cls}`}>{icon}</div><span className={`sc-delta ${dc}`}>{delta}</span></div>
      <div className="sc-num">{num}</div>
      <div className="sc-lbl">{label}</div>
    </div>
  );
}

function ProgressBar({ width, color }) {
  return <div className="pbar"><div className="pfill" style={{ width, background: color || undefined }} /></div>;
}

export default function PatientOverview() {
  const { go, openModal, toast, badgeCounts } = useApp();
  const [summary, setSummary] = useState(null);
  const [appointments, setAppointments] = useState([]);

  useEffect(() => {
    apiGet('/patients/me/summary')
      .then(setSummary)
      .catch(() => setSummary(null));
    apiGet('/appointments')
      .then(data => { if (Array.isArray(data)) setAppointments(data); })
      .catch(() => {});
  }, []);

  // Listen for refresh events
  useEffect(() => {
    const h = () => {
      apiGet('/appointments')
        .then(data => { if (Array.isArray(data)) setAppointments(data); })
        .catch(() => {});
    };
    window.addEventListener('appointments:refresh', h);
    return () => window.removeEventListener('appointments:refresh', h);
  }, []);

  const upcoming = appointments.filter(a => a.status === 'confirmed' || a.status === 'pending');
  const pendingAppts = appointments.filter(a => a.status === 'pending');
  const confirmedAppts = appointments.filter(a => a.status === 'confirmed');

  // Use live data when available, fallback to API summary, then hardcoded
  const activeJourneys = summary?.activeJourneys ?? 2;
  const upcomingAppts = badgeCounts.appointments || summary?.upcomingAppts || upcoming.length || 2;
  const nextApptDate = upcoming[0]?.date
    ? new Date(upcoming[0].date + 'T12:00:00').toLocaleDateString('en', { month:'short', day:'numeric' })
    : (summary?.nextApptDate ?? 'Dec 18');
  const referralsTotal = badgeCounts.referrals || summary?.referralsTotal || 3;
  const referralsPending = summary?.referralsPending ?? 1;
  const stepsComplete = summary?.stepsComplete ?? 6;
  const stepsTotal = summary?.stepsTotal ?? 8;
  const stepsPercent = summary?.stepsPercent ?? 75;

  return (
    <div className="content fade-up">
      <div className="g4">
        <StatCard icon="🧭" cls="iv" label="Active Journeys" num={String(activeJourneys)} delta="Active" dc="dg" onClick={()=>go('p-journey')}/>
        <StatCard icon="📅" cls="ig" label="Upcoming Appts" num={`${confirmedAppts.length}+${pendingAppts.length}`} delta={`${confirmedAppts.length} confirmed, ${pendingAppts.length} pending`} dc="dg" onClick={()=>go('p-appointments')}/>
        <StatCard icon="🔁" cls="iy" label="Referrals" num={String(referralsTotal)} delta={`${referralsPending} Pending`} dc="dy" onClick={()=>go('p-referrals')}/>
        <StatCard icon="✅" cls="ib" label="Steps Complete" num={`${stepsComplete}/${stepsTotal}`} delta={`${stepsPercent}%`} dc="dg"/>
      </div>

      <div className="g32">
        {/* Care Journey preview */}
        <div className="card">
          <div className="ch"><div><div className="ch-title">🧭 Active Care Journey</div><div className="ch-sub">Cardiology referral pathway</div></div><button className="cl" onClick={()=>go('p-journey')}>View all →</button></div>
          {[
            {dot:'done',label:'Initial Intake Complete',detail:'Multilingual intake submitted in Igbo + English',chip:'cg',chipLabel:'Completed',date:'Nov 28'},
            {dot:'done',label:'Family Doctor Matched',detail:'Dr. Adeyemi · Igbo-speaking · Scarborough',chip:'cg',chipLabel:'Completed',date:'Dec 1'},
            {dot:'done',label:'Blood Work Ordered',detail:'LifeLabs Scarborough · Results ready Dec 10',chip:'cg',chipLabel:'Completed',date:'Dec 5'},
            {dot:'now', label:'Cardiology Appointment',detail:'Dr. Patel · Mount Sinai · Confirmed Dec 18',chip:'cv',chipLabel:'Upcoming · Dec 18',date:''},
            {dot:'pend',label:'Treatment Plan Review',detail:'Navigator will confirm after specialist',chip:'cgr',chipLabel:'Pending',date:''},
          ].map((s,i) => (
            <div key={i} style={{ display:'flex', gap:'.8rem', padding:'.75rem 1.2rem', transition:'background .2s' }}>
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
                <div style={{ fontSize:'.82rem', fontWeight:600, marginBottom:'.2rem' }}>{s.label}</div>
                <div style={{ fontSize:'.72rem', color:'var(--dim)', lineHeight:1.6, marginBottom:'.4rem' }}>{s.detail}</div>
                <div style={{ display:'flex', alignItems:'center', gap:'.55rem' }}>
                  <span className={`chip chip-${s.chip.replace('c','')}`}>{s.chipLabel}</span>
                  {s.date&&<span style={{ fontSize:'.62rem', color:'var(--muted)' }}>{s.date}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="col">
          {/* Appointments */}
          <div className="card">
            <div className="ch"><div className="ch-title">📅 Next Appointments</div><button className="cl" onClick={()=>go('p-appointments')}>All →</button></div>
            <div className="cb">
              {(() => {
                // Use real appointments if available, else fallback
                const displayAppts = upcoming.length > 0
                  ? upcoming.slice(0, 3).map(a => {
                      const d = a.date ? new Date(a.date + 'T12:00:00') : null;
                      return {
                        day: d ? d.getDate().toString() : '—',
                        mo: d ? d.toLocaleString('en', { month:'short' }) : '',
                        name: `${a.type || 'Appointment'}${a.provider_name ? ' — ' + a.provider_name : ''}`,
                        detail: `${a.time || 'TBD'}${a.provider_name ? ' · ' + a.provider_name : ''}`,
                        lang: '🌐 Reminder set',
                        chip: a.status === 'confirmed' ? 'g' : a.status === 'pending' ? 'y' : 'v',
                        chipLabel: a.status === 'confirmed' ? 'Confirmed' : a.status === 'pending' ? '⏳ Pending' : a.status || 'Scheduled',
                      };
                    })
                  : [
                      {day:'18',mo:'Dec',name:'Dr. Patel — Cardiology',detail:'10:30 AM · Mount Sinai',lang:'🌐 Igbo reminder set',chip:'g',chipLabel:'Confirmed'},
                      {day:'22',mo:'Dec',name:'Dr. Adeyemi — Follow-up',detail:'2:00 PM · Scarborough',lang:'🌐 Igbo · English',chip:'v',chipLabel:'Scheduled'},
                    ];
                return displayAppts.map((a,i)=>(
                  <div key={i} style={{ display:'flex', alignItems:'center', gap:'.85rem', padding:'.85rem 0', borderBottom: i<displayAppts.length-1?'1px solid var(--border)':'none' }}>
                    <div style={{ width:38, textAlign:'center', flexShrink:0 }}>
                      <div style={{ fontFamily:"'Playfair Display',serif", fontSize:'1.3rem', fontWeight:700, lineHeight:1.1 }}>{a.day}</div>
                      <div style={{ fontSize:'.6rem', color:'var(--muted)', textTransform:'uppercase', letterSpacing:'.06em' }}>{a.mo}</div>
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:'.8rem', fontWeight:500 }}>{a.name}</div>
                      <div style={{ fontSize:'.68rem', color:'var(--muted)', marginTop:'.1rem' }}>{a.detail}</div>
                      <div style={{ fontSize:'.65rem', color:'var(--amethyst)', marginTop:'.15rem' }}>{a.lang}</div>
                    </div>
                    <span className={`chip chip-${a.chip}`} style={{ flexShrink:0 }}>{a.chipLabel}</span>
                  </div>
                ));
              })()}
            </div>
          </div>

          {/* Quick actions */}
          <div className="card">
            <div className="ch"><div className="ch-title">⚡ Quick Actions</div></div>
            <div className="cb">
              {[['📅','Book appointment',()=>openModal('bookAppt')],
                ['💬','Message my navigator',()=>go('p-navigator')],
                ['🗺️','Find a clinic near me',()=>go('find-care')],
                ['📋','View health records',()=>go('p-records')]].map(([ico,lbl,fn],i)=>(
                <button key={i} className="qa" onClick={fn}><span className="qa-ico">{ico}</span>{lbl}<span className="qa-arr">›</span></button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="g2">
        {/* Referrals */}
        <div className="card">
          <div className="ch"><div className="ch-title">🔁 Referral Tracker</div><button className="cl" onClick={()=>go('p-referrals')}>All →</button></div>
          {(() => {
            const baseRefs = [
              {ico:'❤️',spec:'cardiology',title:'Cardiology — Dr. Patel',detail:'Routine · Referred Dec 1',chip:'g',chipLabel:'Booked · Dec 18',steps:'3/4',width:'75%'},
              {ico:'🩸',spec:'hematology',title:'Hematology — LifeLabs',detail:'Blood work complete · Dec 10',chip:'g',chipLabel:'Completed',steps:'4/4',width:'100%'},
              {ico:'🦴',spec:'orthopaedics',title:'Orthopaedics — Sunnybrook',detail:'Semi-urgent · Pending booking',chip:'y',chipLabel:'Pending',steps:'1/4',width:'20%',barColor:'linear-gradient(90deg,#d97706,var(--yellow))'},
            ];
            // Cross-reference booked appointments to update referral statuses
            return baseRefs.map(r => {
              if (r.chip !== 'y') return r; // Only update pending referrals
              const matchingAppt = upcoming.find(a => {
                const combined = ((a.provider_name || '') + ' ' + (a.notes || '') + ' ' + (a.type || '')).toLowerCase();
                return combined.includes(r.spec);
              });
              if (matchingAppt) {
                const apptDate = matchingAppt.date
                  ? new Date(matchingAppt.date + 'T12:00:00').toLocaleDateString('en', { month:'short', day:'numeric' })
                  : '';
                return { ...r, chip:'g', chipLabel:`Booked${apptDate ? ' · ' + apptDate : ''}`, steps:'3/4', width:'75%', barColor:undefined,
                  detail: r.detail.replace('Pending booking', `Booked${matchingAppt.provider_name ? ' at ' + matchingAppt.provider_name : ''}`) };
              }
              return r;
            });
          })().map((r,i,arr)=>(
            <div key={i} style={{ display:'flex', alignItems:'center', gap:'.7rem', padding:'.82rem 1.2rem', borderBottom: i<arr.length-1?'1px solid var(--border)':'none' }}>
              <div style={{ fontSize:'1.1rem', flexShrink:0, width:28, textAlign:'center' }}>{r.ico}</div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:'.78rem', fontWeight:500 }}>{r.title}</div>
                <div style={{ fontSize:'.65rem', color:'var(--muted)', marginTop:'.1rem' }}>{r.detail}</div>
                <div style={{ display:'flex', alignItems:'center', gap:'.5rem', marginTop:'.32rem' }}>
                  <span className={`chip chip-${r.chip}`}>{r.chipLabel}</span>
                  <span style={{ fontSize:'.6rem', color:'var(--muted)' }}>{r.steps}</span>
                </div>
                <div className="pbar"><div className="pfill" style={{ width:r.width, background:r.barColor||undefined }}/></div>
              </div>
            </div>
          ))}
        </div>

        {/* Health profile */}
        <div className="card">
          <div className="ch"><div className="ch-title">🏥 Health Profile</div><button className="cl" onClick={()=>go('p-records')}>View →</button></div>
          <div className="cb" style={{ display:'flex', flexWrap:'wrap' }}>
            {['Hypertension','Anaemia'].map(c=><span key={c} className="htag hcond">{c}</span>)}
            {['Lisinopril 10mg','Iron supplements'].map(m=><span key={m} className="htag hmed">{m}</span>)}
            {['⚠ Penicillin','⚠ Sulfa drugs'].map(a=><span key={a} className="htag hallergy">{a}</span>)}
          </div>
          <div className="ch" style={{ borderTop:'1px solid var(--border)' }}><div className="ch-title">💬 Navigator Chat</div><button className="cl" onClick={()=>go('p-navigator')}>Open →</button></div>
          <div className="cb">
            <div className="cmsg" style={{ marginBottom:'.45rem' }}><div className="cav cav-nav">F</div><div><div className="cbbl cbbl-nav">Ndewo Amara! 👋 Your Dec 18 cardiology appt is confirmed. Igbo reminder set!</div></div></div>
            <div className="cmsg cmsg-r"><div className="cav cav-usr">A</div><div><div className="cbbl cbbl-usr">Thanks Fatima! Can you help with the orthopaedics referral?</div></div></div>
          </div>
        </div>
      </div>
    </div>
  );
}
