import React from 'react';
import { useHealthCenter } from '../context/HealthCenterContext';
import { CalendarDays, ArrowDown } from 'lucide-react';
import centerPhoto from '../assets/images/MR FLORES.png';

export const Hero: React.FC = () => {
  const { language, setActiveSection, setBookingModalOpen } = useHealthCenter();
  const philippineTime = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Manila', weekday: 'short', hour: 'numeric', minute: '2-digit', hour12: false,
  }).formatToParts(new Date());
  const dayName = philippineTime.find((part) => part.type === 'weekday')?.value ?? '';
  const hour = Number(philippineTime.find((part) => part.type === 'hour')?.value ?? '0');
  const minute = Number(philippineTime.find((part) => part.type === 'minute')?.value ?? '0');
  const centerOpen = !['Sat', 'Sun'].includes(dayName) && hour * 60 + minute >= 420 && hour * 60 + minute < 960;

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
              <button onClick={() => setBookingModalOpen(true)} className="inline-flex items-center gap-2 bg-white text-[#173a37] px-5 py-3 text-sm font-bold rounded-sm border border-white hover:bg-[#edf3ef] transition-colors">
                <CalendarDays className="w-4 h-4" /> Request appointment
              </button>
              <button onClick={() => handleScrollTo('services')} className="inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold text-white border border-white/40 rounded-sm hover:border-white hover:bg-white/10 transition-colors">
                View services <ArrowDown className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className={`shrink-0 items-center gap-3 border px-6 py-4 text-base font-bold sm:flex ${centerOpen ? 'border-emerald-300/50 bg-emerald-950/45 text-white' : 'border-white/30 bg-slate-950/35 text-white'} md:px-7 md:text-lg max-sm:hidden`}>
            <span className={`h-4 w-4 rounded-full ${centerOpen ? 'bg-green-500' : 'bg-red-500'}`} />
            {centerOpen ? (language === 'fil' ? 'Bukas ngayon' : 'Open now') : (language === 'fil' ? 'Sarado ngayon' : 'Closed now')}
          </div>
          </div>
        </div>
      </div>
    </section>
  );
};
