import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';

export default function ProtectedRoute() {
  const user = useAuthStore(s => s.user);
  const loading = useAuthStore(s => s.loading);

  if (loading) {
    return (
      <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--bg)' }}>
        <div style={{ textAlign:'center' }}>
          <div className="pipe-spin" style={{ width:32, height:32, margin:'0 auto .75rem' }} />
          <div style={{ fontSize:'.78rem', color:'var(--muted)' }}>Loading...</div>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  return <Outlet />;
}
