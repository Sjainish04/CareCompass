// src/components/layout/Sidebar.jsx
import { useApp } from '../../hooks/useApp';
import { useAuthStore } from '../../stores/authStore';
import { NAV_PAT, NAV_PROV } from '../../data';

export default function Sidebar() {
  const { role, view, go, badgeCounts } = useApp();
  const user = useAuthStore(s => s.user);
  const logout = useAuthStore(s => s.logout);

  const userName = user?.profile?.full_name || user?.email?.split('@')[0] || (role === 'patient' ? 'Amara Nwosu' : 'Dr. Adeyemi');
  const userLang = user?.profile?.preferred_language || 'English';
  const initials = userName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  const ROLES = {
    patient:  { cls:'pat', sub:`Patient · ${userLang}`, lang:`🌐 ${userLang}`, grad:'linear-gradient(135deg,#3b0764,#6d28d9)' },
    provider: { cls:'prov', sub:'Provider · Scarborough', lang:'🏥 Scarborough Health', grad:'linear-gradient(135deg,#1e3a5f,#4f46e5)' },
  };
  const R   = ROLES[role] || ROLES.patient;
  const nav = role === 'patient' ? NAV_PAT : NAV_PROV;

  return (
    <aside style={{ width:'var(--sidebar-w)', flexShrink:0, background:'var(--surface)', borderRight:'1px solid var(--border)', display:'flex', flexDirection:'column', overflow:'hidden' }}>
      {/* Logo */}
      <div style={{ padding:'1.05rem 1.15rem .85rem', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', gap:'.58rem', flexShrink:0 }}>
        <div style={{ width:29, height:29, borderRadius:8, background:'linear-gradient(135deg,#6d28d9,#8b5cf6)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'.82rem', boxShadow:'0 2px 10px rgba(109,40,217,.45)' }}>✛</div>
        <div>
          <div style={{ fontFamily:"'Playfair Display',serif", fontSize:'.92rem', fontWeight:700 }}>CareCompass</div>
          <div style={{ fontSize:'.52rem', color:'var(--muted)', letterSpacing:'.05em', textTransform:'uppercase' }}>GTA Navigator</div>
        </div>
      </div>

      {/* User */}
      <div style={{ padding:'.7rem 1.05rem', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', gap:'.58rem', flexShrink:0 }}>
        <div style={{ width:32, height:32, borderRadius:'50%', background:R.grad, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'Playfair Display',serif", fontSize:'.75rem', fontWeight:700, border:'1.5px solid rgba(139,92,246,.28)', flexShrink:0 }}>{initials}</div>
        <div>
          <div style={{ fontSize:'.78rem', fontWeight:600, lineHeight:1.3 }}>{userName}</div>
          <div style={{ fontSize:'.57rem', color:'var(--amethyst)', marginTop:'.06rem' }}>{R.sub}</div>
          <div style={{ fontSize:'.56rem', color:'var(--muted)', marginTop:'.04rem' }}>{R.lang}</div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ padding:'.5rem', flex:1, overflowY:'auto' }}>
        {nav.map(section => (
          <div key={section.section}>
            <div style={{ fontSize:'.52rem', fontWeight:600, letterSpacing:'.13em', textTransform:'uppercase', color:'var(--muted)', padding:'0 .58rem', margin:'.5rem 0 .22rem' }}>{section.section}</div>
            {section.items.map(item => {
              const active = view === item.id;
              // Dynamic badge overrides for appointments and referrals
              let badge = item.badge;
              let bc = item.bc;
              if (item.id === 'p-appointments') {
                badge = badgeCounts.appointments > 0 ? String(badgeCounts.appointments) : item.badge;
                bc = badgeCounts.appointments > 0 ? 'g' : item.bc;
              } else if (item.id === 'p-referrals') {
                badge = badgeCounts.referrals > 0 ? String(badgeCounts.referrals) : item.badge;
                bc = badgeCounts.referrals > 0 ? 'y' : item.bc;
              }
              return (
                <div key={item.id} onClick={() => go(item.id)} data-id={item.id} style={{
                  display:'flex', alignItems:'center', gap:'.55rem',
                  padding:'.52rem .6rem', borderRadius:8, fontSize:'.76rem',
                  color: active ? 'var(--white)' : 'var(--dim)',
                  background: active ? 'rgba(109,40,217,.18)' : 'transparent',
                  border: `1px solid ${active ? 'rgba(139,92,246,.18)' : 'transparent'}`,
                  cursor:'pointer', marginBottom:'.06rem', transition:'all .18s', userSelect:'none',
                }}
                onMouseEnter={e => { if (!active) { e.currentTarget.style.background='rgba(139,92,246,.07)'; e.currentTarget.style.color='var(--white)'; }}}
                onMouseLeave={e => { if (!active) { e.currentTarget.style.background='transparent'; e.currentTarget.style.color='var(--dim)'; }}}
                >
                  <span style={{ fontSize:'.82rem', width:17, textAlign:'center', flexShrink:0 }}>{item.icon}</span>
                  {item.label}
                  {badge && (
                    <span style={{ marginLeft:'auto', padding:'.04rem .35rem', borderRadius:100, fontSize:'.54rem', fontWeight:700, background: bc==='g'?'var(--green)':bc==='r'?'var(--red)':bc==='y'?'var(--yellow)':'var(--violet)', color: bc==='y'?'#000':'var(--white)' }}>{badge}</span>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer with logout */}
      <div style={{ padding:'.7rem 1.05rem', borderTop:'1px solid var(--border)', flexShrink:0 }}>
        <button onClick={logout} style={{
          width:'100%', padding:'.42rem', borderRadius:7, border:'1px solid var(--border)',
          background:'rgba(255,255,255,.03)', color:'var(--muted)', fontFamily:"'DM Sans',sans-serif",
          fontSize:'.66rem', cursor:'pointer', transition:'all .2s', display:'flex', alignItems:'center', justifyContent:'center', gap:'.4rem',
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor='rgba(239,68,68,.3)'; e.currentTarget.style.color='var(--red)'; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.color='var(--muted)'; }}>
          Sign Out
        </button>
        <div style={{ fontSize:'.58rem', color:'var(--muted)', lineHeight:1.65, marginTop:'.5rem', textAlign:'center' }}>
          PHIPA · PIPEDA Compliant
        </div>
      </div>
    </aside>
  );
}
