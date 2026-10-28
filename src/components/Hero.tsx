import React from 'react';
import { useHealthCenter } from '../context/HealthCenterContext';
import { CalendarDays, ArrowDown } from 'lucide-react';
import centerPhoto from '../assets/images/MR FLORES.png';

export const Hero: React.FC = () => {
  const { language, setActiveSection, setBookingModalOpen, clinicOpen, appointmentRequestAvailability } = useHealthCenter();
  const bookingEnabled = clinicOpen === true && appointmentRequestAvailability === 'available';
  const bookingLabel = appointmentRequestAvailability === 'pending'
    ? 'Appointment under review'
    : appointmentRequestAvailability === 'checking'
      ? 'Checking request status'
      : appointmentRequestAvailability === 'error'
        ? 'Unable to check request'
        : clinicOpen === true ? 'REQUEST AN APPOINTMENT' : clinicOpen === false ? 'CLOSED' : 'Checking availability';

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
          <div>
          <div className="max-w-2xl">
            <h1 className="hero-enter max-w-xl text-3xl sm:text-4xl lg:text-[46px] font-bold leading-[1.08] text-white">
              Mayor Moises R. Flores Health Center
            </h1>
            <div className="hero-actions mt-7 flex flex-wrap gap-3">
              <button disabled={!bookingEnabled} onClick={() => setBookingModalOpen(true)} title={bookingEnabled ? 'Request an appointment' : 'Appointment requests are currently unavailable'} className="inline-flex items-center gap-2 bg-white text-[#0f4d3c] px-5 py-3 text-sm font-bold rounded-sm border border-white hover:bg-[#eaf3ee] transition-colors disabled:cursor-not-allowed disabled:opacity-60">
                <CalendarDays className="w-4 h-4" /> {bookingLabel}
              </button>
              <button onClick={() => handleScrollTo('services')} className="inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold text-white border border-white/40 rounded-sm hover:border-white hover:bg-white/10 transition-colors">
                View services <ArrowDown className="w-4 h-4" />
              </button>
            </div>
          </div>
          </div>
        </div>
      </div>
    </section>
  );
};
