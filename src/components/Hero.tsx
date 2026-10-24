import React from 'react';
import { useHealthCenter } from '../context/HealthCenterContext';
import { Clock, MapPin, CalendarDays, ArrowDown } from 'lucide-react';
import centerPhoto from '../assets/images/MR FLORES.png';

export const Hero: React.FC = () => {
  const { language, setActiveSection, setBookingModalOpen } = useHealthCenter();

  const handleScrollTo = (id: string) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section id="overview" className="bg-[#123b39] text-white">
      <div className="relative min-h-[320px] sm:min-h-[360px] flex items-center overflow-hidden border-b border-white/10">
        <img src={centerPhoto} alt="Mayor Moises R. Flores Health Center" className="absolute inset-0 w-full h-full object-cover object-center" />
        <div className="absolute inset-0 bg-[#102f2d]/80" />
        <div className="relative w-full max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 py-12 sm:py-14">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase text-white/75 mb-3">
              <MapPin className="w-4 h-4" />
              <span>Pateros, Metro Manila</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-[44px] font-bold leading-tight text-white">
              Mayor Moises R. Flores Health Center
            </h1>
            <div className="mt-7 flex flex-wrap gap-3">
              <button onClick={() => setBookingModalOpen(true)} className="inline-flex items-center gap-2 bg-white text-[#123b39] px-5 py-3 text-sm font-bold rounded-md hover:bg-emerald-50 transition-colors">
                <CalendarDays className="w-4 h-4" /> Request appointment
              </button>
              <button onClick={() => handleScrollTo('services')} className="inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold text-white border border-white/60 rounded-md hover:bg-white/10 transition-colors">
                View services <ArrowDown className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="bg-white text-slate-900 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 grid sm:grid-cols-2 xl:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-200">
          <div className="flex items-center gap-3 py-4 sm:py-5 sm:pr-6">
            <Clock className="w-5 h-5 text-teal-800 shrink-0" />
            <div><div className="text-xs text-slate-500">Health center</div><div className="text-sm font-bold">Mon-Fri · 7:00 AM-4:00 PM</div></div>
          </div>
          <div className="flex items-center gap-3 py-4 sm:py-5 sm:px-6">
            <Clock className="w-5 h-5 text-teal-800 shrink-0" />
            <div><div className="text-xs text-slate-500">Doctor consultations</div><div className="text-sm font-bold">Mon 8-3 · Tue-Fri 9-3</div></div>
          </div>
          <div className="flex items-center gap-3 py-4 sm:py-5 sm:px-6">
            <MapPin className="w-5 h-5 text-teal-800 shrink-0" />
            <div><div className="text-xs text-slate-500">Zones served</div><div className="text-sm font-bold">1. San Pedro · 2. Magtanggol · 3. Tabacalera</div></div>
          </div>
          <div className="flex items-center gap-3 py-4 sm:py-5 sm:pl-6">
            <Clock className="w-5 h-5 text-teal-800 shrink-0" />
            <div><div className="text-xs text-slate-500">Pateros X-ray Clinic · 3rd floor</div><div className="text-sm font-bold">Mon 8-10 AM · Tue-Fri 7-10 AM</div></div>
          </div>
        </div>
      </div>
    </section>
  );
};
