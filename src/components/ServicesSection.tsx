import React, { useState } from 'react';
import { useHealthCenter } from '../context/HealthCenterContext';
import { ServiceDetail } from '../types';
import { Activity, Baby, Clock, Heart, MapPin, Pill, ShieldAlert, Smile, Stethoscope, X } from 'lucide-react';

const categories = [
  { id: 'all', label: 'All services' },
  { id: 'checkup', label: 'Doctor visit' },
  { id: 'maternity', label: 'Maternity' },
  { id: 'dental', label: 'Dental' },
  { id: 'animal_bite', label: 'Animal bite' },
  { id: 'xray', label: 'X-ray' },
  { id: 'nutrition', label: 'Child nutrition' },
  { id: 'pharmacy', label: 'Medicines' },
];

const iconForService = (category: string) => {
  switch (category) {
    case 'maternity': return <Heart className="w-5 h-5" />;
    case 'nutrition': return <Baby className="w-5 h-5" />;
    case 'dental': return <Smile className="w-5 h-5" />;
    case 'animal_bite': return <ShieldAlert className="w-5 h-5" />;
    case 'pharmacy': return <Pill className="w-5 h-5" />;
    case 'xray': return <Activity className="w-5 h-5" />;
    default: return <Stethoscope className="w-5 h-5" />;
  }
};

export const ServicesSection: React.FC = () => {
  const { t, language, openBookingForProgram, clinicOpen, appointmentRequestAvailability, siteContent } = useHealthCenter();
  const bookingEnabled = clinicOpen === true && appointmentRequestAvailability === 'available';
  const bookingLabel = appointmentRequestAvailability === 'pending'
    ? 'Appointment under review'
    : appointmentRequestAvailability === 'checking'
      ? 'Checking request status'
      : appointmentRequestAvailability === 'error'
        ? 'Unable to check request'
        : clinicOpen === true ? 'Request this appointment' : clinicOpen === false ? 'Appointments closed' : 'Checking availability';
  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedService, setSelectedService] = useState<ServiceDetail | null>(null);
  const filteredServices = activeCategory === 'all'
    ? siteContent.services
    : siteContent.services.filter((service) => service.category === activeCategory);

  return (
    <section id="services" className="services-enter py-14 sm:py-18 bg-[#fbfcfa] border-b border-[#dfe6e1]">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5 mb-8">
          <div className="max-w-2xl">
            <div className="text-xs font-bold text-teal-800 uppercase mb-3">Health services</div>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-950">{t.servicesTitle}</h2>
            <p className="mt-3 text-base text-slate-600">Schedules, locations, and service requirements.</p>
          </div>
        </div>

        <div className="flex gap-1 overflow-x-auto border-y border-[#dfe6e1] mb-6" role="tablist" aria-label="Filter health services">
          {categories.map((category) => (
            <button
              key={category.id}
              role="tab"
              aria-selected={activeCategory === category.id}
              onClick={() => setActiveCategory(category.id)}
              className={`min-h-11 px-4 py-3 text-sm font-bold whitespace-nowrap border-b-2 transition-colors duration-200 ${activeCategory === category.id ? 'border-[#17645c] text-[#173a37]' : 'border-transparent text-[#66736f] hover:text-[#173a37]'}`}
            >
              {category.label}
            </button>
          ))}
        </div>

        <div className="border-t border-[#cfd8d2]">
          {filteredServices.map((service, index) => (
            <article key={service.id} className="service-row grid md:grid-cols-[minmax(220px,1.2fr)_minmax(260px,0.8fr)_auto] gap-4 md:gap-8 items-center py-5 border-b border-[#dfe6e1] transition-colors duration-200 hover:bg-[#f2f6f2]">
              <div className="flex items-start gap-4">
                <div className="w-9 h-9 flex items-center justify-center text-[#17645c] border border-[#bfd0c5] shrink-0">
                  {iconForService(service.category)}
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] font-bold text-[#7b8984] tabular-nums mb-1">{String(index + 1).padStart(2, '0')}</div>
                  <h3 className="text-[15px] font-bold text-[#17312e]">{language === 'fil' ? service.titleFil : service.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-[#66736f]">{language === 'fil' ? service.shortDescFil : service.shortDesc}</p>
                </div>
              </div>
              <div className="space-y-2 text-sm text-[#66736f] md:border-l md:border-[#dfe6e1] md:pl-5">
                <div className="flex items-start gap-2"><Clock className="w-4 h-4 mt-0.5 text-[#17645c] shrink-0" /><span>{language === 'fil' ? service.scheduleFil : service.schedule}</span></div>
                <div className="flex items-start gap-2"><MapPin className="w-4 h-4 mt-0.5 text-[#17645c] shrink-0" /><span>{service.location}</span></div>
              </div>
              <button onClick={() => setSelectedService(service)} className="justify-self-start md:justify-self-end px-3 py-2 text-sm font-bold text-[#173a37] border-b border-[#17645c] hover:bg-[#eaf0ec]">
                Details
              </button>
            </article>
          ))}
        </div>

      </div>

      {selectedService && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/60 p-2 pt-[max(0.5rem,env(safe-area-inset-top))] pb-[max(0.5rem,env(safe-area-inset-bottom))] sm:items-center sm:p-4" onClick={() => setSelectedService(null)}>
          <section role="dialog" aria-modal="true" aria-labelledby="service-dialog-title" onClick={(event) => event.stopPropagation()} className="max-h-[calc(100dvh-1rem-env(safe-area-inset-top)-env(safe-area-inset-bottom))] w-full max-w-xl overflow-y-auto border border-[#dfe6e1] bg-[#fcfdfb] p-4 shadow-[0_18px_50px_rgba(23,58,55,0.28)] sm:max-h-[90vh] sm:p-8">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-4">
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-teal-800">{language === 'fil' ? selectedService.badgeFil : selectedService.badge}</div>
                <h3 id="service-dialog-title" className="mt-1 text-2xl font-bold text-slate-950">{language === 'fil' ? selectedService.titleFil : selectedService.title}</h3>
              </div>
              <button onClick={() => setSelectedService(null)} aria-label="Close details" className="p-2 text-slate-500 hover:text-slate-900"><X className="w-5 h-5" /></button>
            </div>
            <p className="py-5 text-sm leading-relaxed text-slate-700">{language === 'fil' ? selectedService.fullDescFil : selectedService.fullDesc}</p>
            <div className="grid sm:grid-cols-2 gap-4 border-y border-slate-200 py-4 text-sm">
              <div><div className="font-bold text-slate-900">Schedule</div><p className="mt-1 text-slate-600">{language === 'fil' ? selectedService.scheduleFil : selectedService.schedule}</p></div>
              <div><div className="font-bold text-slate-900">Location</div><p className="mt-1 text-slate-600">{selectedService.location}</p></div>
              <div className="sm:col-span-2"><div className="font-bold text-slate-900">Care team</div><p className="mt-1 text-slate-600">{selectedService.keyPersonnel.join(', ')}</p></div>
            </div>
            <button disabled={!bookingEnabled} onClick={() => openBookingForProgram(selectedService.id)} className="mt-6 inline-flex min-h-11 items-center justify-center px-4 py-3 bg-[#17645c] text-white text-sm font-bold rounded-sm hover:bg-[#104f49] disabled:cursor-not-allowed disabled:opacity-50">{bookingLabel}</button>
          </section>
        </div>
      )}
    </section>
  );
};
