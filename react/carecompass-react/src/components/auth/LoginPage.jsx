import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';

export default function LoginPage() {
  const navigate = useNavigate();
  const login = useAuthStore(s => s.login);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--bg)', padding:'1rem' }}>
      <div style={{ width:'100%', maxWidth:400, background:'var(--card)', border:'1px solid var(--border)', borderRadius:16, padding:'2rem' }}>
        <div style={{ textAlign:'center', marginBottom:'1.5rem' }}>
          <div style={{ width:42, height:42, borderRadius:12, background:'linear-gradient(135deg,#6d28d9,#8b5cf6)', display:'inline-flex', alignItems:'center', justifyContent:'center', fontSize:'1.1rem', marginBottom:'.75rem', boxShadow:'0 2px 10px rgba(109,40,217,.45)' }}>✛</div>
          <div style={{ fontFamily:"'Playfair Display',serif", fontSize:'1.3rem', fontWeight:700 }}>CareCompass</div>
          <div style={{ fontSize:'.65rem', color:'var(--muted)', letterSpacing:'.05em', textTransform:'uppercase', marginTop:'.2rem' }}>GTA Healthcare Navigator</div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mfield">
            <label className="mlbl">Email</label>
            <input className="minput" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" required />
          </div>
          <div className="mfield">
            <label className="mlbl">Password</label>
            <input className="minput" type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Your password" required />
          </div>

          {error && <div style={{ padding:'.5rem .75rem', borderRadius:8, background:'rgba(239,68,68,.12)', border:'1px solid rgba(239,68,68,.2)', color:'var(--red)', fontSize:'.72rem', marginBottom:'.75rem' }}>{error}</div>}

          <button className="mcta" type="submit" disabled={loading} style={{ opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div style={{ textAlign:'center', marginTop:'1rem', fontSize:'.72rem', color:'var(--muted)' }}>
          Don't have an account? <Link to="/signup" style={{ color:'var(--lavender)', textDecoration:'none' }}>Sign up</Link>
        </div>
      </div>
    </div>
  );
}
