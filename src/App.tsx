import React from 'react';
import { HealthCenterProvider, useHealthCenter } from './context/HealthCenterContext';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { RouteFinder } from './components/RouteFinder';
import { ServicesSection } from './components/ServicesSection';
import { PublicInformation } from './components/PublicInformation';
import { Footer } from './components/Footer';
import { OutreachBookingModal } from './components/OutreachBookingModal';
import { CheckCircle2 } from 'lucide-react';

const AppContent: React.FC = () => {
  const { notificationToast } = useHealthCenter();

  return (
    <div className="min-h-screen flex flex-col bg-[#f4f6f3] text-[#1a2b29] antialiased selection:bg-[#dce8df] selection:text-[#123b39]">
      <Header />

      <main className="flex-1">
        <Hero />
        <RouteFinder />
        <PublicInformation />
        <ServicesSection />
      </main>

      <Footer />

      <OutreachBookingModal />

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
  return (
    <HealthCenterProvider>
      <AppContent />
    </HealthCenterProvider>
  );
}
