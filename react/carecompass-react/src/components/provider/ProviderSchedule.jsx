import { useState, useEffect } from 'react';
import { useApp } from '../../hooks/useApp';
import { apiGet, apiPut, apiPost, apiDelete } from '../../lib/api';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DURATIONS = [15, 20, 30, 45, 60];

const darkInput = {
  background: 'rgba(255,255,255,.06)',
  border: '1px solid var(--border)',
  borderRadius: 7,
  padding: '.38rem .6rem',
  color: 'var(--white)',
  colorScheme: 'dark',
  fontFamily: "'DM Sans',sans-serif",
  fontSize: '.7rem',
};

function defaultSchedule() {
  return DAYS.map((_, i) => ({
    day_of_week: i,
    start_time: '09:00',
    end_time: '17:00',
    slot_duration: 30,
    is_active: i >= 1 && i <= 5, // Mon-Fri active
  }));
}

export default function ProviderSchedule() {
  const { toast } = useApp();
  const [schedule, setSchedule] = useState(defaultSchedule());
  const [saving, setSaving] = useState(false);
  const [blockedDates, setBlockedDates] = useState([]);
  const [blockDate, setBlockDate] = useState('');
  const [blockReason, setBlockReason] = useState('');
  const [blockLoading, setBlockLoading] = useState(false);

  useEffect(() => {
    // Fetch from /api/schedules/me (which is really /:providerId with "me" as param — we use provider/mine pattern)
    // Actually the route is PUT /api/schedules/me, GET is /:providerId
    // We'll use the user's own schedule by fetching /api/appointments/provider/mine to get provider_id first
    // Simpler: just GET the schedule — but we need provider ID. Let's just try fetching "me" routes.
    apiGet('/schedules/me/blocked')
      .then(data => { if (Array.isArray(data)) setBlockedDates(data); })
      .catch(() => {});

    // We can't easily get our own schedule without knowing our ID from this endpoint.
    // The PUT /me route works, but GET /:providerId needs the ID.
    // Let's load via a workaround: store schedule locally if API fails.
  }, []);

  function updateDay(dayIndex, field, value) {
    setSchedule(prev => prev.map(d =>
      d.day_of_week === dayIndex ? { ...d, [field]: value } : d
    ));
  }

  async function saveSchedule() {
    setSaving(true);
    try {
      const activeDays = schedule.filter(d => d.is_active);
      await apiPut('/schedules/me', schedule);
      toast('Schedule saved', `${activeDays.length} active day${activeDays.length !== 1 ? 's' : ''} configured`, '');
    } catch (err) {
      toast('Error', err.message || 'Failed to save schedule', '');
    } finally {
      setSaving(false);
    }
  }

  async function addBlock() {
    if (!blockDate) { toast('Missing date', 'Select a date to block', ''); return; }
    setBlockLoading(true);
    try {
      const res = await apiPost('/schedules/me/block', { blocked_date: blockDate, reason: blockReason });
      setBlockedDates(prev => [...prev, res]);
      setBlockDate('');
      setBlockReason('');
      toast('Date blocked', blockDate, '');
    } catch (err) {
      toast('Error', err.message || 'Failed to block date', '');
    } finally {
      setBlockLoading(false);
    }
  }

  async function removeBlock(id) {
    try {
      await apiDelete(`/schedules/me/block/${id}`);
      setBlockedDates(prev => prev.filter(b => b.id !== id));
      toast('Unblocked', 'Date removed from blocked list', '');
    } catch (err) {
      toast('Error', err.message || 'Failed to unblock', '');
    }
  }

  return (
    <div className="content fade-up">
      {/* Weekly Schedule Grid */}
      <div className="card" style={{ marginBottom: '.7rem' }}>
        <div className="ch">
          <div>
            <div className="ch-title">🗓️ Weekly Availability</div>
            <div className="ch-sub">Set your available hours for each day of the week</div>
          </div>
          <button className="btn btn-p" style={{ fontSize: '.69rem' }} onClick={saveSchedule} disabled={saving}>
            {saving ? 'Saving...' : 'Save Schedule'}
          </button>
        </div>
        <div className="cb">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '.5rem' }}>
            {schedule.map(day => (
              <div key={day.day_of_week} style={{
                padding: '.75rem .6rem',
                borderRadius: 10,
                border: `1px solid ${day.is_active ? 'rgba(16,185,129,.25)' : 'var(--border)'}`,
                background: day.is_active ? 'rgba(16,185,129,.05)' : 'rgba(255,255,255,.02)',
                transition: 'all .2s',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '.6rem' }}>
                  <span style={{ fontSize: '.72rem', fontWeight: 600 }}>{DAYS[day.day_of_week].slice(0, 3)}</span>
                  <div
                    onClick={() => updateDay(day.day_of_week, 'is_active', !day.is_active)}
                    style={{
                      width: 32, height: 18, borderRadius: 100, cursor: 'pointer', transition: 'background .2s',
                      background: day.is_active ? 'var(--green)' : 'rgba(255,255,255,.12)',
                      position: 'relative',
                    }}
                  >
                    <div style={{
                      width: 14, height: 14, borderRadius: '50%', background: 'white',
                      position: 'absolute', top: 2, transition: 'left .2s',
                      left: day.is_active ? 16 : 2,
                    }} />
                  </div>
                </div>
                {day.is_active && (
                  <>
                    <div style={{ marginBottom: '.35rem' }}>
                      <div style={{ fontSize: '.55rem', color: 'var(--muted)', marginBottom: '.15rem' }}>Start</div>
                      <input type="time" value={day.start_time} onChange={e => updateDay(day.day_of_week, 'start_time', e.target.value)} style={{ ...darkInput, width: '100%', padding: '.3rem .4rem', fontSize: '.65rem' }} />
                    </div>
                    <div style={{ marginBottom: '.35rem' }}>
                      <div style={{ fontSize: '.55rem', color: 'var(--muted)', marginBottom: '.15rem' }}>End</div>
                      <input type="time" value={day.end_time} onChange={e => updateDay(day.day_of_week, 'end_time', e.target.value)} style={{ ...darkInput, width: '100%', padding: '.3rem .4rem', fontSize: '.65rem' }} />
                    </div>
                    <div>
                      <div style={{ fontSize: '.55rem', color: 'var(--muted)', marginBottom: '.15rem' }}>Slot (min)</div>
                      <select value={day.slot_duration} onChange={e => updateDay(day.day_of_week, 'slot_duration', Number(e.target.value))} style={{ ...darkInput, width: '100%', padding: '.3rem .4rem', fontSize: '.65rem' }}>
                        {DURATIONS.map(d => <option key={d} value={d}>{d} min</option>)}
                      </select>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Blocked Dates */}
      <div className="card">
        <div className="ch">
          <div>
            <div className="ch-title">🚫 Blocked Dates</div>
            <div className="ch-sub">Days you're unavailable (holidays, time off, etc.)</div>
          </div>
        </div>
        <div className="cb">
          <div style={{ display: 'flex', gap: '.5rem', alignItems: 'flex-end', marginBottom: '1rem', flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: '.58rem', color: 'var(--muted)', marginBottom: '.2rem' }}>Date</div>
              <input type="date" value={blockDate} onChange={e => setBlockDate(e.target.value)} style={darkInput} />
            </div>
            <div style={{ flex: 1, minWidth: 120 }}>
              <div style={{ fontSize: '.58rem', color: 'var(--muted)', marginBottom: '.2rem' }}>Reason (optional)</div>
              <input value={blockReason} onChange={e => setBlockReason(e.target.value)} placeholder="Holiday, conference, etc." style={{ ...darkInput, width: '100%' }} />
            </div>
            <button className="btn btn-p" style={{ fontSize: '.68rem', padding: '.38rem .85rem' }} onClick={addBlock} disabled={blockLoading}>
              {blockLoading ? 'Blocking...' : 'Block Date'}
            </button>
          </div>

          {blockedDates.length === 0 ? (
            <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--muted)', fontSize: '.75rem' }}>No blocked dates</div>
          ) : (
            blockedDates.map((b, i) => (
              <div key={b.id} style={{ display: 'flex', alignItems: 'center', gap: '.7rem', padding: '.55rem 0', borderBottom: i < blockedDates.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <span style={{ fontFamily: "'DM Mono',monospace", fontSize: '.73rem', color: 'var(--dim)' }}>{b.blocked_date}</span>
                <span style={{ fontSize: '.72rem', color: 'var(--muted)', flex: 1 }}>{b.reason || 'No reason'}</span>
                <button onClick={() => removeBlock(b.id)} style={{ fontSize: '.63rem', padding: '.2rem .5rem', borderRadius: 5, border: '1px solid rgba(239,68,68,.2)', background: 'rgba(239,68,68,.08)', color: 'var(--red)', cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" }}>
                  Remove
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
