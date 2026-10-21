import React, { useState } from 'react';
import { useHealthCenter } from '../context/HealthCenterContext';
import { Menu, X, Globe, Calendar, UserCheck } from 'lucide-react';

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
    { id: 'overview', label: t.navHome },
    { id: 'services', label: t.navServices },
    { id: 'staff', label: t.navStaff },
    { id: 'outreach', label: t.navOutreach },
    { id: 'news', label: t.navNews },
    { id: 'portal', label: t.navPortal },
    { id: 'analytics', label: t.navAnalytics },
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
      {/* Operating Hours Announcement Bar (quiet unboxed text) */}
      <div className="bg-slate-900 text-white text-xs px-4 py-1.5 transition-colors">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-[13px]">
          <div className="flex items-center gap-2 overflow-x-auto whitespace-nowrap py-0.5">
            <span className="font-medium text-teal-400">Pateros Health</span>
            <span className="text-slate-400" aria-hidden="true">·</span>
            <span className="text-slate-200">Monday - Friday: 7:00 AM - 4:00 PM</span>
            <span className="text-slate-400" aria-hidden="true">·</span>
            <span className="text-slate-300">San Pedro · Magtanggol · Tabacalera</span>
            <span className="text-slate-400" aria-hidden="true">·</span>
            <span className="text-amber-300">3rd Floor X-Ray: 7AM - 10AM</span>
          </div>

          <div className="flex items-center gap-4 text-xs shrink-0">
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-1.5 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Toggle English / Filipino"
            >
              <Globe className="w-3.5 h-3.5 text-teal-400" />
              <span className="font-medium">{language === 'en' ? 'Filipino' : 'English'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Top Bar Contract: Zone 1 (Brand) - Zone 2 (Nav Links) - Zone 3 (Action) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-8 h-16">
          {/* Zone 1: Single text element wordmark */}
          <a
            href="#overview"
            onClick={(e) => { e.preventDefault(); handleNavClick('overview'); }}
            className="text-lg font-bold tracking-tight text-slate-900 hover:text-teal-800 transition-colors whitespace-nowrap shrink-0 flex items-center gap-2.5"
          >
            <div className="w-8 h-8 rounded-lg bg-teal-700 text-white flex items-center justify-center font-bold text-sm shadow-sm">
              +
            </div>
            <span>{t.brand}</span>
          </a>

          {/* Zone 2: Concise single-line text navigation links */}
          <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-600">
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

          {/* Zone 3: 1 Primary Action + Quick Portal trigger */}
          <div className="hidden sm:flex items-center gap-3 shrink-0">
            <button
              onClick={() => handleNavClick('portal')}
              className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer"
            >
              <UserCheck className="w-4 h-4 text-teal-700" />
              <span>{t.btnAccessPortal}</span>
            </button>

            <button
              onClick={() => setBookingModalOpen(true)}
              className="px-4 py-2 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg shadow-sm transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer"
            >
              <Calendar className="w-4 h-4" />
              <span>{t.btnBookOutreach}</span>
            </button>
          </div>

          {/* Mobile hamburger button */}
          <div className="flex items-center gap-2 lg:hidden">
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
        <div className="lg:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 shadow-lg space-y-3">
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

          <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
            <button
              onClick={() => { setBookingModalOpen(true); setMobileMenuOpen(false); }}
              className="w-full py-2.5 px-4 text-sm font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg flex items-center justify-center gap-2"
            >
              <Calendar className="w-4 h-4" />
              <span>{t.btnBookOutreach}</span>
            </button>
            <button
              onClick={() => { handleNavClick('portal'); }}
              className="w-full py-2 px-4 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center justify-center gap-2"
            >
              <UserCheck className="w-4 h-4 text-teal-700" />
              <span>{t.btnAccessPortal}</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
