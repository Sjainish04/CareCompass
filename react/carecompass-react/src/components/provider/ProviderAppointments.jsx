import { useState, useEffect } from 'react';
import { useApp } from '../../hooks/useApp';
import { apiGet, apiPatch } from '../../lib/api';

function formatDate(d) {
  if (!d) return { day: '--', mo: '', full: '' };
  const dt = new Date(d + 'T12:00:00');
  return {
    day: dt.getDate().toString(),
    mo: dt.toLocaleString('en', { month: 'short' }),
    full: dt.toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }),
  };
}

function formatTime(t) {
  if (!t) return '';
  const [h, m] = t.split(':');
  const hr = parseInt(h);
  return `${hr > 12 ? hr - 12 : hr || 12}:${m || '00'} ${hr >= 12 ? 'PM' : 'AM'}`;
}

export default function ProviderAppointments() {
  const { openModal, toast } = useApp();
  const [appointments, setAppointments] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [actionLoading, setActionLoading] = useState(null);
  const [declineId, setDeclineId] = useState(null);
  const [declineReason, setDeclineReason] = useState('');
  const [showPast, setShowPast] = useState(false);

  useEffect(() => {
    apiGet('/appointments/provider/mine')
      .then(data => { if (Array.isArray(data)) setAppointments(data); })
      .catch(() => setAppointments([]));
  }, [refreshKey]);

  useEffect(() => {
    const h = () => setRefreshKey(k => k + 1);
    window.addEventListener('appointments:refresh', h);
    return () => window.removeEventListener('appointments:refresh', h);
  }, []);

  async function approve(id) {
    setActionLoading(id);
    try {
      await apiPatch(`/appointments/provider/${id}/status`, { status: 'confirmed' });
      toast('Approved', 'Appointment confirmed', '');
      setRefreshKey(k => k + 1);
      window.dispatchEvent(new CustomEvent('appointments:refresh'));
    } catch (err) {
      toast('Error', err.message || 'Failed', '');
    } finally {
      setActionLoading(null);
    }
  }

  async function decline(id) {
    setActionLoading(id);
    try {
      await apiPatch(`/appointments/provider/${id}/status`, { status: 'cancelled', rejection_reason: declineReason || 'Declined by provider' });
      toast('Declined', 'Appointment declined', '');
      setDeclineId(null);
      setDeclineReason('');
      setRefreshKey(k => k + 1);
      window.dispatchEvent(new CustomEvent('appointments:refresh'));
    } catch (err) {
      toast('Error', err.message || 'Failed', '');
    } finally {
      setActionLoading(null);
    }
  }

  const pending = appointments.filter(a => a.status === 'pending');
  const confirmed = appointments.filter(a => a.status === 'confirmed');
  const cancelled = appointments.filter(a => a.status === 'cancelled');
  const completed = appointments.filter(a => a.status === 'completed');
  const today = new Date().toISOString().slice(0, 10);
  const confirmedToday = confirmed.filter(a => a.date === today);
  const thisWeekStart = new Date();
  thisWeekStart.setDate(thisWeekStart.getDate() - thisWeekStart.getDay());
  const weekStr = thisWeekStart.toISOString().slice(0, 10);
  const thisWeek = appointments.filter(a => a.date >= weekStr);

  const past = [...completed, ...cancelled];

  return (
    <div className="content fade-up">
      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '.7rem', marginBottom: '.7rem' }}>
        {[
          ['', 'Pending Review', pending.length, 'rgba(217,119,6,.15)', 'rgba(217,119,6,.3)', '#d97706'],
          ['', 'Confirmed Today', confirmedToday.length, 'rgba(16,185,129,.15)', 'rgba(16,185,129,.3)', 'var(--green)'],
          ['', 'This Week', thisWeek.length, 'rgba(109,40,217,.15)', 'rgba(139,92,246,.3)', 'var(--amethyst)'],
          ['', 'Cancelled', cancelled.length, 'rgba(239,68,68,.15)', 'rgba(239,68,68,.3)', 'var(--red)'],
        ].map(([ico, lbl, num, bg, border, color], i) => (
          <div key={i} className="sc">
            <div style={{ width: 32, height: 32, borderRadius: 8, background: bg, border: `1px solid ${border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.85rem', marginBottom: '.4rem' }}>
              {i === 0 ? '⏳' : i === 1 ? '✅' : i === 2 ? '📅' : '✕'}
            </div>
            <div className="sc-num" style={{ color }}>{num}</div>
            <div className="sc-lbl">{lbl}</div>
          </div>
        ))}
      </div>

      {/* Pending Approvals */}
      <div className="card" style={{ border: pending.length > 0 ? '1px solid rgba(217,119,6,.25)' : undefined, marginBottom: '.7rem' }}>
        <div className="ch">
          <div>
            <div className="ch-title" style={{ color: pending.length > 0 ? '#d97706' : undefined }}>
              ⏳ Pending Approvals
            </div>
            <div className="ch-sub">{pending.length} appointment{pending.length !== 1 ? 's' : ''} awaiting review</div>
          </div>
        </div>
        <div className="cb">
          {pending.length === 0 ? (
            <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--muted)', fontSize: '.78rem' }}>
              No pending appointments
            </div>
          ) : pending.map((a, i) => {
            const dt = formatDate(a.date);
            const isDeclineOpen = declineId === a.id;
            return (
              <div key={a.id} style={{ padding: '.95rem 0', borderBottom: i < pending.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <div style={{ display: 'flex', gap: '.85rem', alignItems: 'flex-start' }}>
                  <div style={{ width: 46, textAlign: 'center', flexShrink: 0, background: 'rgba(217,119,6,.1)', borderRadius: 10, padding: '.5rem .2rem' }}>
                    <div style={{ fontFamily: "'Playfair Display',serif", fontSize: '1.35rem', fontWeight: 700, lineHeight: 1 }}>{dt.day}</div>
                    <div style={{ fontSize: '.58rem', color: '#d97706', textTransform: 'uppercase', letterSpacing: '.06em', marginTop: '.12rem' }}>{dt.mo}</div>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '.25rem' }}>
                      <span style={{ fontSize: '.82rem', fontWeight: 600 }}>{a.patient_name || 'Unknown Patient'}</span>
                      <span className="chip chip-y" style={{ fontSize: '.52rem' }}>Pending</span>
                    </div>
                    <div style={{ fontSize: '.74rem', color: 'var(--dim)', marginBottom: '.15rem' }}>{a.type || 'Appointment'}</div>
                    <div style={{ fontSize: '.72rem', color: 'var(--muted)', display: 'flex', flexWrap: 'wrap', gap: '.6rem' }}>
                      <span>🕐 {formatTime(a.time) || 'TBD'}</span>
                      <span>📆 {dt.full}</span>
                    </div>
                    {a.notes && <div style={{ fontSize: '.66rem', color: 'var(--muted)', marginTop: '.25rem', fontStyle: 'italic' }}>📝 {a.notes}</div>}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '.3rem', flexShrink: 0 }}>
                    <button className="btn btn-p" style={{ fontSize: '.65rem', padding: '.28rem .7rem', background: 'rgba(16,185,129,.15)', borderColor: 'rgba(16,185,129,.3)', color: 'var(--green)' }} disabled={actionLoading === a.id} onClick={() => approve(a.id)}>
                      ✓ Approve
                    </button>
                    <button style={{ fontSize: '.65rem', padding: '.28rem .7rem', borderRadius: 6, border: '1px solid rgba(239,68,68,.2)', background: 'rgba(239,68,68,.08)', color: 'var(--red)', cursor: 'pointer', fontFamily: "'DM Sans',sans-serif", fontWeight: 500 }} disabled={actionLoading === a.id} onClick={() => setDeclineId(isDeclineOpen ? null : a.id)}>
                      ✕ Decline
                    </button>
                  </div>
                </div>
                {isDeclineOpen && (
                  <div style={{ marginTop: '.65rem', marginLeft: '3.8rem', padding: '.75rem', background: 'rgba(239,68,68,.06)', border: '1px solid rgba(239,68,68,.15)', borderRadius: 10 }}>
                    <div style={{ fontSize: '.68rem', fontWeight: 600, color: 'var(--red)', marginBottom: '.5rem' }}>Reason for declining</div>
                    <div style={{ display: 'flex', gap: '.5rem', alignItems: 'flex-end' }}>
                      <input
                        value={declineReason}
                        onChange={e => setDeclineReason(e.target.value)}
                        placeholder="Schedule conflict, unavailable, etc."
                        style={{ flex: 1, background: 'rgba(255,255,255,.06)', border: '1px solid var(--border)', borderRadius: 7, padding: '.38rem .6rem', color: 'var(--white)', colorScheme: 'dark', fontFamily: "'DM Sans',sans-serif", fontSize: '.7rem' }}
                      />
                      <button className="btn btn-p" style={{ fontSize: '.68rem', padding: '.38rem .85rem', background: 'rgba(239,68,68,.15)', borderColor: 'rgba(239,68,68,.3)', color: 'var(--red)' }} onClick={() => decline(a.id)}>Confirm Decline</button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Upcoming Confirmed */}
      <div className="card" style={{ marginBottom: '.7rem' }}>
        <div className="ch">
          <div>
            <div className="ch-title">✅ Upcoming Confirmed</div>
            <div className="ch-sub">{confirmed.length} confirmed appointments</div>
          </div>
          <button className="btn btn-p" style={{ fontSize: '.69rem' }} onClick={() => openModal('bookAppt')}>+ New Appointment</button>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="sch-tbl">
            <thead><tr><th>Date</th><th>Time</th><th>Patient</th><th>Type</th><th>Status</th></tr></thead>
            <tbody>
              {confirmed.length === 0 ? (
                <tr><td colSpan={5} style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--muted)', fontSize: '.78rem' }}>No confirmed appointments</td></tr>
              ) : confirmed.map(a => {
                const initials = (a.patient_name || 'UK').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
                return (
                  <tr key={a.id}>
                    <td style={{ fontFamily: "'DM Mono',monospace", fontSize: '.73rem', color: 'var(--dim)', whiteSpace: 'nowrap' }}>{a.date || '--'}</td>
                    <td style={{ fontFamily: "'DM Mono',monospace", fontSize: '.73rem', color: 'var(--dim)', whiteSpace: 'nowrap' }}>{formatTime(a.time) || '--'}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '.55rem' }}>
                        <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'linear-gradient(135deg,#374151,#1f2937)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Playfair Display',serif", fontSize: '.62rem', fontWeight: 700, flexShrink: 0, border: '1px solid rgba(255,255,255,.12)' }}>{initials}</div>
                        <div style={{ fontSize: '.77rem', fontWeight: 500 }}>{a.patient_name || 'Unknown'}</div>
                      </div>
                    </td>
                    <td style={{ fontSize: '.74rem', color: 'var(--dim)' }}>{a.type || '--'}</td>
                    <td><span className="chip chip-g">✓ Confirmed</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Past appointments - collapsible */}
      {past.length > 0 && (
        <div className="card">
          <div className="ch" style={{ cursor: 'pointer' }} onClick={() => setShowPast(p => !p)}>
            <div className="ch-title">📁 Past & Cancelled ({past.length})</div>
            <span style={{ fontSize: '.7rem', color: 'var(--muted)' }}>{showPast ? '▲ Collapse' : '▼ Expand'}</span>
          </div>
          {showPast && (
            <div style={{ overflowX: 'auto' }}>
              <table className="sch-tbl">
                <thead><tr><th>Date</th><th>Time</th><th>Patient</th><th>Type</th><th>Status</th></tr></thead>
                <tbody>
                  {past.map(a => {
                    const statusChip = a.status === 'completed' ? 'gr' : 'r';
                    const statusLabel = a.status === 'completed' ? '✓ Completed' : '✕ Cancelled';
                    return (
                      <tr key={a.id} style={{ opacity: .7 }}>
                        <td style={{ fontFamily: "'DM Mono',monospace", fontSize: '.73rem', color: 'var(--dim)' }}>{a.date || '--'}</td>
                        <td style={{ fontFamily: "'DM Mono',monospace", fontSize: '.73rem', color: 'var(--dim)' }}>{formatTime(a.time) || '--'}</td>
                        <td style={{ fontSize: '.77rem' }}>{a.patient_name || 'Unknown'}</td>
                        <td style={{ fontSize: '.74rem', color: 'var(--dim)' }}>{a.type || '--'}</td>
                        <td><span className={`chip chip-${statusChip}`}>{statusLabel}</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
