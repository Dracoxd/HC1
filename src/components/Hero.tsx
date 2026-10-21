import React from 'react';
import { useHealthCenter } from '../context/HealthCenterContext';
import { HERO_IMAGE } from '../data/healthCenterData';
import { Clock, MapPin, Calendar, Stethoscope } from 'lucide-react';

export const Hero: React.FC = () => {
  const { t, language, setBookingModalOpen, setActiveSection } = useHealthCenter();

  const handleScrollTo = (id: string) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section id="overview" className="relative bg-gradient-to-b from-teal-50/50 via-white to-slate-50 pt-8 pb-14 border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Zones na Sakop unboxed badge */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-teal-800 uppercase tracking-wider mb-4">
          <MapPin className="w-3.5 h-3.5 text-teal-700" />
          <span>Zones na Sakop: 1. San Pedro · 2. Magtanggol · 3. Tabacalera</span>
          <span className="text-slate-400" aria-hidden="true">·</span>
          <span className="text-slate-600 font-normal normal-case">Pateros Health Center</span>
        </div>

        {/* 2-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Column: Essential Times & Info */}
          <div className="lg:col-span-7 space-y-5">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-950 tracking-tight leading-tight">
              MR. FLORES HEALTH CENTER
            </h1>

            <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl">
              {language === 'fil'
                ? 'Naglilingkod sa San Pedro, Magtanggol, at Tabacalera. Nag-aalok ng Maternity/pregnant, Nutrition (BNS 0-59 months OPT), Dental clinic (M-W-F), Animal bite, Check-up, 3rd Floor X-Ray Clinic (7AM-10AM), at mga gamot sa high blood maintenance, diabetes, at TB program.'
                : 'Serving San Pedro, Magtanggol, and Tabacalera. Offering maternity/pregnant care, child nutrition (BNS 0-59 months OPT), dental clinic (M-W-F), animal bite, doctor check-up, 3rd floor X-ray clinic (7AM-10AM), and maintenance medications.'}
            </p>

            {/* Exact Clinic & Operating Hours Box */}
            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900 uppercase tracking-wider">
                <Clock className="w-4 h-4 text-teal-700" />
                <span>Operating & Clinic Hours</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-700">
                <div className="space-y-0.5">
                  <div className="text-slate-500 font-medium">Health Center Hours:</div>
                  <div className="font-bold text-slate-900">Monday to Friday : 7am-4pm</div>
                </div>

                <div className="space-y-0.5">
                  <div className="text-slate-500 font-medium">Doctor Clinic Hours:</div>
                  <div className="font-bold text-slate-900">MONDAY: 8 AM - 3 PM</div>
                  <div className="font-bold text-slate-900">TUES - FRI: 9 AM - 3 PM</div>
                </div>

                <div className="space-y-0.5 pt-2 sm:pt-0 sm:border-t-0 border-t border-slate-100">
                  <div className="text-slate-500 font-medium">X-RAY CLINIC (3rd Floor):</div>
                  <div className="font-bold text-teal-800">MONDAY - FRIDAY: 7AM - 10AM</div>
                </div>

                <div className="space-y-0.5 pt-2 sm:pt-0 sm:border-t-0 border-t border-slate-100">
                  <div className="text-slate-500 font-medium">Dental Clinic:</div>
                  <div className="font-bold text-teal-800">M W F lng ung dentist</div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                onClick={() => setBookingModalOpen(true)}
                className="px-5 py-2.5 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg shadow-xs flex items-center gap-2 cursor-pointer"
              >
                <Calendar className="w-4 h-4" />
                <span>{t.heroCtaPrimary}</span>
              </button>

              <button
                onClick={() => handleScrollTo('services')}
                className="px-5 py-2.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg flex items-center gap-2 cursor-pointer"
              >
                <Stethoscope className="w-4 h-4 text-teal-700" />
                <span>{t.heroCtaSecondary}</span>
              </button>
            </div>
          </div>

          {/* Right Column: Center Exterior Photo */}
          <div className="lg:col-span-5">
            <div className="rounded-xl overflow-hidden shadow-xs border border-slate-200 aspect-[16/10] bg-slate-100 relative">
              <img
                src={HERO_IMAGE}
                alt="Picture of Mr. Flores Health Center"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent flex items-end p-4">
                <div className="text-white text-xs">
                  <div className="font-bold text-sm">MR. FLORES HEALTH CENTER</div>
                  <div className="text-slate-200 text-[11px]">Zones: San Pedro · Magtanggol · Tabacalera</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 4 Crisp Proof Highlights */}
        <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-slate-200 text-xs">
          <div className="p-3.5 bg-white rounded-xl border border-slate-200">
            <div className="font-bold text-slate-900 text-base tabular-nums">7AM - 4PM</div>
            <div className="text-slate-600 mt-0.5">Monday to Friday</div>
          </div>

          <div className="p-3.5 bg-white rounded-xl border border-slate-200">
            <div className="font-bold text-teal-800 text-base tabular-nums">3rd Floor X-Ray</div>
            <div className="text-slate-600 mt-0.5">7AM - 10AM Mon-Fri</div>
          </div>

          <div className="p-3.5 bg-white rounded-xl border border-slate-200">
            <div className="font-bold text-slate-900 text-base tabular-nums">Dental M-W-F</div>
            <div className="text-slate-600 mt-0.5">M W F lng ung dentist</div>
          </div>

          <div className="p-3.5 bg-white rounded-xl border border-slate-200">
            <div className="font-bold text-teal-800 text-base tabular-nums">Maintenance Meds</div>
            <div className="text-slate-600 mt-0.5">High blood · Diabetics · TB</div>
          </div>
        </div>

      </div>
    </section>
  );
};
