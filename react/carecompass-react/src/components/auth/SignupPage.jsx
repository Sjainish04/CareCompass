import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';

export default function SignupPage() {
  const navigate = useNavigate();
  const signup = useAuthStore(s => s.signup);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('patient');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signup(email, password, fullName, role);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--bg)', padding:'1rem' }}>
      <div style={{ width:'100%', maxWidth:420, background:'var(--card)', border:'1px solid var(--border)', borderRadius:16, padding:'2rem' }}>
        <div style={{ textAlign:'center', marginBottom:'1.5rem' }}>
          <div style={{ width:42, height:42, borderRadius:12, background:'linear-gradient(135deg,#6d28d9,#8b5cf6)', display:'inline-flex', alignItems:'center', justifyContent:'center', fontSize:'1.1rem', marginBottom:'.75rem', boxShadow:'0 2px 10px rgba(109,40,217,.45)' }}>✛</div>
          <div style={{ fontFamily:"'Playfair Display',serif", fontSize:'1.3rem', fontWeight:700 }}>Create Account</div>
          <div style={{ fontSize:'.65rem', color:'var(--muted)', marginTop:'.2rem' }}>Join CareCompass</div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mfield">
            <label className="mlbl">Full Name</label>
            <input className="minput" value={fullName} onChange={e=>setFullName(e.target.value)} placeholder="Your full name" required />
          </div>
          <div className="mfield">
            <label className="mlbl">Email</label>
            <input className="minput" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" required />
          </div>
          <div className="mfield">
            <label className="mlbl">Password</label>
            <input className="minput" type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Min 6 characters" required minLength={6} />
          </div>
          <div className="mfield">
            <label className="mlbl">I am a</label>
            <div style={{ display:'flex', gap:'.5rem' }}>
              {['patient','provider'].map(r => (
                <button key={r} type="button" onClick={() => setRole(r)} style={{
                  flex:1, padding:'.5rem', borderRadius:8, border:`1px solid ${role===r ? 'var(--bh)' : 'var(--border)'}`,
                  background: role===r ? 'rgba(109,40,217,.18)' : 'transparent',
                  color: role===r ? 'var(--white)' : 'var(--muted)',
                  fontFamily:"'DM Sans',sans-serif", fontSize:'.72rem', fontWeight:500, cursor:'pointer',
                }}>{r.charAt(0).toUpperCase()+r.slice(1)}</button>
              ))}
            </div>
          </div>

          {error && <div style={{ padding:'.5rem .75rem', borderRadius:8, background:'rgba(239,68,68,.12)', border:'1px solid rgba(239,68,68,.2)', color:'var(--red)', fontSize:'.72rem', marginBottom:'.75rem' }}>{error}</div>}

          <button className="mcta" type="submit" disabled={loading} style={{ opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <div style={{ textAlign:'center', marginTop:'1rem', fontSize:'.72rem', color:'var(--muted)' }}>
          Already have an account? <Link to="/login" style={{ color:'var(--lavender)', textDecoration:'none' }}>Sign in</Link>
        </div>
      </div>
    </div>
  );
}
