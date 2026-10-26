import React from 'react';
import { useHealthCenter } from '../context/HealthCenterContext';
import { CalendarDays, ArrowDown } from 'lucide-react';
import centerPhoto from '../assets/images/MR FLORES.png';

export const Hero: React.FC = () => {
  const { language, setActiveSection, setBookingModalOpen, clinicOpen, clinicStatusError } = useHealthCenter();
  const bookingEnabled = clinicOpen === true;

  const handleScrollTo = (id: string) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section id="overview" className="bg-[#173a37] text-white">
      <div className="relative min-h-[300px] sm:min-h-[340px] flex items-center overflow-hidden border-b border-white/10">
        <img src={centerPhoto} alt="Mayor Moises R. Flores Health Center" className="absolute inset-0 w-full h-full object-cover object-center" />
        <div className="absolute inset-0 bg-[#173a37]/88" />
        <div className="relative w-full max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 py-12 sm:py-14">
          <div className="flex items-center justify-between gap-6">
          <div className="max-w-2xl">
            <h1 className="hero-enter max-w-xl text-3xl sm:text-4xl lg:text-[46px] font-bold leading-[1.08] text-white">
              Mayor Moises R. Flores Health Center
            </h1>
            <div className="hero-actions mt-7 flex flex-wrap gap-3">
              <button disabled={!bookingEnabled} onClick={() => setBookingModalOpen(true)} title={bookingEnabled ? 'Request an appointment' : 'Appointment requests are currently unavailable'} className="inline-flex items-center gap-2 bg-white text-[#173a37] px-5 py-3 text-sm font-bold rounded-sm border border-white hover:bg-[#edf3ef] transition-colors disabled:cursor-not-allowed disabled:opacity-60">
                <CalendarDays className="w-4 h-4" /> {bookingEnabled ? 'Request appointment' : clinicOpen === false ? 'Appointments closed' : 'Checking availability'}
              </button>
              <button onClick={() => handleScrollTo('services')} className="inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold text-white border border-white/40 rounded-sm hover:border-white hover:bg-white/10 transition-colors">
                View services <ArrowDown className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className={`shrink-0 items-center gap-4 border px-8 py-5 text-xl font-bold sm:flex md:px-9 md:py-6 md:text-2xl ${clinicOpen ? 'border-emerald-300/50 bg-emerald-950/45 text-white' : 'border-white/30 bg-slate-950/35 text-white'} max-sm:hidden`}>
            <span className={`h-5 w-5 rounded-full ${clinicStatusError ? 'bg-slate-400' : clinicOpen ? 'bg-green-500' : 'bg-red-500'}`} />
            {clinicStatusError || clinicOpen === null
              ? (language === 'fil' ? 'Hindi available ang status' : 'Status unavailable')
              : clinicOpen
                ? (language === 'fil' ? 'BUKAS NGAYON' : 'OPEN NOW')
                : (language === 'fil' ? 'SARADO NGAYON' : 'CLOSED NOW')}
          </div>
          </div>
        </div>
      </div>
    </section>
  );
};
