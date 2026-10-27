import React, { useEffect, useState } from 'react';
import { Bell, CalendarDays, Clock3, PackageCheck } from 'lucide-react';
import { useHealthCenter } from '../context/HealthCenterContext';

export const PublicInformation: React.FC = () => {
  const { language, siteContent, siteContentError } = useHealthCenter();
  const isFilipino = language === 'fil';
  const featuredServices = siteContent.services.filter((service) =>
    ['checkup', 'dental', 'xray', 'maternity', 'pharmacy'].includes(service.category),
  ).slice(0, 4);
  const updates = siteContent.news.slice(0, 3);
  const outreach = siteContent.outreach.slice(0, 3);
  const settings = siteContent.settings;
  const [viewingImage, setViewingImage] = useState<{ url: string; alt: string } | null>(null);

  useEffect(() => {
    if (!viewingImage) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setViewingImage(null);
    };
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [viewingImage]);

  return (
    <section id="clinic-information" className="site-section-bg section-enter border-b border-[#dfe6e1] py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
        {siteContentError && <p role="status" className="mb-4 border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900">{isFilipino ? 'Hindi ma-refresh ang pinakabagong impormasyon ng klinika; ipinapakita ang huling na-save na nilalaman.' : 'Clinic information could not be refreshed; showing the last saved content.'}</p>}
        <div className="mb-7 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-2 text-xs font-bold text-[#17645c]">Clinic information</div>
            <h2 className="text-2xl font-bold uppercase text-[#17312e] sm:text-3xl">
              {isFilipino ? 'Kasalukuyang impormasyon' : 'Current information'}
            </h2>
          </div>
          <p className="text-xs text-[#66736f]">Published schedule · Confirm availability at the clinic</p>
        </div>

        <div className="reveal-stagger grid border-y border-[#dfe6e1] lg:grid-cols-[0.75fr_1.25fr]">
          <div className="border-b border-[#dfe6e1] py-6 lg:border-b-0 lg:border-r lg:pr-8">
            <div className="mt-5 grid gap-4 text-sm text-[#66736f]">
              <div className="flex items-start gap-2"><Clock3 className="mt-0.5 h-4 w-4 text-[#17645c]" /><span>{isFilipino ? 'Oras ng klinika' : 'Clinic hours'}<br /><strong className="text-[#17312e]">{isFilipino ? settings.clinicHoursFil : settings.clinicHours}</strong></span></div>
              <div className="ml-6 text-xs leading-relaxed text-[#66736f]">
                <p>{isFilipino ? settings.doctorHoursFil : settings.doctorHours}</p>
                <p className="mt-1">{isFilipino ? settings.xrayHoursFil : settings.xrayHours}</p>
                <p className="mt-1">{isFilipino ? settings.dentalHoursFil : settings.dentalHours}</p>
              </div>
            </div>
            <div className="mt-6 border-l-2 border-amber-500 bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-950">
              <strong>{isFilipino ? 'Pabatid sa holiday:' : 'Holiday advisory:'}</strong> {isFilipino ? settings.holidayAdvisoryFil : settings.holidayAdvisory}
            </div>
          </div>

          <div className="py-6 lg:pl-8">
            <div className="grid md:grid-cols-2">
              {featuredServices.map((service) => (
                <article key={service.id} className="reveal-card border-b border-[#dfe6e1] py-4 md:px-5 md:[&:nth-child(odd)]:pl-0 md:[&:nth-child(even)]:border-l md:[&:nth-child(even)]:pr-0">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-bold text-[#17312e]">{isFilipino ? service.titleFil : service.title}</h3>
                      <p className="mt-1 text-xs text-[#66736f]">{service.badge}</p>
                    </div>
                    <span className="shrink-0 border border-[#c7d5cd] px-2 py-1 text-[10px] font-bold text-[#17645c]">
                      {service.category === 'dental' || service.category === 'xray' ? (isFilipino ? 'Nangangailangan ng appointment' : 'Appointment required') : (isFilipino ? 'Walk-in / Appointment' : 'Walk-in / Appointment')}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-10 grid gap-10 lg:grid-cols-2">
          <div>
            <div className="mb-4 flex items-center gap-2"><Bell className="h-4 w-4 text-[#17645c]" /><h3 className="text-lg font-bold uppercase text-[#17312e]">Health announcements</h3></div>
            <div className="reveal-stagger border-t border-[#dfe6e1]">
              {updates.map((update) => (
                <article key={update.id} className="reveal-card border-b border-[#dfe6e1] py-4">
                  {update.imageUrl && (
                    <button
                      type="button"
                      onClick={() => {
                        const url = update.imageUrl;
                        if (url) setViewingImage({ url, alt: isFilipino ? update.titleFil : update.title });
                      }}
                      aria-label={isFilipino ? `Tingnan ang buong larawan: ${update.titleFil}` : `View full image: ${update.title}`}
                      className="mb-3 block w-full cursor-zoom-in overflow-hidden bg-[#edf1ee]"
                    >
                      <img src={update.imageUrl} alt={isFilipino ? update.titleFil : update.title} loading="lazy" decoding="async" className="aspect-[16/9] w-full object-cover transition-transform hover:scale-[1.02]" />
                    </button>
                  )}
                  <h4 className="mt-1 text-sm font-bold text-[#17312e]">{isFilipino ? update.titleFil : update.title}</h4>
                  <p className="mt-1 text-xs leading-relaxed text-[#66736f]">{isFilipino ? update.summaryFil : update.summary}</p>
                </article>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-4 flex items-center gap-2"><CalendarDays className="h-4 w-4 text-[#17645c]" /><h3 className="text-lg font-bold uppercase text-[#17312e]">Upcoming outreach</h3></div>
            <div className="reveal-stagger border-t border-[#dfe6e1]">
              {outreach.map((program) => (
                <article key={program.id} className="reveal-card grid grid-cols-[1fr_auto] gap-4 border-b border-[#dfe6e1] py-4">
                  <div>
                    <h4 className="mt-1 text-sm font-bold text-[#17312e]">{isFilipino ? program.titleFil : program.title}</h4>
                    <p className="mt-1 text-xs text-[#66736f]">{program.location}</p>
                  </div>
                  <PackageCheck className="h-5 w-5 text-[#17645c]" />
                </article>
              ))}
            </div>
          </div>
        </div>
      </div>
      {viewingImage && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={viewingImage.alt}
          className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/90 p-2 pt-[max(0.5rem,env(safe-area-inset-top))] pb-[max(0.5rem,env(safe-area-inset-bottom))] sm:p-8"
          onMouseDown={(event) => { if (event.target === event.currentTarget) setViewingImage(null); }}
        >
          <button type="button" onClick={() => setViewingImage(null)} aria-label="Close image" className="absolute right-[max(0.75rem,env(safe-area-inset-right))] top-[max(0.75rem,env(safe-area-inset-top))] flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20">
            <span className="text-xl leading-none">×</span>
          </button>
          <img src={viewingImage.url} alt={viewingImage.alt} className="max-h-[calc(100dvh-1rem-env(safe-area-inset-top)-env(safe-area-inset-bottom))] max-w-full object-contain sm:max-h-[92vh]" />
        </div>
      )}
    </section>
  );
};
