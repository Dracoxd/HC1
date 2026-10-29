import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useHealthCenter } from '../context/HealthCenterContext';
import { ServiceDetail } from '../types';
import { Activity, ArrowRight, Baby, Clock, Heart, MapPin, Pill, ShieldAlert, Smile, Stethoscope, X } from 'lucide-react';
import animalBiteImage from '../assets/images/ANIMAL BITE.jpg';
import bnsImage from '../assets/images/BNS.png';
import checkupImage from '../assets/images/CHECK UP.jpg';
import dentalImage from '../assets/images/DENTAL CLINIC.jpg';
import maternityImage from '../assets/images/MATERNITY.png';
import medicinesImage from '../assets/images/MEDS.jpg';
import xrayImage from '../assets/images/XRAY.jpg';

const serviceImages: Partial<Record<ServiceDetail['category'], string>> = {
  animal_bite: animalBiteImage,
  nutrition: bnsImage,
  checkup: checkupImage,
  dental: dentalImage,
  maternity: maternityImage,
  pharmacy: medicinesImage,
  xray: xrayImage,
};

const illustrationForService = (category: string) => {
  switch (category) {
    case 'maternity': return { Icon: Heart, color: 'bg-rose-50 text-rose-700', accent: 'bg-rose-200/70' };
    case 'nutrition': return { Icon: Baby, color: 'bg-amber-50 text-amber-700', accent: 'bg-amber-200/70' };
    case 'dental': return { Icon: Smile, color: 'bg-sky-50 text-sky-700', accent: 'bg-sky-200/70' };
    case 'animal_bite': return { Icon: ShieldAlert, color: 'bg-orange-50 text-orange-700', accent: 'bg-orange-200/70' };
    case 'pharmacy': return { Icon: Pill, color: 'bg-violet-50 text-violet-700', accent: 'bg-violet-200/70' };
    case 'xray': return { Icon: Activity, color: 'bg-cyan-50 text-cyan-800', accent: 'bg-cyan-200/70' };
    default: return { Icon: Stethoscope, color: 'bg-emerald-50 text-emerald-800', accent: 'bg-emerald-200/70' };
  }
};

