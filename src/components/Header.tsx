import React, { useState } from 'react';
import { useHealthCenter } from '../context/HealthCenterContext';
import { Menu, X, Globe, CalendarDays } from 'lucide-react';
import centerPhoto from '../assets/images/MR FLORES.png';

export const Header: React.FC = () => {
  const { 
    t, 
    language, 
    toggleLanguage, 
    activeSection,
    setActiveSection,
    setBookingModalOpen
  } = useHealthCenter();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { id: 'overview', label: 'Home' },
    { id: 'services', label: t.navServices },
    { id: 'staff', label: 'Doctors & Team' },
    { id: 'contact', label: t.navContact },
  ];

  const handleNavClick = (id: string) => {
    setActiveSection(id);
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      {/* Main Top Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-6 h-[76px]">
          {/* Zone 1: Single text element wordmark */}
          <a
            href="#overview"
            onClick={(e) => { e.preventDefault(); handleNavClick('overview'); }}
            className="text-base font-bold text-slate-900 hover:text-teal-800 transition-colors whitespace-nowrap shrink-0 flex items-center gap-3"
          >
            <img src={centerPhoto} alt="Mr. Flores Health Center" className="w-12 h-12 rounded-lg object-cover border border-slate-200" />
            <span title={t.brand}>Mayor Moises R. Flores <span className="hidden sm:inline">Health Center</span></span>
          </a>

          {/* Zone 2: Concise single-line text navigation links */}
          <nav className="hidden lg:flex items-center gap-7 text-sm font-medium text-slate-600">
            {navLinks.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`transition-colors whitespace-nowrap shrink-0 hover:text-teal-700 py-1 cursor-pointer ${
                  activeSection === item.id 
                    ? 'text-teal-800 font-semibold border-b-2 border-teal-700' 
                    : 'text-slate-600'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          <div className="hidden sm:flex items-center gap-4 shrink-0">
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-1.5 text-slate-600 hover:text-teal-800 transition-colors cursor-pointer"
              title="Toggle English / Filipino"
            >
              <Globe className="w-4 h-4" />
              <span className="text-sm font-medium">{language === 'en' ? 'Filipino' : 'English'}</span>
            </button>
            <button onClick={() => setBookingModalOpen(true)} className="px-4 py-2.5 text-sm font-semibold text-white bg-teal-800 hover:bg-teal-900 rounded-md transition-colors whitespace-nowrap flex items-center gap-2">
              <CalendarDays className="w-4 h-4" />
              <span>Request appointment</span>
            </button>
          </div>

          {/* Mobile hamburger button */}
          <div className="flex items-center gap-2 lg:hidden">
            <button
              onClick={toggleLanguage}
              className="sm:hidden p-2 text-slate-600 hover:text-teal-800"
              aria-label={language === 'en' ? 'Switch to Filipino' : 'Switch to English'}
              title={language === 'en' ? 'Filipino' : 'English'}
            >
              <Globe className="w-5 h-5" />
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg cursor-pointer"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-5 shadow-lg space-y-3">
          <div className="grid grid-cols-2 gap-2 text-sm">
            {navLinks.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`text-left px-3 py-2 rounded-md transition-colors ${
                  activeSection === item.id 
                    ? 'bg-teal-50 text-teal-800 font-semibold' 
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="pt-3 border-t border-slate-100">
            <button onClick={() => { setBookingModalOpen(true); setMobileMenuOpen(false); }} className="w-full py-2.5 px-4 text-sm font-semibold text-white bg-teal-800 hover:bg-teal-900 rounded-md flex items-center justify-center gap-2">
              <CalendarDays className="w-4 h-4" />
              <span>Request appointment</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
