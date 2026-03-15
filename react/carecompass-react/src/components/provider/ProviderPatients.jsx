import { useState, useEffect } from 'react';
import { useApp } from '../../hooks/useApp';
import { apiGet } from '../../lib/api';

function formatDate(d) {
  if (!d) return '--';
  return new Date(d + 'T12:00:00').toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function ProviderPatients() {
  const { toast } = useApp();
  const [appointments, setAppointments] = useState([]);
  const [expandedPatient, setExpandedPatient] = useState(null);

  useEffect(() => {
    apiGet('/appointments/provider/mine')
      .then(data => { if (Array.isArray(data)) setAppointments(data); })
      .catch(() => setAppointments([]));
  }, []);

  // Group by patient
  const patientMap = {};
  appointments.forEach(a => {
    const key = a.user_id || a.patient_name || 'unknown';
    if (!patientMap[key]) {
      patientMap[key] = {
        id: key,
        name: a.patient_name || 'Unknown Patient',
        appointments: [],
      };
    }
    patientMap[key].appointments.push(a);
  });

  const patients = Object.values(patientMap).map(p => {
    const sorted = [...p.appointments].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    const upcoming = sorted.find(a => a.status === 'confirmed' || a.status === 'pending');
    return {
      ...p,
      totalVisits: p.appointments.length,
      lastVisit: sorted[0]?.date || null,
      upcomingAppt: upcoming,
      appointments: sorted,
    };
  }).sort((a, b) => (b.lastVisit || '').localeCompare(a.lastVisit || ''));

  return (
    <div className="content fade-up">
      <div className="card">
        <div className="ch">
          <div>
            <div className="ch-title">👥 My Patients</div>
            <div className="ch-sub">{patients.length} patient{patients.length !== 1 ? 's' : ''} who have booked with you</div>
          </div>
        </div>
        <div className="cb">
          {patients.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--muted)', fontSize: '.78rem' }}>
              <div style={{ fontSize: '2rem', marginBottom: '.6rem' }}>👥</div>
              No patients yet. Patients will appear here once they book appointments with you.
            </div>
          ) : patients.map((p, i) => {
            const initials = (p.name || 'UK').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
            const isExpanded = expandedPatient === p.id;
            return (
              <div key={p.id} style={{ borderBottom: i < patients.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <div
                  onClick={() => setExpandedPatient(isExpanded ? null : p.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: '.85rem', padding: '.85rem 0', cursor: 'pointer', transition: 'background .15s' }}
                >
                  <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'linear-gradient(135deg,#3b0764,#6d28d9)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Playfair Display',serif", fontSize: '.78rem', fontWeight: 700, flexShrink: 0, border: '1.5px solid rgba(139,92,246,.28)' }}>{initials}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '.82rem', fontWeight: 600 }}>{p.name}</div>
                    <div style={{ fontSize: '.68rem', color: 'var(--muted)', display: 'flex', gap: '.8rem', marginTop: '.1rem' }}>
                      <span>{p.totalVisits} visit{p.totalVisits !== 1 ? 's' : ''}</span>
                      <span>Last: {formatDate(p.lastVisit)}</span>
                    </div>
                  </div>
                  {p.upcomingAppt && (
                    <span className={`chip chip-${p.upcomingAppt.status === 'confirmed' ? 'g' : 'y'}`} style={{ flexShrink: 0 }}>
                      {p.upcomingAppt.status === 'confirmed' ? '✓ Upcoming' : '⏳ Pending'} · {formatDate(p.upcomingAppt.date)}
                    </span>
                  )}
                  <span style={{ fontSize: '.7rem', color: 'var(--muted)', flexShrink: 0 }}>{isExpanded ? '▲' : '▼'}</span>
                </div>
                {isExpanded && (
                  <div style={{ paddingLeft: '3.8rem', paddingBottom: '.85rem' }}>
                    <div style={{ fontSize: '.68rem', fontWeight: 600, color: 'var(--lavender)', marginBottom: '.5rem' }}>Appointment History</div>
                    {p.appointments.map(a => {
                      const statusChip = a.status === 'confirmed' ? 'g' : a.status === 'pending' ? 'y' : a.status === 'completed' ? 'gr' : 'r';
                      const statusLabel = a.status === 'confirmed' ? '✓ Confirmed' : a.status === 'pending' ? '⏳ Pending' : a.status === 'completed' ? '✓ Completed' : '✕ Cancelled';
                      return (
                        <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: '.6rem', padding: '.4rem 0', borderBottom: '1px solid rgba(255,255,255,.04)' }}>
                          <span style={{ fontFamily: "'DM Mono',monospace", fontSize: '.68rem', color: 'var(--dim)', width: 75, flexShrink: 0 }}>{a.date || '--'}</span>
                          <span style={{ fontSize: '.7rem', color: 'var(--dim)', flex: 1 }}>{a.type || 'Appointment'}</span>
                          <span className={`chip chip-${statusChip}`} style={{ fontSize: '.5rem' }}>{statusLabel}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
