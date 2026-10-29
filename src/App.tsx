import React, { useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { HealthCenterProvider, useHealthCenter } from './context/HealthCenterContext';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { RouteFinder } from './components/RouteFinder';
import { ServicesSection } from './components/ServicesSection';
import { PublicInformation } from './components/PublicInformation';
import { AppointmentSchedule } from './components/AppointmentSchedule';
import { Footer } from './components/Footer';
import { OutreachBookingModal } from './components/OutreachBookingModal';
import { CheckCircle2, Clock3 } from 'lucide-react';
import { auth } from './firebase';
import { AuthScreen } from './components/AuthScreen';
import { AdminPanel } from './components/AdminPanel';
import { UserAppointmentChat } from './components/UserAppointmentChat';
import patientFlowDiagram from './assets/images/DIAGRAM xd.png';

const AppContent: React.FC<{ user: User }> = ({ user }) => {
  const { activeSection, notificationToast, setNotificationToast, appointmentRequestAvailability, language } = useHealthCenter();

  useEffect(() => {
    const handleStatusChange = (event: Event) => {
      const detail = (event as CustomEvent<{ status: string; referenceCode: string }>).detail;
      setNotificationToast(detail.status === 'confirmed'
        ? `Appointment ${detail.referenceCode} approved.`
        : detail.status === 'completed'
          ? `Appointment ${detail.referenceCode} marked completed and removed from the public schedule.`
        : detail.status === 'rejected' || detail.status === 'cancelled'
          ? `Appointment ${detail.referenceCode} ${detail.status}.`
          : `Appointment ${detail.referenceCode} updated.`);
    };
    window.addEventListener('appointment-status-change', handleStatusChange);
    return () => window.removeEventListener('appointment-status-change', handleStatusChange);
  }, [setNotificationToast]);

  return (
    <div className="public-page-shell min-h-screen flex flex-col text-[#374151] antialiased selection:bg-[#eaf3ee] selection:text-[#0f4d3c]">
      <Header />
      {appointmentRequestAvailability === 'pending' && (
        <div role="status" aria-live="polite" className="border-b border-amber-200 bg-amber-50 px-4 py-3 text-amber-950">
          <div className="mx-auto flex max-w-7xl items-start gap-2.5 text-sm">
            <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
            <p>{language === 'fil'
              ? 'Sinusuri pa ng kawani ang iyong appointment request. Mag-a-update ang abisong ito kapag may aksyon na.'
              : 'Your appointment request is under review. This notice will update when clinic staff respond.'}</p>
          </div>
        </div>
      )}

      <main key={activeSection} className="public-view-enter flex-1">
        {activeSection === 'clinic-information' ? (
          <PublicInformation />
        ) : activeSection === 'appointment-schedule' ? (
          <AppointmentSchedule />
        ) : activeSection === 'services' ? (
          <ServicesSection />
        ) : (
          <>
            <Hero />
            <RouteFinder />
            <section aria-label="Patient flow diagram" className="site-section-bg section-enter border-t border-[#dce7e1] py-8 sm:py-10">
              <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
                <img
                  src={patientFlowDiagram}
                  alt="Patient flow and visit information: registration, initial screening, consultation and follow-up, and clinic-specific visit guidance."
                  loading="lazy"
                  decoding="async"
                  className="mx-auto block h-auto w-full max-w-6xl object-contain"
                />
              </div>
            </section>
          </>
        )}
      </main>

      <Footer />

      <UserAppointmentChat />
      <OutreachBookingModal user={user} />

      {notificationToast && (
        <div className="fixed bottom-5 right-5 z-50 bg-[#0f4d3c] text-white px-4 py-3 rounded-md shadow-lg border border-white/10 text-sm font-semibold flex items-center gap-2 max-w-sm animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
          <span>{notificationToast}</span>
        </div>
      )}
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [accountRole, setAccountRole] = useState<'checking' | 'admin' | 'user' | 'error'>('checking');
  const [roleError, setRoleError] = useState('');

  useEffect(() => onAuthStateChanged(auth, (nextUser) => {
    setUser(nextUser);
    setAuthLoading(false);
  }), []);

  useEffect(() => {
    if (!user) {
      setAccountRole('checking');
      setRoleError('');
      return;
    }

    let active = true;
    setAccountRole('checking');
    void (async () => {
      try {
        const token = await user.getIdToken();
        const response = await fetch('/api/admin?mode=role', {
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store',
        });
        const data = await response.json() as { role?: string; error?: string };
        if (!response.ok || (data.role !== 'admin' && data.role !== 'user')) {
          throw new Error(data.error || 'Your account role could not be verified.');
        }
        if (!active) return;
        setAccountRole(data.role);
        setRoleError('');
        if (data.role === 'user' && window.location.pathname === '/admin') {
          window.history.replaceState(null, '', '/');
        }
      } catch (caught) {
        if (!active) return;
        setRoleError(caught instanceof Error ? caught.message : 'Your account role could not be verified.');
        setAccountRole('error');
      }
    })();

    return () => {
      active = false;
    };
  }, [user]);

  if (authLoading) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-[#eef2ee] text-sm font-bold text-[#173a37]">
        Loading...
      </main>
    );
  }

  if (!user) return <AuthScreen />;

  if (accountRole === 'checking') {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-[#eef2ee] text-sm font-bold text-[#173a37]">
        Checking account access...
      </main>
    );
  }

  if (accountRole === 'error') {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-[#eef2ee] px-5 text-center text-[#173a37]">
        <p role="alert" className="max-w-md text-sm">{roleError}</p>
        <button type="button" onClick={() => void auth.signOut()} className="border border-[#b9c7be] px-4 py-2 text-sm font-bold">Sign out and try again</button>
      </main>
    );
  }

  if (accountRole === 'admin') return <AdminPanel />;

  return (
    <HealthCenterProvider>
      <AppContent user={user} />
    </HealthCenterProvider>
  );
}
