import { useState, useEffect } from 'react';
import { useApp } from '../../hooks/useApp';
import { apiPost, apiGet } from '../../lib/api';

const darkInput = {
  background: 'rgba(255,255,255,.06)',
  border: '1px solid var(--border)',
  borderRadius: 8,
  padding: '.55rem .75rem',
  color: 'var(--white)',
  colorScheme: 'dark',
  fontFamily: "'DM Sans',sans-serif",
  fontSize: '.75rem',
  width: '100%',
};

export default function BookApptModal({ clinic }) {
  const { closeModal, toast } = useApp();
  const [loading, setLoading] = useState(false);
  const [booked, setBooked] = useState(null);
  const [providers, setProviders] = useState([]);
  const [providerSearch, setProviderSearch] = useState('');
  const [formData, setFormData] = useState({
    type: 'Specialist Visit',
    language: 'Igbo',
    provider_id: clinic?.id ? String(clinic.id) : '',
    provider_name: clinic?.name || '',
    preferredDate: '',
    preferredTime: '',
    notes: '',
  });

  useEffect(() => {
    apiGet('/providers')
      .then(data => { if (Array.isArray(data)) setProviders(data); })
      .catch(() => {});
  }, []);

  const set = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));

  function selectProvider(p) {
    setFormData(prev => ({
      ...prev,
      provider_id: String(p.id),
      provider_name: p.clinic_name || p.name || '',
    }));
    setProviderSearch('');
  }

  const filteredProviders = providerSearch.length > 0
    ? providers.filter(p =>
        (p.clinic_name || p.name || '').toLowerCase().includes(providerSearch.toLowerCase()) ||
        (p.specialty || p.spec || '').toLowerCase().includes(providerSearch.toLowerCase())
      )
    : [];

  async function handleSubmit() {
    if (!formData.preferredDate || !formData.preferredTime) {
      toast('Missing info', 'Please select date and time', '');
      return;
    }
    setLoading(true);
    try {
      const res = await apiPost('/appointments', {
        type: formData.type,
        date: formData.preferredDate,
        time: formData.preferredTime,
        provider_id: (formData.provider_id && formData.provider_id.includes('-')) ? formData.provider_id : null,
        provider_name: formData.provider_name || 'To be assigned',
        notes: formData.notes,
        status: 'confirmed',
      });
      setBooked({ ...res, ...formData });
      window.dispatchEvent(new CustomEvent('appointments:refresh'));
    } catch (err) {
      toast('Booking failed', err.message || 'Please try again', '');
    } finally {
      setLoading(false);
    }
  }

  // Success screen
  if (booked) {
    const d = new Date(formData.preferredDate + 'T12:00:00');
    const dateStr = d.toLocaleDateString('en-CA', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    const [h, m] = formData.preferredTime.split(':');
    const hr = parseInt(h);
    const timeStr = `${hr > 12 ? hr - 12 : hr || 12}:${m} ${hr >= 12 ? 'PM' : 'AM'}`;

    return (
      <div className="modal-box" style={{ maxWidth: 420 }}>
        <div style={{ textAlign: 'center', padding: '2rem 1.5rem' }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(16,185,129,.15)', border: '2px solid var(--green)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', marginBottom: '.85rem' }}>✓</div>
          <div style={{ fontFamily: "'Playfair Display',serif", fontSize: '1.2rem', fontWeight: 700, marginBottom: '.3rem' }}>Appointment Booked!</div>
          <div style={{ fontSize: '.72rem', color: 'var(--muted)', marginBottom: '1.2rem' }}>Your navigator will send a confirmation reminder</div>

          <div style={{ background: 'rgba(16,185,129,.06)', border: '1px solid rgba(16,185,129,.15)', borderRadius: 12, padding: '1rem', textAlign: 'left', marginBottom: '1.2rem' }}>
            {[
              ['Type', formData.type],
              ['Provider', formData.provider_name || 'To be assigned'],
              ['Date', dateStr],
              ['Time', timeStr],
              ['Language', formData.language],
              formData.notes && ['Notes', formData.notes],
            ].filter(Boolean).map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '.32rem 0', borderBottom: '1px solid rgba(255,255,255,.04)', fontSize: '.73rem' }}>
                <span style={{ color: 'var(--muted)' }}>{k}</span>
                <span style={{ fontWeight: 500, textAlign: 'right', maxWidth: '60%' }}>{v}</span>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '.5rem' }}>
            <button className="btn btn-g" style={{ flex: 1, justifyContent: 'center', fontSize: '.72rem' }} onClick={closeModal}>Done</button>
            <button className="btn btn-p" style={{ flex: 1, justifyContent: 'center', fontSize: '.72rem' }} onClick={() => { setBooked(null); setFormData(f => ({ ...f, preferredDate: '', preferredTime: '', notes: '' })); }}>Book Another</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-box" style={{ maxWidth: 440 }}>
      <div className="mhd">
        <div className="mhd-ico">📅</div>
        <div>
          <div className="mhd-name">Book an Appointment</div>
          <div className="mhd-sub">Navigator Fatima confirms within 2 hours</div>
        </div>
        <button className="mclose" onClick={closeModal}>✕</button>
      </div>
      <div className="mbody">
        {/* Type + Language row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.6rem', marginBottom: '.15rem' }}>
          <div className="mfield">
            <label className="mlbl">Appointment Type</label>
            <select className="minput" value={formData.type} onChange={e => set('type', e.target.value)}>
              <option>Specialist Visit</option><option>Follow-up</option><option>Initial Consult</option><option>Virtual</option><option>Lab / Test</option>
            </select>
          </div>
          <div className="mfield">
            <label className="mlbl">Reminder Language</label>
            <select className="minput" value={formData.language} onChange={e => set('language', e.target.value)}>
              <option>Igbo</option><option>English</option><option>Urdu</option><option>Mandarin</option><option>Hindi</option><option>Tamil</option><option>Tagalog</option>
            </select>
          </div>
        </div>

        {/* Provider searchable select */}
        <div className="mfield" style={{ position: 'relative' }}>
          <label className="mlbl">Provider / Clinic</label>
          {formData.provider_name ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
              <div className="minput" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>{formData.provider_name}</span>
                <span onClick={() => set('provider_name', '') || set('provider_id', '')} style={{ cursor: 'pointer', color: 'var(--muted)', fontSize: '.7rem' }}>✕</span>
              </div>
            </div>
          ) : (
            <>
              <input
                className="minput"
                placeholder="Search providers..."
                value={providerSearch}
                onChange={e => setProviderSearch(e.target.value)}
              />
              {filteredProviders.length > 0 && (
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, maxHeight: 160, overflowY: 'auto', marginTop: 2 }}>
                  {filteredProviders.slice(0, 8).map(p => (
                    <div key={p.id} onClick={() => selectProvider(p)} style={{ padding: '.45rem .7rem', cursor: 'pointer', fontSize: '.73rem', borderBottom: '1px solid var(--border)', transition: 'background .15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(109,40,217,.15)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <div style={{ fontWeight: 500 }}>{p.clinic_name || p.name}</div>
                      <div style={{ fontSize: '.62rem', color: 'var(--muted)' }}>{p.specialty || p.spec}</div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Date + Time row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.6rem', marginBottom: '.15rem' }}>
          <div className="mfield">
            <label className="mlbl">Date</label>
            <input type="date" value={formData.preferredDate} onChange={e => set('preferredDate', e.target.value)} style={darkInput} />
          </div>
          <div className="mfield">
            <label className="mlbl">Time</label>
            <input type="time" value={formData.preferredTime} onChange={e => set('preferredTime', e.target.value)} style={darkInput} />
          </div>
        </div>

        {/* Notes */}
        <div className="mfield">
          <label className="mlbl">Notes (optional)</label>
          <input className="minput" placeholder="Symptoms, questions, special requests..." value={formData.notes} onChange={e => set('notes', e.target.value)} />
        </div>

        {/* Preview */}
        {formData.preferredDate && formData.preferredTime && (
          <div style={{ padding: '.65rem .8rem', borderRadius: 9, background: 'rgba(109,40,217,.08)', border: '1px solid rgba(139,92,246,.15)', marginBottom: '.6rem', fontSize: '.7rem', color: 'var(--dim)' }}>
            <span style={{ fontWeight: 600, color: 'var(--lavender)' }}>Preview: </span>
            {formData.type} {formData.provider_name ? `at ${formData.provider_name}` : ''} on {new Date(formData.preferredDate + 'T12:00').toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric' })} at {formData.preferredTime} · Reminder in {formData.language}
          </div>
        )}

        <button className="mcta" onClick={handleSubmit} disabled={loading} style={{ opacity: loading ? 0.6 : 1 }}>
          {loading ? 'Booking...' : 'Confirm Appointment'}
        </button>
      </div>
    </div>
  );
}
