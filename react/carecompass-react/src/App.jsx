// src/App.jsx
import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useApp } from './hooks/useApp';
import { useAuthStore } from './stores/authStore';
import Sidebar  from './components/layout/Sidebar';
import Topbar   from './components/layout/Topbar';
import ProtectedRoute from './components/layout/ProtectedRoute';
import LoginPage  from './components/auth/LoginPage';
import SignupPage from './components/auth/SignupPage';
import { ToastContainer, ModalHost } from './components/shared/Toast';

import PatientOverview   from './components/patient/PatientOverview';
import Navigator         from './components/patient/Navigator';
import FindCare          from './components/patient/FindCare';
import { AITranslation } from './components/ai/AITranslation';
import { AIRecorder }    from './components/ai/AIRecorder';
import { AICDISC }       from './components/ai/AICDISC';

import {
  PatientJourney, PatientAppointments,
  PatientReferrals, PatientRecords,
  SettingsView,
} from './components/Views';

import ProviderAppointments from './components/provider/ProviderAppointments';
import ProviderSchedule     from './components/provider/ProviderSchedule';
import ProviderPatients     from './components/provider/ProviderPatients';
import ProviderAnalytics    from './components/provider/ProviderAnalytics';

// Views that use full-height flex layout (no scroll wrapper)
const FLEX_VIEWS = new Set(['find-care', 'p-navigator']);

function AppShell() {
  const { role, view } = useApp();

  const VIEW_MAP = {
    'p-overview':     <PatientOverview/>,
    'p-journey':      <PatientJourney/>,
    'p-appointments': <PatientAppointments/>,
    'p-referrals':    <PatientReferrals/>,
    'p-navigator':    <Navigator/>,
    'p-records':      <PatientRecords/>,
    'find-care':      <FindCare/>,
    'prov-appointments': <ProviderAppointments/>,
    'prov-schedule':     <ProviderSchedule/>,
    'prov-patients':     <ProviderPatients/>,
    'prov-analytics':    <ProviderAnalytics/>,
    'ai-translation': <AITranslation/>,
    'ai-recorder':    <AIRecorder/>,
    'ai-cdisc':       <AICDISC/>,
    'settings':       <SettingsView/>,
  };

  const defaultView = role === 'provider' ? <ProviderAppointments/> : <PatientOverview/>;
  const content = VIEW_MAP[view] || defaultView;

  return (
    <>
      <div className="shell">
        <Sidebar/>
        <div className="main">
          <Topbar/>
          {FLEX_VIEWS.has(view)
            ? content
            : <div style={{ flex:1, overflowY:'auto' }}>{content}</div>
          }
        </div>
      </div>
      <ToastContainer/>
      <ModalHost/>
    </>
  );
}

function AuthListener() {
  const logout = useAuthStore(s => s.logout);
  useEffect(() => {
    const handler = () => logout();
    window.addEventListener('auth:unauthorized', handler);
    return () => window.removeEventListener('auth:unauthorized', handler);
  }, [logout]);
  return null;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthListener />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/*" element={<AppShell />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
