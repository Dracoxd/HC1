import React from 'react';
import { useHealthCenter } from '../context/HealthCenterContext';
import { Clock3, MapPin, Phone } from 'lucide-react';

import centerPhoto from '../assets/images/MR FLORES.png';

export const Footer: React.FC = () => {
  const { setActiveSection, siteContent } = useHealthCenter();
  const { clinicHours, clinicAddress, contactPhone } = siteContent.settings;

  const handleNavClick = (id: string) => {
    setActiveSection(id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="footer-enter footer-section border-t border-white/10 bg-[#0f4d3c] text-white">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">
        <div className="footer-row">
          <div className="footer-col footer-logo">
            <img src={centerPhoto} alt="" className="h-14 w-14 rounded-full border border-white/15 object-cover" />
            Mayor Moises R. Flores Health Center
          </div>
          <div className="footer-col footer-links">
            <button onClick={() => handleNavClick('overview')} className="hover:underline text-white/90">Home</button>
            <button onClick={() => handleNavClick('clinic-information')} className="hover:underline text-white/90">Information</button>
            <button onClick={() => handleNavClick('appointment-schedule')} className="hover:underline text-white/90">Schedule</button>
            <button onClick={() => handleNavClick('services')} className="hover:underline text-white/90">Services</button>
          </div>
          <div className="footer-col footer-contact">
            <div className="mb-1 font-bold text-white">Contact</div>
            <a className="flex items-start gap-2 hover:text-white" href={`tel:${contactPhone.replace(/[^\d+]/g, '')}`}><Phone className="mt-1 h-4 w-4 shrink-0" />{contactPhone}</a>
            <div className="flex items-start gap-2"><MapPin className="mt-1 h-4 w-4 shrink-0" />{clinicAddress}</div>
            <div className="flex items-start gap-2"><Clock3 className="mt-1 h-4 w-4 shrink-0" />{clinicHours}</div>
          </div>
        </div>
        <div className="footer-bottom">
          © {new Date().getFullYear()} Mayor Moises R. Flores Health Center — All rights reserved
        </div>
      </div>
    </footer>
  );
};
