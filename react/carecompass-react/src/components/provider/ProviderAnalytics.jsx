import { useState, useEffect } from 'react';
import { useApp } from '../../hooks/useApp';
import { apiGet } from '../../lib/api';

export default function ProviderAnalytics() {
  const { toast } = useApp();
  const [bars, setBars] = useState(false);
  const [analytics, setAnalytics] = useState(null);
  const [appointments, setAppointments] = useState([]);

  useEffect(() => {
    const t = setTimeout(() => setBars(true), 120);
    apiGet('/analytics/provider').then(setAnalytics).catch(() => {});
    apiGet('/appointments/provider/mine')
      .then(data => { if (Array.isArray(data)) setAppointments(data); })
      .catch(() => {});
    return () => clearTimeout(t);
  }, []);

  const mbarRows = analytics?.performanceMetrics ?? [
    ['Attendance', 'fill-g', '94%', 94],
    ['Referrals Done', 'fill-b', '88%', 88],
    ['No-Show Rate', 'fill-r', '6%', 6],
    ['Slot Recovery', 'fill-y', '78%', 78],
  ];
  const langRows = analytics?.languageMix ?? [
    ['Igbo', 28], ['Urdu', 22], ['Mandarin', 18], ['Tagalog', 14], ['Hindi', 11],
  ];

  const total = appointments.length;
  const confirmed = appointments.filter(a => a.status === 'confirmed').length;
  const cancelled = appointments.filter(a => a.status === 'cancelled').length;
  const pending = appointments.filter(a => a.status === 'pending').length;
  const approvalRate = total > 0 ? Math.round(((confirmed) / Math.max(confirmed + cancelled, 1)) * 100) : 0;

  // Weekly breakdown (last 4 weeks)
  const weeklyData = [];
  const now = new Date();
  for (let w = 3; w >= 0; w--) {
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay() - (w * 7));
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    const startStr = weekStart.toISOString().slice(0, 10);
    const endStr = weekEnd.toISOString().slice(0, 10);
    const count = appointments.filter(a => a.date >= startStr && a.date <= endStr).length;
    const label = weekStart.toLocaleDateString('en', { month: 'short', day: 'numeric' });
    weeklyData.push({ label, count });
  }
  const maxWeekly = Math.max(...weeklyData.map(w => w.count), 1);

  return (
    <div className="content fade-up">
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '.7rem', marginBottom: '.7rem' }}>
        {[
          ['📅', 'Total Appointments', total, 'var(--amethyst)'],
          ['✅', 'Approval Rate', `${approvalRate}%`, 'var(--green)'],
          ['⏳', 'Pending', pending, '#d97706'],
          ['✕', 'Cancelled', cancelled, 'var(--red)'],
        ].map(([ico, lbl, num, color], i) => (
          <div key={i} className="sc">
            <div style={{ fontSize: '1.2rem', marginBottom: '.3rem' }}>{ico}</div>
            <div className="sc-num" style={{ color }}>{num}</div>
            <div className="sc-lbl">{lbl}</div>
          </div>
        ))}
      </div>

      <div className="g2">
        {/* Performance Metrics */}
        <div className="card">
          <div className="ch"><div className="ch-title">📊 Clinic Performance</div></div>
          <div className="cb">
            {mbarRows.map(([lbl, cls, val, w]) => (
              <div key={lbl} style={{ display: 'flex', alignItems: 'center', gap: '.65rem', marginBottom: '.62rem' }}>
                <span style={{ fontSize: '.68rem', color: 'var(--dim)', width: 90, flexShrink: 0 }}>{lbl}</span>
                <div style={{ flex: 1, background: 'rgba(255,255,255,.06)', borderRadius: 100, height: 5, overflow: 'hidden' }}>
                  <div className={`pfill ${cls}`} style={{ width: bars ? `${w}%` : '0%', height: '100%', transition: 'width 1.2s cubic-bezier(.4,0,.2,1)' }} />
                </div>
                <span style={{ fontFamily: "'DM Mono',monospace", fontSize: '.68rem', color: 'var(--white)', width: 30, textAlign: 'right', flexShrink: 0 }}>{val}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Language Mix */}
        <div className="card">
          <div className="ch"><div className="ch-title">🌐 Patient Language Mix</div></div>
          <div className="cb">
            {langRows.map(([lang, pct]) => (
              <div key={lang} style={{ display: 'flex', alignItems: 'center', gap: '.6rem', marginBottom: '.55rem' }}>
                <span style={{ fontSize: '.68rem', color: 'var(--dim)', width: 72, flexShrink: 0 }}>{lang}</span>
                <div style={{ flex: 1, background: 'rgba(255,255,255,.06)', borderRadius: 100, height: 4, overflow: 'hidden' }}>
                  <div style={{ height: '100%', borderRadius: 100, background: 'linear-gradient(90deg,var(--violet),var(--amethyst))', width: bars ? `${pct}%` : '0%', transition: 'width 1.2s cubic-bezier(.4,0,.2,1)' }} />
                </div>
                <span style={{ fontFamily: "'DM Mono',monospace", fontSize: '.65rem', color: 'var(--muted)', width: 28, textAlign: 'right', flexShrink: 0 }}>{pct}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Weekly Trend */}
      <div className="card" style={{ marginTop: '.7rem' }}>
        <div className="ch"><div className="ch-title">📈 Weekly Appointment Trend</div></div>
        <div className="cb">
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '1rem', height: 120, padding: '.5rem 0' }}>
            {weeklyData.map((w, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '.3rem' }}>
                <span style={{ fontFamily: "'DM Mono',monospace", fontSize: '.65rem', color: 'var(--white)' }}>{w.count}</span>
                <div style={{
                  width: '100%', maxWidth: 48, borderRadius: '6px 6px 0 0',
                  background: 'linear-gradient(180deg,var(--amethyst),var(--violet))',
                  height: bars ? `${Math.max((w.count / maxWeekly) * 80, 4)}px` : '0px',
                  transition: 'height 1s cubic-bezier(.4,0,.2,1)',
                }} />
                <span style={{ fontSize: '.58rem', color: 'var(--muted)' }}>{w.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
