import React from 'react';
import { useHealthCenter } from '../context/HealthCenterContext';
import { MapPin, CalendarDays, Clock } from 'lucide-react';
import centerPhoto from '../assets/images/MR FLORES.png';

export const Footer: React.FC = () => {
  const { t, setActiveSection, setBookingModalOpen } = useHealthCenter();

  const handleNavClick = (id: string) => {
    setActiveSection(id);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <footer className="bg-[#123b39] text-white">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 py-9">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-7">
          <div className="flex items-center gap-4">
            <img src={centerPhoto} alt="" className="w-14 h-14 rounded-md object-cover" />
            <div>
              <div className="font-bold">Mayor Moises R. Flores Health Center</div>
              <div className="mt-1 text-sm text-white/70">{t.footerDescription}</div>
              <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-200"><MapPin className="w-3.5 h-3.5" />Pateros, Metro Manila</div>
            </div>
          </div>
          <nav aria-label="Footer navigation" className="flex flex-wrap gap-x-5 gap-y-3 text-sm text-white/80">
            <button onClick={() => handleNavClick('overview')} className="hover:text-white">Home</button>
            <button onClick={() => handleNavClick('services')} className="hover:text-white">{t.navServices}</button>
            <button onClick={() => setBookingModalOpen(true)} className="inline-flex items-center gap-1.5 font-semibold text-white"><CalendarDays className="w-4 h-4" />Request appointment</button>
          </nav>
        </div>
        <div className="mt-7 pt-5 border-t border-white/15 flex items-center gap-2 text-xs text-white/60">
          <Clock className="w-3.5 h-3.5" />
          <span>Monday-Friday · 7:00 AM-4:00 PM</span>
          <span className="ml-auto">© {new Date().getFullYear()} Mayor Moises R. Flores Health Center</span>
        </div>
      </div>
    </footer>
  );
};
