import React, { useState } from 'react';
import { useHealthCenter } from '../context/HealthCenterContext';
import { Menu, X, Globe, CalendarDays, LogOut, Mail } from 'lucide-react';
import centerPhoto from '../assets/images/MR FLORES.png';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';

export const Header: React.FC = () => {
  const {
    t,
    language,
    toggleLanguage,
    activeSection,
    setActiveSection,
    setBookingModalOpen,
    clinicOpen,
    appointmentRequestAvailability,
    setMessagesOpen,
    unreadAdminMessageCount,
    unreadMessagesError,
  } = useHealthCenter();
  const bookingEnabled = clinicOpen === true && appointmentRequestAvailability === 'available';
  const bookingLabel = appointmentRequestAvailability === 'pending'
    ? 'Appointment under review'
    : appointmentRequestAvailability === 'checking'
      ? 'Checking request status'
      : appointmentRequestAvailability === 'error'
        ? 'Unable to check request'
        : clinicOpen === true ? 'Request appointment' : clinicOpen === false ? 'Appointments closed' : 'Checking availability';

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { id: 'overview', label: 'Home' },
    { id: 'clinic-information', label: 'Information' },
    { id: 'appointment-schedule', label: 'Schedule' },
    { id: 'services', label: t.navServices },
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
    <header className="header-enter sticky top-0 z-40 bg-[#fbfcfa]/95 backdrop-blur-md border-b border-[#dfe6e1]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-[68px] items-center justify-between gap-2 sm:gap-6">
          <a
            href="#overview"
            onClick={(e) => { e.preventDefault(); handleNavClick('overview'); }}
            className="flex min-w-0 shrink items-center gap-2 text-xs font-bold text-[#18312e] transition-colors duration-200 hover:text-[#0d625a] sm:gap-3 sm:text-[15px]"
          >
            <img src={centerPhoto} alt="Mr. Flores Health Center logo" className="h-9 w-9 shrink-0 rounded-full border border-[#dfe6e1] object-cover sm:h-11 sm:w-11" />
            <span title={t.brand} className="min-w-0 truncate sm:overflow-visible sm:whitespace-nowrap">Mayor Moises R. Flores <span className="hidden sm:inline">Health Center</span></span>
          </a>

          <nav className="hidden xl:flex items-center gap-7 text-sm font-medium text-slate-600">
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

          <div className="hidden xl:flex items-center gap-4 shrink-0">
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-1.5 text-slate-600 hover:text-teal-800 transition-colors cursor-pointer"
              title="Toggle English / Filipino"
            >
              <Globe className="w-4 h-4" />
              <span className="text-sm font-medium">{language === 'en' ? 'Filipino' : 'English'}</span>
            </button>
            <button disabled={!bookingEnabled} onClick={() => setBookingModalOpen(true)} title={bookingEnabled ? 'Request an appointment' : 'Appointment requests are currently unavailable'} className="px-4 py-2.5 text-sm font-bold text-white bg-[#17645c] hover:bg-[#104f49] rounded-sm transition-colors whitespace-nowrap flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-50">
              <CalendarDays className="w-4 h-4" />
              <span>{bookingLabel}</span>
            </button>
            <button type="button" onClick={() => setMessagesOpen(true)} className="relative p-2 text-slate-600 hover:bg-[#edf3ef] hover:text-[#17645c]" aria-label={`Messages${unreadAdminMessageCount > 0 ? `, ${unreadAdminMessageCount} unread` : ''}`} title={unreadMessagesError || (unreadAdminMessageCount > 0 ? `${unreadAdminMessageCount} unread message${unreadAdminMessageCount === 1 ? '' : 's'}` : 'Messages')}>
              <Mail className="h-5 w-5" />
              {unreadAdminMessageCount > 0 && <span aria-hidden="true" className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold leading-none text-white">{unreadAdminMessageCount > 99 ? '99+' : unreadAdminMessageCount}</span>}
            </button>
            <button type="button" onClick={() => void signOut(auth)} className="p-2 text-slate-600 hover:text-[#173a37]" aria-label="Sign out" title="Sign out">
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-1 xl:hidden sm:gap-2">
            <button
              onClick={toggleLanguage}
              className="flex h-11 w-11 items-center justify-center text-slate-600 hover:text-teal-800 xl:hidden"
              aria-label={language === 'en' ? 'Switch to Filipino' : 'Switch to English'}
              title={language === 'en' ? 'Filipino' : 'English'}
            >
              <Globe className="w-5 h-5" />
            </button>
            <button type="button" onClick={() => setMessagesOpen(true)} className="relative flex h-11 w-11 items-center justify-center text-slate-600 hover:text-[#17645c] xl:hidden" aria-label={`Messages${unreadAdminMessageCount > 0 ? `, ${unreadAdminMessageCount} unread` : ''}`} title={unreadMessagesError || (unreadAdminMessageCount > 0 ? `${unreadAdminMessageCount} unread message${unreadAdminMessageCount === 1 ? '' : 's'}` : 'Messages')}>
              <Mail className="h-5 w-5" />
              {unreadAdminMessageCount > 0 && <span aria-hidden="true" className="absolute right-0 top-0 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold leading-none text-white">{unreadAdminMessageCount > 99 ? '99+' : unreadAdminMessageCount}</span>}
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="flex h-11 w-11 items-center justify-center rounded-lg text-slate-700 hover:bg-slate-100 hover:text-slate-900"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="xl:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-5 shadow-lg space-y-3">
          <div className="grid grid-cols-2 gap-2 text-sm">
            {navLinks.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`min-h-11 text-left px-3 py-2 rounded-md transition-colors ${
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
            <button disabled={!bookingEnabled} onClick={() => { setBookingModalOpen(true); setMobileMenuOpen(false); }} className="min-h-11 w-full py-2.5 px-4 text-sm font-semibold text-white bg-teal-800 hover:bg-teal-900 rounded-md flex items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-50">
              <CalendarDays className="w-4 h-4" />
              <span>{bookingLabel}</span>
            </button>
            <button type="button" onClick={() => void signOut(auth)} className="mt-2 flex min-h-11 w-full items-center justify-center gap-2 rounded-md border border-slate-200 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
