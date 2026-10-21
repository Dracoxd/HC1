import React from 'react';
import { HealthCenterProvider, useHealthCenter } from './context/HealthCenterContext';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { ServicesSection } from './components/ServicesSection';
import { StaffDirectory } from './components/StaffDirectory';
import { OutreachSection } from './components/OutreachSection';
import { OutreachBookingModal } from './components/OutreachBookingModal';
import { NewsSection } from './components/NewsSection';
import { PatientPortal } from './components/PatientPortal';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { ContactSection } from './components/ContactSection';
import { Footer } from './components/Footer';
import { CheckCircle2 } from 'lucide-react';

const AppContent: React.FC = () => {
  const { notificationToast } = useHealthCenter();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800 antialiased selection:bg-teal-700 selection:text-white">
      {/* Top Header */}
      <Header />

      {/* Main Content Sections */}
      <main className="flex-1">
        <Hero />
        <ServicesSection />
        <StaffDirectory />
        <OutreachSection />
        <NewsSection />
        <PatientPortal />
        <AnalyticsDashboard />
        <ContactSection />
      </main>

      {/* Footer */}
      <Footer />

      {/* Booking Modal */}
      <OutreachBookingModal />

      {/* Global Toast Notification */}
      {notificationToast && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl border border-slate-700 text-xs font-medium flex items-center gap-2 max-w-sm animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
          <span>{notificationToast}</span>
        </div>
      )}
    </div>
  );
};

export default function App() {
  return (
    <HealthCenterProvider>
      <AppContent />
    </HealthCenterProvider>
  );
}
