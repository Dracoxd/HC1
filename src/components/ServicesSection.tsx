import React, { useState } from 'react';
import { useHealthCenter } from '../context/HealthCenterContext';
import { SERVICES_DATA, MEDICATIONS_STOCK, ZONES_COVERAGE } from '../data/healthCenterData';
import { ServiceDetail, MedicationStock } from '../types';
import { 
  Heart, 
  Smile, 
  ShieldAlert, 
  Activity, 
  Baby, 
  Pill, 
  Clock, 
  MapPin, 
  User, 
  FileText, 
  ArrowRight, 
  CheckCircle2, 
  Search,
  Building2,
  Calendar
} from 'lucide-react';

export const ServicesSection: React.FC = () => {
  const { t, language, openBookingForProgram, setBookingModalOpen } = useHealthCenter();

  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [selectedService, setSelectedService] = useState<ServiceDetail | null>(null);
  const [medCategoryFilter, setMedCategoryFilter] = useState<string>('all');
  const [selectedZoneTab, setSelectedZoneTab] = useState<'san_pedro' | 'magtanggol' | 'tabacalera'>('magtanggol');

  const filteredServices = activeCategory === 'all' 
    ? SERVICES_DATA 
    : SERVICES_DATA.filter(s => s.category === activeCategory);

  const filteredMeds = medCategoryFilter === 'all'
    ? MEDICATIONS_STOCK
    : MEDICATIONS_STOCK.filter(m => m.category === medCategoryFilter);

  const currentZone = ZONES_COVERAGE.find(z => z.id === selectedZoneTab) || ZONES_COVERAGE[0];

  const getServiceIcon = (category: string) => {
    switch (category) {
      case 'maternity': return <Heart className="w-5 h-5 text-rose-600" />;
      case 'nutrition': return <Baby className="w-5 h-5 text-amber-600" />;
      case 'dental': return <Smile className="w-5 h-5 text-cyan-600" />;
      case 'animal_bite': return <ShieldAlert className="w-5 h-5 text-orange-600" />;
      case 'checkup': return <Activity className="w-5 h-5 text-teal-600" />;
      case 'xray': return <Building2 className="w-5 h-5 text-indigo-600" />;
      case 'pharmacy': return <Pill className="w-5 h-5 text-emerald-600" />;
      default: return <Activity className="w-5 h-5 text-teal-600" />;
    }
  };

  return (
    <section id="services" className="py-16 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        
        {/* Section Header */}
        <div className="max-w-3xl space-y-3">
          <div className="text-xs font-bold text-teal-800 uppercase tracking-wider">
            {language === 'fil' ? 'Pampublikong Serbisyong Medikal' : 'Local Patient Services'}
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight" style={{ textWrap: 'balance' }}>
            {t.servicesTitle}
          </h2>
          <p className="text-base text-slate-600">
            {t.servicesSubtitle}
          </p>
        </div>

        {/* Filter Bar (Interactive segmented controls, functional buttons per design constitution) */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl overflow-x-auto">
          {[
            { id: 'all', label: t.serviceTabAll },
            { id: 'maternity', label: t.serviceTabMaternal },
            { id: 'nutrition', label: t.serviceTabNutrition },
            { id: 'dental', label: t.serviceTabDental },
            { id: 'animal_bite', label: t.serviceTabRabies },
            { id: 'checkup', label: t.serviceTabOPD },
            { id: 'xray', label: t.serviceTabXray },
            { id: 'pharmacy', label: t.serviceTabMeds },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveCategory(tab.id)}
              className={`px-3 py-2 text-xs font-medium rounded-lg whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                activeCategory === tab.id
                  ? 'bg-white text-slate-900 shadow-sm font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Services Grid (Single elevation, hairline borders, rich information) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServices.map((service) => (
            <div
              key={service.id}
              className="bg-white rounded-xl border border-slate-200 hover:border-slate-300 transition-all flex flex-col justify-between overflow-hidden shadow-xs"
            >
              {/* Optional Service Image Thumbnail */}
              {service.image && (
                <div className="aspect-[16/9] w-full bg-slate-100 overflow-hidden relative">
                  <img
                    src={service.image}
                    alt={service.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                  <div className="absolute top-2 right-2 bg-slate-900/80 backdrop-blur-xs text-white text-[11px] px-2.5 py-1 rounded-md font-medium">
                    {language === 'fil' ? service.badgeFil : service.badge}
                  </div>
                </div>
              )}

              <div className="p-6 space-y-4 flex-1">
                {/* Header Lockup */}
                <div className="flex items-start justify-between gap-3">
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                    {getServiceIcon(service.category)}
                  </div>
                  {!service.image && (
                    <span className="text-xs font-medium text-teal-800 bg-teal-50 px-2 py-0.5 rounded">
                      {language === 'fil' ? service.badgeFil : service.badge}
                    </span>
                  )}
                </div>

                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-slate-900">
                    {language === 'fil' ? service.titleFil : service.title}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {language === 'fil' ? service.shortDescFil : service.shortDesc}
                  </p>
                </div>

                {/* Quiet unboxed metadata */}
                <div className="pt-2 border-t border-slate-100 space-y-2 text-xs text-slate-600">
                  <div className="flex items-start gap-2">
                    <Clock className="w-3.5 h-3.5 text-teal-700 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-slate-800">{t.labelSchedule}:</span>{' '}
                      <span>{language === 'fil' ? service.scheduleFil : service.schedule}</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <MapPin className="w-3.5 h-3.5 text-teal-700 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-slate-800">{t.labelLocation}:</span>{' '}
                      <span>{service.location}</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <User className="w-3.5 h-3.5 text-teal-700 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-slate-800">{t.labelPersonnel}:</span>{' '}
                      <span className="text-slate-700">{service.keyPersonnel.join(', ')}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="px-6 py-3 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => setSelectedService(service)}
                  className="text-xs font-semibold text-teal-800 hover:text-teal-900 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <span>{t.btnViewRequirements}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => openBookingForProgram(service.id === 'xray' ? 'xray-early-screening' : (service.id === 'dental' ? 'dental-mwf-caravan' : (service.id === 'nutrition' ? 'opt-2026' : 'opt-2026')))}
                  className="px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-md transition-colors cursor-pointer"
                >
                  {t.btnBookThisService}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Free Maintenance Medications Inventory Showcase */}
        <div className="pt-10 border-t border-slate-200 space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="space-y-2 max-w-2xl">
              <div className="text-xs font-bold text-teal-800 uppercase tracking-wider">
                {language === 'fil' ? 'Botika ng Bayan' : 'Pharmacy Dispensary'}
              </div>
              <h3 className="text-2xl font-bold text-slate-900">
                {t.medsTitle}
              </h3>
              <p className="text-sm text-slate-600">
                {t.medsSubtitle}
              </p>
            </div>

            {/* Medication Filter Tabs */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg shrink-0">
              <button
                onClick={() => setMedCategoryFilter('all')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md cursor-pointer ${
                  medCategoryFilter === 'all' ? 'bg-white text-slate-900 shadow-sm font-semibold' : 'text-slate-600'
                }`}
              >
                {t.filterAllMeds}
              </button>
              <button
                onClick={() => setMedCategoryFilter('hypertension')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md cursor-pointer ${
                  medCategoryFilter === 'hypertension' ? 'bg-white text-slate-900 shadow-sm font-semibold' : 'text-slate-600'
                }`}
              >
                {t.filterHypertension}
              </button>
              <button
                onClick={() => setMedCategoryFilter('diabetes')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md cursor-pointer ${
                  medCategoryFilter === 'diabetes' ? 'bg-white text-slate-900 shadow-sm font-semibold' : 'text-slate-600'
                }`}
              >
                {t.filterDiabetes}
              </button>
              <button
                onClick={() => setMedCategoryFilter('tb')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md cursor-pointer ${
                  medCategoryFilter === 'tb' ? 'bg-white text-slate-900 shadow-sm font-semibold' : 'text-slate-600'
                }`}
              >
                {t.filterTB}
              </button>
            </div>
          </div>

          {/* Table of Medications */}
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Medication & Generic Name</th>
                  <th className="py-3 px-4">Program Category</th>
                  <th className="py-3 px-4">Dosage Form</th>
                  <th className="py-3 px-4 text-right">Units on Hand</th>
                  <th className="py-3 px-4">Refill Schedule</th>
                  <th className="py-3 px-4">Required Documents</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 bg-white">
                {filteredMeds.map((med) => (
                  <tr key={med.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      <div>{med.name}</div>
                      <div className="text-[11px] font-normal text-slate-500">
                        {language === 'fil' ? med.purposeFil : med.purpose}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-teal-800">
                      {language === 'fil' ? med.categoryLabelFil : med.categoryLabel}
                    </td>
                    <td className="py-3.5 px-4">{med.dosage}</td>
                    <td className="py-3.5 px-4 text-right font-mono tabular-nums font-semibold text-slate-900">
                      {med.availableUnits.toLocaleString()} tabs
                    </td>
                    <td className="py-3.5 px-4">
                      {language === 'fil' ? med.refillScheduleFil : med.refillSchedule}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {language === 'fil' ? med.requirementsFil : med.requirements}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Catchment Zones Explorer (San Pedro, Magtanggol, Tabacalera) */}
        <div className="pt-10 border-t border-slate-200 space-y-6">
          <div className="max-w-2xl space-y-2">
            <div className="text-xs font-bold text-teal-800 uppercase tracking-wider">
              {language === 'fil' ? 'Mga Sakop na Purok at Barangay' : 'Catchment Area Guide'}
            </div>
            <h3 className="text-2xl font-bold text-slate-900">{t.zonesTitle}</h3>
            <p className="text-sm text-slate-600">{t.zonesSubtitle}</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Zone Selector Buttons */}
            <div className="lg:col-span-4 space-y-2">
              {ZONES_COVERAGE.map((zone) => (
                <button
                  key={zone.id}
                  onClick={() => setSelectedZoneTab(zone.id)}
                  className={`w-full text-left p-4 rounded-xl border transition-all cursor-pointer ${
                    selectedZoneTab === zone.id
                      ? 'bg-teal-50/80 border-teal-600 shadow-xs'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-slate-900">{zone.name}</span>
                    <span className="text-xs font-mono tabular-nums text-teal-800 font-semibold">{zone.coverageRate}</span>
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    {zone.poblacion} · {zone.activePatients.toLocaleString()} {t.labelActiveResidents}
                  </div>
                </button>
              ))}
            </div>

            {/* Zone Details Card */}
            <div className="lg:col-span-8 bg-slate-50 rounded-xl p-6 border border-slate-200 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div>
                  <h4 className="text-lg font-bold text-slate-900">{currentZone.name}</h4>
                  <p className="text-xs text-slate-500">{currentZone.poblacion}</p>
                </div>
                <div className="text-xs text-slate-600">
                  <span className="font-semibold text-slate-900">{currentZone.activePatients}</span> patients registered
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-700">
                <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1">
                  <div className="text-slate-500 font-medium">{t.labelAssignedBNS}</div>
                  <div className="font-semibold text-slate-900">
                    {currentZone.assignedBNS.join(', ')}
                  </div>
                  <div className="text-[11px] text-teal-700">
                    {language === 'fil' ? 'Nangangasiwa sa OPT 0-59 buwan' : 'Lead for 0-59 months OPT screening'}
                  </div>
                </div>

                <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1">
                  <div className="text-slate-500 font-medium">{t.labelAssignedMidwife}</div>
                  <div className="font-semibold text-slate-900">{currentZone.assignedMidwife}</div>
                  <div className="text-[11px] text-slate-500">Maternal & prenatal care coordination</div>
                </div>

                <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1">
                  <div className="text-slate-500 font-medium">{t.labelAssignedNurse}</div>
                  <div className="font-semibold text-slate-900">{currentZone.designatedNurse}</div>
                  <div className="text-[11px] text-slate-500">Immunization & triage supervision</div>
                </div>

                <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1">
                  <div className="text-slate-500 font-medium">{t.labelCommunityDays}</div>
                  <div className="font-semibold text-teal-800">
                    {language === 'fil' ? currentZone.communityOutreachDaysFil : currentZone.communityOutreachDays}
                  </div>
                  <div className="text-[11px] text-slate-500">Field visits & feeding programs</div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Service Detail Modal */}
      {selectedService && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-xl max-h-[90vh] overflow-y-auto border border-slate-200">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <div className="text-xs font-semibold text-teal-800 uppercase tracking-wide">
                  {language === 'fil' ? selectedService.badgeFil : selectedService.badge}
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mt-1">
                  {language === 'fil' ? selectedService.titleFil : selectedService.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedService(null)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-sm text-slate-700">
              <p className="leading-relaxed">
                {language === 'fil' ? selectedService.fullDescFil : selectedService.fullDesc}
              </p>

              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2 text-xs">
                <div className="font-bold text-slate-900">{t.labelSchedule}</div>
                <div className="text-slate-700">
                  {language === 'fil' ? selectedService.scheduleFil : selectedService.schedule}
                </div>

                <div className="font-bold text-slate-900 pt-2">{t.labelLocation}</div>
                <div className="text-slate-700">{selectedService.location}</div>

                <div className="font-bold text-slate-900 pt-2">{t.labelPersonnel}</div>
                <div className="text-slate-700">{selectedService.keyPersonnel.join(', ')}</div>
              </div>

              <div className="space-y-2">
                <div className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                  {t.labelRequirements}
                </div>
                <ul className="space-y-2 text-xs text-slate-600">
                  {(language === 'fil' ? selectedService.requirementsFil : selectedService.requirements).map((req, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
                      <span>{req}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                onClick={() => setSelectedService(null)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => {
                  const sId = selectedService.id;
                  setSelectedService(null);
                  openBookingForProgram(sId === 'xray' ? 'xray-early-screening' : (sId === 'dental' ? 'dental-mwf-caravan' : 'opt-2026'));
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg cursor-pointer"
              >
                {t.btnBookThisService}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
