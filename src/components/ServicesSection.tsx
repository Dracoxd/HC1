import React, { useState } from 'react';
import { useHealthCenter } from '../context/HealthCenterContext';
import { SERVICES_DATA } from '../data/healthCenterData';
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
  const { t, language, openBookingForProgram } = useHealthCenter();
  const isFilipino = language === 'fil';
  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedService, setSelectedService] = useState<ServiceDetail | null>(null);
  const filteredServices = activeCategory === 'all'
    ? SERVICES_DATA
    : SERVICES_DATA.filter((service) => service.category === activeCategory);

  return (
    <section id="services" className="services-enter py-14 sm:py-18 bg-[#fbfcfa] border-b border-[#dfe6e1]">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5 mb-8">
          <div className="max-w-2xl">
            <div className="text-xs font-bold text-teal-800 uppercase mb-3">Health services</div>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-950">{t.servicesTitle}</h2>
            <p className="mt-3 text-base text-slate-600">Schedules, locations, and service requirements.</p>
          </div>
          <button onClick={() => openBookingForProgram('checkup')} className="text-sm font-bold text-teal-900 underline underline-offset-4">Request a doctor appointment</button>
        </div>

        <div className="flex gap-1 overflow-x-auto border-y border-[#dfe6e1] mb-6" role="tablist" aria-label="Filter health services">
          {categories.map((category) => (
            <button
              key={category.id}
              role="tab"
              aria-selected={activeCategory === category.id}
              onClick={() => setActiveCategory(category.id)}
              className={`px-4 py-3 text-sm font-bold whitespace-nowrap border-b-2 transition-colors duration-200 ${activeCategory === category.id ? 'border-[#17645c] text-[#173a37]' : 'border-transparent text-[#66736f] hover:text-[#173a37]'}`}
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

        <section aria-labelledby="patient-flow-title" className="mt-14 border-t border-slate-200 pt-10">
          <div className="max-w-2xl mb-8">
            <div className="text-xs font-bold text-teal-800 uppercase tracking-wider mb-3">{isFilipino ? 'Gabay sa pagbisita' : 'Plan your visit'}</div>
            <h2 id="patient-flow-title" className="text-3xl sm:text-4xl font-bold text-slate-950">{isFilipino ? 'Daloy ng pasyente' : 'Patient flow'}</h2>
            <p className="mt-3 text-base text-slate-600">{isFilipino ? 'Magsimula sa registration at susundan kayo ng kawani sa tamang serbisyo.' : 'Start at registration and staff will guide you to the right service.'}</p>
          </div>

          <div className="grid lg:grid-cols-[1.15fr_0.85fr] gap-10">
            <div>
              <div className="border-y border-slate-200 divide-y divide-slate-200">
                <div className="flex gap-4 py-4">
                  <span className="text-sm font-bold text-teal-800 tabular-nums">01</span>
                  <div><h3 className="text-base font-bold text-slate-900">{isFilipino ? 'Registration' : 'Registration'}</h3><p className="mt-1 text-sm text-slate-600">{isFilipino ? 'Ihanda ang pangalan, address, at cellphone number.' : 'Provide your name, address, and cellphone number.'}</p></div>
                </div>
                <div className="flex gap-4 py-4">
                  <span className="text-sm font-bold text-teal-800 tabular-nums">02</span>
                  <div><h3 className="text-base font-bold text-slate-900">{isFilipino ? 'Piliin ang tamang care desk' : 'Initial screening'}</h3><p className="mt-1 text-sm text-slate-600">{isFilipino ? 'Dental, pediatric, o women’s health ang magtatakda ng susunod na hakbang.' : 'Dental, pediatric, or women’s health staff will guide the next step.'}</p></div>
                </div>
                <div className="grid sm:grid-cols-3 gap-5 py-5">
                  <div><h3 className="text-sm font-bold text-slate-900">{isFilipino ? 'Dental · edad 20 pataas' : 'Dental · age 20+'}</h3><p className="mt-1 text-sm text-slate-600">{isFilipino ? 'Risk assessment at TB FAST screening. Kung kailangan: PhilHealth enrollment, booklet, at pag-dispense ng gamot.' : 'Risk assessment and TB FAST screening. If needed: PhilHealth enrollment, a booklet, and medicine dispensing.'}</p></div>
                  <div><h3 className="text-sm font-bold text-slate-900">{isFilipino ? 'Pedia · wala pang 20' : 'Pediatrics · under 20'}</h3><p className="mt-1 text-sm text-slate-600">{isFilipino ? 'Vital signs, timbang, at taas. May bakuna at pagtimbang para sa well-baby.' : 'Vital signs, weight, and height. Well-baby visits include vaccination and weighing.'}</p></div>
                  <div><h3 className="text-sm font-bold text-slate-900">{isFilipino ? 'Women’s health' : 'Women’s health'}</h3><p className="mt-1 text-sm text-slate-600">{isFilipino ? 'Family planning, VIA, prenatal care, at konsultasyon.' : 'Family planning, VIA, prenatal care, and consultation.'}</p></div>
                </div>
                <div className="flex gap-4 py-4">
                  <span className="text-sm font-bold text-teal-800 tabular-nums">03</span>
                  <div><h3 className="text-base font-bold text-slate-900">{isFilipino ? 'Konsultasyon at follow-up' : 'Consultation and follow-up'}</h3><p className="mt-1 text-sm text-slate-600">{isFilipino ? 'Ang mga may sakit ay sasailalim sa chief-complaint review at konsultasyon; ire-refer kung kailangan. Magpa-iskedyul ng follow-up check-up.' : 'Patients who are sick are assessed by chief complaint and seen for consultation, with referral when needed. Schedule a follow-up check-up.'}</p></div>
                </div>
              </div>
              <p className="mt-4 text-sm font-semibold text-teal-900">{isFilipino ? 'May iron (ferrous sulfate) at calcium na ibinibigay sa Women’s Health Clinic.' : 'Ferrous sulfate and calcium are dispensed through the Women’s Health Clinic.'}</p>
            </div>

            <div className="divide-y divide-slate-200 border-y border-slate-200">
              <details className="group py-4" open>
                <summary className="cursor-pointer list-none text-base font-bold text-slate-900">{isFilipino ? 'Bago pumunta sa Dental' : 'Before a dental visit'}</summary>
                <ul className="mt-3 list-disc pl-5 space-y-1.5 text-sm text-slate-600">
                  <li>{isFilipino ? 'Kumain ng almusal; maligo at magsipilyo.' : 'Eat breakfast, bathe, and brush your teeth.'}</li>
                  <li>{isFilipino ? 'Magsuot ng malinis na damit; bawal ang sando.' : 'Wear clean clothes; tank tops are not allowed.'}</li>
                  <li>{isFilipino ? 'Magdala ng bimpo o panyo.' : 'Bring a small towel or handkerchief.'}</li>
                  <li>{isFilipino ? 'Edad 19 pataas: magpa-blood pressure sa Admission Area, 3rd floor.' : 'Age 19+: have your blood pressure checked at the 3rd-floor Admission Area.'}</li>
                </ul>
              </details>
              <div className="py-4">
                <h3 className="text-base font-bold text-slate-900">{isFilipino ? 'Pateros X-ray Clinic' : 'Pateros X-ray Clinic'}</h3>
                <p className="mt-1 text-sm text-slate-600">{isFilipino ? 'Lunes 8:00-10:00 AM; Martes-Biyernes 7:00-10:00 AM. 3rd floor.' : 'Monday 8:00-10:00 AM; Tuesday-Friday 7:00-10:00 AM. 3rd floor.'}</p>
                <p className="mt-1 text-sm text-slate-600">{isFilipino ? '2:00 PM ang release ng resulta. Kumpirmahin sa X-ray desk ang araw ng pagkuha kapag nagsumite ng request.' : 'Results are released at 2:00 PM. Confirm the pickup day with the X-ray desk when submitting your request.'}</p>
              </div>
              <div className="py-4">
                <h3 className="text-base font-bold text-slate-900">{isFilipino ? 'Social Hygiene Clinic' : 'Social Hygiene Clinic'}</h3>
                <p className="mt-1 text-sm text-slate-600">{isFilipino ? 'Lunes 8:00 AM-3:00 PM; Martes-Biyernes 9:00 AM-3:00 PM.' : 'Monday 8:00 AM-3:00 PM; Tuesday-Friday 9:00 AM-3:00 PM.'}</p>
                <p className="mt-1 text-sm text-slate-600">{isFilipino ? 'Para sa buntis na may laboratory testing: 8:00-9:00 AM. Tumatanggap ng walk-in na buntis para sa testing.' : 'Pregnancy laboratory testing: 8:00-9:00 AM. Walk-in pregnant patients are accepted for testing.'}</p>
              </div>
              <div className="py-4 text-sm text-rose-900">
                <h3 className="font-bold">{isFilipino ? 'Kagat ng hayop' : 'Animal bite care'}</h3>
                <p className="mt-1">{isFilipino ? 'Magpatingin agad sa clinic para masuri ng health worker. Huwag magpasya online na hindi kailangan ang bakuna o follow-up.' : 'Visit the clinic promptly for assessment by a health worker. Do not use an online chart to decide that vaccination or follow-up is unnecessary.'}</p>
              </div>
            </div>
          </div>
        </section>
      </div>

      {selectedService && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 flex items-center justify-center p-4" onClick={() => setSelectedService(null)}>
          <section role="dialog" aria-modal="true" aria-labelledby="service-dialog-title" onClick={(event) => event.stopPropagation()} className="bg-[#fcfdfb] max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-[0_18px_50px_rgba(23,58,55,0.28)] border border-[#dfe6e1]">
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
            <button onClick={() => openBookingForProgram(selectedService.id)} className="mt-6 inline-flex items-center justify-center px-4 py-3 bg-[#17645c] text-white text-sm font-bold rounded-sm hover:bg-[#104f49]">Request this appointment</button>
          </section>
        </div>
      )}
    </section>
  );
};
