// src/components/shared/ClinicBookModal.jsx
import { useState } from 'react';
import { useApp } from '../../hooks/useApp';
import { apiPost } from '../../lib/api';

// Convert slot date like "Mon Dec 16" to ISO "2026-12-16"
function parseSlotDate(slotDate) {
  const months = { Jan:0, Feb:1, Mar:2, Apr:3, May:4, Jun:5, Jul:6, Aug:7, Sep:8, Oct:9, Nov:10, Dec:11 };
  const parts = slotDate.trim().split(/\s+/);
  // Could be "Mon Dec 16" or "Dec 16"
  let monthStr, dayStr;
  if (parts.length >= 3) {
    monthStr = parts[1];
    dayStr = parts[2];
  } else if (parts.length === 2) {
    monthStr = parts[0];
    dayStr = parts[1];
  } else {
    return slotDate; // can't parse, return as-is
  }
  const month = months[monthStr];
  const day = parseInt(dayStr, 10);
  if (month === undefined || isNaN(day)) return slotDate;

  const now = new Date();
  let year = now.getFullYear();
  const candidate = new Date(year, month, day);
  // If the date is in the past, use next year
  if (candidate < new Date(now.getFullYear(), now.getMonth(), now.getDate())) {
    year++;
  }
  const mm = String(month + 1).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  return `${year}-${mm}-${dd}`;
}

// Convert "9:00 AM" to "09:00"
function parseSlotTime(slotTime) {
  const match = slotTime.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return slotTime;
  let h = parseInt(match[1], 10);
  const m = match[2];
  const ampm = match[3].toUpperCase();
  if (ampm === 'PM' && h !== 12) h += 12;
  if (ampm === 'AM' && h === 12) h = 0;
  return `${String(h).padStart(2, '0')}:${m}`;
}

