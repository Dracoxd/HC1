import React, { useEffect, useState } from 'react';
import { useHealthCenter } from '../context/HealthCenterContext';
import { CalendarDays, ArrowDown } from 'lucide-react';
import centerPhoto from '../assets/images/MR FLORES.png';
import { isClinicOpenBySchedule } from '../clinicHours';

export const Hero: React.FC = () => {
  const { language, setActiveSection, setBookingModalOpen, clinicOpen, appointmentRequestAvailability } = useHealthCenter();
  const [currentTime, setCurrentTime] = useState(() => Date.now());
  const openBySchedule = isClinicOpenBySchedule(new Date(currentTime)) && clinicOpen !== false;

  useEffect(() => {
    const timer = window.setInterval(() => setCurrentTime(Date.now()), 60_000);
    return () => window.clearInterval(timer);
  }, []);
  const bookingEnabled = clinicOpen === true && appointmentRequestAvailability === 'available';
  const handleScrollTo = (id: string) => {
    setActiveSection(id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <section id="overview" className="hero-section-enter bg-[#0f4d3c] text-white">
      <div className="relative min-h-[300px] sm:min-h-[340px] flex items-center overflow-hidden border-b border-white/10">
        <img src={centerPhoto} alt="Mayor Moises R. Flores Health Center" className="absolute inset-0 w-full h-full object-cover object-center" />
        <div className="absolute inset-0 bg-[#0f4d3c]/88" />
        <div className="relative w-full max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 py-12 sm:py-14">
          <div className="flex w-full flex-col gap-7 sm:flex-row sm:items-center sm:justify-between sm:gap-10">
          <div className="max-w-2xl">
            <h1 className="hero-enter max-w-xl text-3xl sm:text-4xl lg:text-[46px] font-bold leading-[1.08] text-white">
              Mayor Moises R. Flores Health Center
            </h1>
            <div className="hero-actions mt-7 flex flex-wrap gap-3">
              {bookingEnabled && <button onClick={() => setBookingModalOpen(true)} className="inline-flex items-center gap-2 bg-white text-[#0f4d3c] px-5 py-3 text-sm font-bold rounded-sm border border-white hover:bg-[#eaf3ee] transition-colors">
                <CalendarDays className="w-4 h-4" /> REQUEST AN APPOINTMENT
              </button>}
              <button onClick={() => handleScrollTo('services')} className="inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold text-white border border-white/40 rounded-sm hover:border-white hover:bg-white/10 transition-colors">
                View services <ArrowDown className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className={`flex min-h-24 min-w-56 items-center justify-center gap-4 self-end rounded-md border px-7 py-5 text-2xl font-extrabold shadow-lg sm:min-h-28 sm:min-w-64 sm:self-center sm:px-9 sm:text-3xl ${openBySchedule ? 'border-emerald-200/50 bg-emerald-950/50 text-white' : 'border-rose-200/60 bg-rose-950/55 text-white'}`} role="status" aria-live="polite">
            <span className={`h-4 w-4 shrink-0 rounded-full ring-4 ${openBySchedule ? 'bg-emerald-400 ring-emerald-300/20' : 'bg-rose-400 ring-rose-300/20'}`} />
            {openBySchedule
              ? (language === 'fil' ? 'BUKAS NGAYON' : 'OPEN NOW')
              : (language === 'fil' ? 'SARADO NGAYON' : 'CLOSED NOW')}
          </div>
          </div>
        </div>
      </div>
    </section>
  );
};
