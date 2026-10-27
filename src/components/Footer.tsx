import React from 'react';
import { useHealthCenter } from '../context/HealthCenterContext';

import centerPhoto from '../assets/images/MR FLORES.png';

export const Footer: React.FC = () => {
  const { setActiveSection } = useHealthCenter();

  const handleNavClick = (id: string) => {
    setActiveSection(id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-[#173a37] text-white border-t border-[#173a37]">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 py-9">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-7">
          <div className="flex items-center gap-4">
            <img src={centerPhoto} alt="" className="h-14 w-14 rounded-full border border-white/15 object-cover" />
            <div>
              <div className="font-bold">Mayor Moises R. Flores Health Center</div>
            </div>
          </div>
          <nav aria-label="Footer navigation" className="flex flex-wrap gap-x-5 gap-y-3 text-sm text-white/80">
            <button onClick={() => handleNavClick('overview')} className="hover:text-white">HOME</button>
            <button onClick={() => handleNavClick('clinic-information')} className="hover:text-white">INFORMATION</button>
            <button onClick={() => handleNavClick('appointment-schedule')} className="hover:text-white">SCHEDULE</button>
            <button onClick={() => handleNavClick('services')} className="hover:text-white">SERVICES</button>
          </nav>
        </div>
        <div className="mt-7 pt-5 border-t border-white/15 text-xs text-white/60">
          <span>© {new Date().getFullYear()} Mayor Moises R. Flores Health Center</span>
        </div>
      </div>
    </footer>
  );
};
