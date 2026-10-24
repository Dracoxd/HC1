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
import { CheckCircle2 } from 'lucide-react';
import { auth } from './firebase';
import { AuthScreen } from './components/AuthScreen';
import { AdminPanel } from './components/AdminPanel';
import { UserAppointmentChat } from './components/UserAppointmentChat';

const AppContent: React.FC<{ user: User }> = ({ user }) => {
  const { notificationToast, setNotificationToast } = useHealthCenter();

  useEffect(() => {
    const handleStatusChange = (event: Event) => {
      const detail = (event as CustomEvent<{ status: string; referenceCode: string }>).detail;
      setNotificationToast(detail.status === 'confirmed'
        ? `Appointment ${detail.referenceCode} approved.`
        : detail.status === 'rejected' || detail.status === 'cancelled'
          ? `Appointment ${detail.referenceCode} ${detail.status}.`
          : `Appointment ${detail.referenceCode} updated.`);
    };
    window.addEventListener('appointment-status-change', handleStatusChange);
    return () => window.removeEventListener('appointment-status-change', handleStatusChange);
  }, [setNotificationToast]);

  return (
    <div className="min-h-screen flex flex-col bg-[#f4f6f3] text-[#1a2b29] antialiased selection:bg-[#dce8df] selection:text-[#123b39]">
      <Header />

      <main className="flex-1">
        <Hero />
        <RouteFinder />
        <PublicInformation />
        <AppointmentSchedule />
        <UserAppointmentChat />
        <ServicesSection />
      </main>

      <Footer />

      <OutreachBookingModal user={user} />

      {notificationToast && (
        <div className="fixed bottom-5 right-5 z-50 bg-[#173a37] text-white px-4 py-3 rounded-md shadow-lg border border-white/10 text-sm font-semibold flex items-center gap-2 max-w-sm animate-fade-in">
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

  useEffect(() => onAuthStateChanged(auth, (nextUser) => {
    setUser(nextUser);
    setAuthLoading(false);
  }), []);

  if (authLoading) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-[#eef2ee] text-sm font-bold text-[#173a37]">
        Loading...
      </main>
    );
  }

  if (!user) return <AuthScreen />;

  if (window.location.pathname === '/admin') return <AdminPanel />;

  return (
    <HealthCenterProvider>
      <AppContent user={user} />
    </HealthCenterProvider>
  );
}
