// src/hooks/useApp.jsx
import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import { apiGet } from '../lib/api';

const AppCtx = createContext(null);

const PATIENT_VIEWS = new Set([
  'p-overview','p-journey','p-appointments','p-referrals',
  'p-navigator','p-records','find-care','ai-translation','ai-recorder','ai-cdisc','settings'
]);
const PROVIDER_VIEWS = new Set([
  'prov-overview','ai-translation','ai-recorder','ai-cdisc','settings'
]);

function defaultViewForRole(r) {
  return r === 'provider' ? 'prov-overview' : 'p-overview';
}

function allowedForRole(r) {
  return r === 'provider' ? PROVIDER_VIEWS : PATIENT_VIEWS;
}

export function AppProvider({ children }) {
  // Subscribe to user object so we re-render when login/logout happens
  const user = useAuthStore(s => s.user);
  const role = user?.profile?.role || 'patient';

  const [view, setView]      = useState(() => defaultViewForRole(role));
  const [toasts, setToasts]  = useState([]);
  const [modal, setModal]    = useState(null);
  const toastId = useRef(0);

  // Live badge counts (fetched from API)
  const [badgeCounts, setBadgeCounts] = useState({ appointments: 0, referrals: 0 });

  const refreshBadgeCounts = useCallback(() => {
    apiGet('/appointments')
      .then(data => {
        if (Array.isArray(data)) {
          const upcoming = data.filter(a => a.status !== 'completed' && a.status !== 'cancelled');
          setBadgeCounts(prev => ({ ...prev, appointments: upcoming.length }));
        }
      })
      .catch(() => {});
    apiGet('/referrals')
      .then(data => {
        const pending = data?.pendingCount ?? data?.referrals?.filter(r => r.chip === 'y')?.length ?? 0;
        const active = data?.activeCount ?? data?.referrals?.length ?? 0;
        setBadgeCounts(prev => ({ ...prev, referrals: active }));
      })
      .catch(() => {});
  }, []);

  // Fetch badge counts on mount and on appointment changes
  useEffect(() => {
    if (user) refreshBadgeCounts();
  }, [user, refreshBadgeCounts]);

  useEffect(() => {
    const h = () => refreshBadgeCounts();
    window.addEventListener('appointments:refresh', h);
    return () => window.removeEventListener('appointments:refresh', h);
  }, [refreshBadgeCounts]);

  // When role changes (login/logout/profile load), reset view to role default
  // if current view is not allowed for the new role
  const prevRole = useRef(role);
  useEffect(() => {
    if (prevRole.current !== role) {
      prevRole.current = role;
      setView(prev => {
        if (allowedForRole(role).has(prev)) return prev;
        return defaultViewForRole(role);
      });
    }
  }, [role]);

  const go = useCallback((id) => {
    if (allowedForRole(role).has(id)) {
      setView(id);
    } else {
      setView(defaultViewForRole(role));
    }
  }, [role]);

  const toast = useCallback((title, sub = '', icon = '') => {
    const id = ++toastId.current;
    setToasts(t => [...t, { id, title, sub, icon }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3400);
  }, []);

  const openModal  = useCallback((id, props = {}) => setModal({ id, props }), []);
  const closeModal = useCallback(() => setModal(null), []);

  return (
    <AppCtx.Provider value={{ role, view, go, toast, toasts, modal, openModal, closeModal, badgeCounts, refreshBadgeCounts }}>
      {children}
    </AppCtx.Provider>
  );
}

export const useApp = () => useContext(AppCtx);