export default function ClinicBookModal({ clinic }) {
  const { closeModal, toast } = useApp();
  const [selSlot, setSelSlot] = useState(null);
  const [lang, setLang] = useState('Igbo');
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [patientName, setPatientName] = useState('Amara Nwosu');
  const [phone, setPhone] = useState('');
  const [apptType, setApptType] = useState('Initial Consultation');

  if (!clinic) return null;

  const ref = 'CC-' + Math.random().toString(36).substr(2, 8).toUpperCase();

  const handleConfirm = async () => {
    if (!selSlot) {
      toast('Select a time', 'Please choose a time slot', '');
      return;
    }

    setLoading(true);
    try {
      const isoDate = parseSlotDate(selSlot.d);
      const isoTime = parseSlotTime(selSlot.t);

      const appointmentData = {
        type: apptType,
        date: isoDate,
        time: isoTime,
        provider_id: (clinic.id && String(clinic.id).includes('-')) ? String(clinic.id) : null,
        provider_name: clinic.name || clinic.clinic_name || '',
        notes: `Booked via clinic finder. Specialty: ${clinic.spec}. Phone: ${phone || 'N/A'}`,
        status: 'confirmed',
      };

      await apiPost('/appointments', appointmentData);
      setDone(true);
      toast('Appointment confirmed!', `${clinic.name} · ${lang} reminder scheduled`, '');

      window.dispatchEvent(new CustomEvent('appointments:refresh'));
    } catch (error) {
      console.error('Failed to book appointment:', error);
      toast('Booking failed', 'Please try again or contact support', '');
      setLoading(false);
    }
  };

  if (done) return (
    <div className="modal-box">
      <div style={{ textAlign:'center', padding:'2.1rem 1.4rem' }}>
        <div style={{ fontSize:'2.8rem', marginBottom:'.85rem', animation:'pop .5s cubic-bezier(.175,.885,.32,1.275)' }}>✅</div>
        <div style={{ fontFamily:"'Playfair Display',serif", fontSize:'1.25rem', fontWeight:700, marginBottom:'.38rem' }}>Appointment Booked!</div>
        <div style={{ fontSize:'.78rem', color:'var(--muted)', lineHeight:1.7, marginBottom:'1.2rem' }}>Fatima will send a confirmation and reminder in {lang}.</div>
        <div style={{ background:'rgba(16,185,129,.09)', border:'1px solid rgba(16,185,129,.2)', borderRadius:10, padding:'.85rem', textAlign:'left', marginBottom:'1.2rem' }}>
          {[['Clinic', clinic.name],['Date', selSlot ? parseSlotDate(selSlot.d) : 'Next available'],['Time', selSlot ? selSlot.t : ''],['Language', lang],['Reference', ref]].map(([k,v]) => (
            <div key={k} style={{ display:'flex', justifyContent:'space-between', fontSize:'.73rem', marginBottom:'.24rem' }}>
              <span style={{ color:'var(--muted)' }}>{k}</span>
              <span style={{ fontWeight:500, fontFamily: k==='Reference' ? "'DM Mono',monospace" : 'inherit', fontSize: k==='Reference' ? '.68rem' : 'inherit' }}>{v}</span>
            </div>
          ))}
        </div>
        <button className="mcta" onClick={closeModal}>Back to Map</button>
      </div>
    </div>
  );

  return (
    <div className="modal-box">
      <div className="mhd">
        <div className="mhd-ico">{clinic.icon}</div>
        <div><div className="mhd-name">{clinic.name}</div><div className="mhd-sub">{clinic.spec} · {clinic.rating}★ · {clinic.dist}km</div></div>
        <button className="mclose" onClick={closeModal}>✕</button>
      </div>
      <div className="mbody">
        <span className="msec-lbl">Choose a Time Slot</span>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'.4rem', marginBottom:'.8rem' }}>
          {clinic.slots.map((s, i) => (
            <div key={i} onClick={() => setSelSlot(s)} style={{
              padding:'.55rem .35rem', borderRadius:8, textAlign:'center', fontSize:'.67rem', fontWeight:500, cursor:'pointer',
              background: selSlot===s ? 'rgba(109,40,217,.22)' : 'rgba(255,255,255,.03)',
              border: `1px solid ${selSlot===s ? 'var(--bh)' : 'var(--border)'}`,
              color: selSlot===s ? 'var(--white)' : 'var(--dim)', transition:'all .2s',
            }}>
              <span style={{ fontSize:'.55rem', color: selSlot===s ? 'var(--lavender)' : 'var(--muted)', display:'block', marginBottom:'.1rem' }}>{s.d}</span>{s.t}
            </div>
          ))}
        </div>
        <span className="msec-lbl">Your Details</span>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'.65rem' }}>
          <div className="mfield">
            <label className="mlbl">Full Name</label>
            <input
              className="minput"
              value={patientName}
              onChange={e => setPatientName(e.target.value)}
            />
          </div>
          <div className="mfield">
            <label className="mlbl">Phone</label>
            <input
              className="minput"
              placeholder="(416) 555-0100"
              value={phone}
              onChange={e => setPhone(e.target.value)}
            />
          </div>
          <div className="mfield">
            <label className="mlbl">Appointment Type</label>
            <select
              className="minput"
              value={apptType}
              onChange={e => setApptType(e.target.value)}
            >
              <option>Initial Consultation</option>
              <option>Follow-up</option>
              <option>Specialist Referral</option>
            </select>
          </div>
          <div className="mfield">
            <label className="mlbl">Preferred Language</label>
            <select className="minput" value={lang} onChange={e=>setLang(e.target.value)}>
              {['Igbo','English','Urdu','Mandarin','Hindi','Tamil'].map(l=><option key={l}>{l}</option>)}
            </select>
          </div>
        </div>
        <div style={{ background:'rgba(109,40,217,.09)', border:'1px solid rgba(139,92,246,.18)', borderRadius:10, padding:'.85rem .95rem', marginBottom:'.85rem' }}>
          {[['Clinic', clinic.name],['Date & Time', selSlot?`${selSlot.d} · ${selSlot.t}`:'Select a slot above'],['Reminder', `${lang} + English SMS`],['Navigator','Fatima will confirm']].map(([k,v]) => (
            <div key={k} style={{ display:'flex', justifyContent:'space-between', fontSize:'.73rem', marginBottom:'.26rem' }}>
              <span style={{ color:'var(--muted)' }}>{k}</span><span style={{ fontWeight:500 }}>{v}</span>
            </div>
          ))}
        </div>
        <button
          className="mcta"
          onClick={handleConfirm}
          disabled={loading}
          style={{ opacity: loading ? 0.6 : 1 }}
        >
          {loading ? 'Booking...' : 'Confirm Appointment →'}
        </button>
      </div>
    </div>
  );
}