export const ServicesSection: React.FC = () => {
  const { language, openBookingForProgram, clinicOpen, appointmentRequestAvailability, siteContent } = useHealthCenter();
  const bookingEnabled = clinicOpen === true && appointmentRequestAvailability === 'available';
  const bookingLabel = appointmentRequestAvailability === 'pending'
    ? 'Appointment under review'
    : appointmentRequestAvailability === 'checking'
      ? 'Checking request status'
      : appointmentRequestAvailability === 'error'
        ? 'Unable to check request'
        : clinicOpen === true ? 'REQUEST AN APPOINTMENT' : clinicOpen === false ? 'CLOSED' : 'Checking availability';

  const [selectedService, setSelectedService] = useState<ServiceDetail | null>(null);
  const servicePreview = (description: string) => {
    const firstSentence = description.trim().match(/^.*?[.!?](?=\s|$)/)?.[0] ?? description.trim();
    return firstSentence.length > 150 ? `${firstSentence.slice(0, 147).trimEnd()}...` : firstSentence;
  };

  return (
    <section id="services" className="site-section-bg section-enter services-enter border-b border-[#dce7e1] py-8 sm:py-10">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">
        <div className="breadcrumb">Home <span aria-hidden="true">/</span> <span className="font-semibold text-[#0f4d3c]">Services</span></div>
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5 mb-6">
          <div className="max-w-2xl">
            <div className="text-xs font-bold text-[#2c7a5f] uppercase mb-2">Health services</div>
            <p className="mt-2 text-sm text-[#6b7280]">Schedules, locations, and care information.</p>
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {siteContent.services.map((service) => (
            <article key={service.id} className="site-card service-row lift-on-hover flex min-w-0 flex-col overflow-hidden transition-colors duration-200 hover:border-[#9bbdad]">
                {(() => {
                  const image = serviceImages[service.category];
                  const illustration = illustrationForService(service.category);
                  const IllustrationIcon = illustration.Icon;
                  return (
                    image
                      ? <img src={image} alt={language === 'fil' ? service.titleFil : service.title} loading="lazy" decoding="async" className="aspect-[16/9] w-full border-b border-[#dce7e1] object-cover" />
                      : (
                        <div role="img" aria-label={`${language === 'fil' ? service.titleFil : service.title} illustration`} className={`relative flex aspect-[16/9] w-full items-center justify-center overflow-hidden border-b border-[#dce7e1] ${illustration.color}`}>
                          <span className={`absolute right-8 top-5 h-14 w-14 rounded-full ${illustration.accent}`} />
                          <span className={`absolute bottom-4 left-8 h-10 w-10 rounded-full ${illustration.accent}`} />
                          <IllustrationIcon className="relative h-9 w-9 stroke-[1.6] sm:h-10 sm:w-10" aria-hidden="true" />
                        </div>
                      )
                  );
                })()}
              <div className="flex flex-1 flex-col p-5">
                <h3 className="text-base font-bold text-[#0f4d3c]">{language === 'fil' ? service.titleFil : service.title}</h3>
                <p className="mt-2 min-h-10 text-sm leading-relaxed text-[#6b7280]">{servicePreview(language === 'fil' ? service.shortDescFil : service.shortDesc)}</p>
                <div className="mt-4 flex flex-1 items-start gap-2 text-xs leading-relaxed text-[#4b5563]"><Clock className="mt-0.5 h-4 w-4 shrink-0 text-[#2c7a5f]" /><span>{language === 'fil' ? service.scheduleFil : service.schedule}</span></div>
                <div className="mt-2 flex items-start gap-2 text-xs leading-relaxed text-[#6b7280]"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#2c7a5f]" /><span>{service.location}</span></div>
                <button onClick={() => setSelectedService(service)} className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-sm bg-[#0f4d3c] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#2c7a5f]">
                  {language === 'fil' ? 'Tingnan ang detalye' : 'View details'}<ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </article>
          ))}
          {siteContent.services.length === 0 && <p className="col-span-full py-8 text-sm text-[#6b7280]">{language === 'fil' ? 'Walang serbisyong nailathala sa ngayon.' : 'No services have been published yet.'}</p>}
        </div>

      </div>

      {selectedService && createPortal((
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/60 p-2 pt-[max(0.5rem,env(safe-area-inset-top))] pb-[max(0.5rem,env(safe-area-inset-bottom))] sm:items-center sm:p-4" onClick={() => setSelectedService(null)}>
          <section role="dialog" aria-modal="true" aria-labelledby="service-dialog-title" onClick={(event) => event.stopPropagation()} className="max-h-[calc(100dvh-1rem-env(safe-area-inset-top)-env(safe-area-inset-bottom))] w-full max-w-xl overflow-y-auto rounded-md border border-[#dce7e1] bg-white p-4 shadow-[0_18px_50px_rgba(15,77,60,0.18)] sm:max-h-[90vh] sm:p-8">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-4">
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-[#2c7a5f]">{language === 'fil' ? selectedService.badgeFil : selectedService.badge}</div>
                <h3 id="service-dialog-title" className="mt-1 text-2xl font-bold text-[#0f4d3c]">{language === 'fil' ? selectedService.titleFil : selectedService.title}</h3>
              </div>
              <button onClick={() => setSelectedService(null)} aria-label="Close details" className="p-2 text-slate-500 hover:text-slate-900"><X className="w-5 h-5" /></button>
            </div>
            <p className="py-5 text-sm leading-relaxed text-[#374151]">{language === 'fil' ? selectedService.fullDescFil : selectedService.fullDesc}</p>
            <div className="grid gap-4 border-y border-[#dce7e1] py-4 text-sm sm:grid-cols-2">
              <div><div className="font-bold text-[#0f4d3c]">Schedule</div><p className="mt-1 text-[#6b7280]">{language === 'fil' ? selectedService.scheduleFil : selectedService.schedule}</p></div>
              <div><div className="font-bold text-[#0f4d3c]">Location</div><p className="mt-1 text-[#6b7280]">{selectedService.location}</p></div>
              <div><div className="font-bold text-[#0f4d3c]">Care team</div><p className="mt-1 text-[#6b7280]">{selectedService.keyPersonnel.join(', ')}</p></div>
            </div>
            <button disabled={!bookingEnabled} onClick={() => openBookingForProgram(selectedService.id)} className="mt-6 inline-flex min-h-11 items-center justify-center rounded-sm bg-[#0f4d3c] px-4 py-3 text-sm font-bold text-white hover:bg-[#2c7a5f] disabled:cursor-not-allowed disabled:opacity-50">{bookingLabel}</button>
          </section>
        </div>
      ), document.body)}
    </section>
  );
};
