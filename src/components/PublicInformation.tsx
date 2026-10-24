import React from 'react';
import { Bell, CalendarDays, Clock3, Hospital, PackageCheck } from 'lucide-react';
import { useHealthCenter } from '../context/HealthCenterContext';
import { NEWS_UPDATES, OUTREACH_PROGRAMS, SERVICES_DATA } from '../data/healthCenterData';

export const PublicInformation: React.FC = () => {
  const { language } = useHealthCenter();
  const isFilipino = language === 'fil';
  const featuredServices = SERVICES_DATA.filter((service) =>
    ['checkup', 'dental', 'xray', 'maternity', 'pharmacy'].includes(service.category),
  ).slice(0, 4);
  const updates = NEWS_UPDATES.slice(0, 3);
  const outreach = OUTREACH_PROGRAMS.slice(0, 3);

  return (
    <section id="clinic-information" className="border-b border-[#dfe6e1] bg-[#fbfcfa] py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
        <div className="mb-7 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-2 text-xs font-bold text-[#17645c]">Clinic information</div>
            <h2 className="text-2xl font-bold text-[#17312e] sm:text-3xl">
              {isFilipino ? 'Kasalukuyang impormasyon' : 'Current information'}
            </h2>
          </div>
          <p className="text-xs text-[#66736f]">Published schedule · Confirm availability at the clinic</p>
        </div>

        <div className="grid border-y border-[#dfe6e1] lg:grid-cols-[0.75fr_1.25fr]">
          <div className="border-b border-[#dfe6e1] py-6 lg:border-b-0 lg:border-r lg:pr-8">
            <div className="mt-5 grid gap-4 text-sm text-[#66736f]">
              <div className="flex items-start gap-2"><Clock3 className="mt-0.5 h-4 w-4 text-[#17645c]" /><span>Monday-Friday<br /><strong className="text-[#17312e]">7:00 AM-4:00 PM</strong></span></div>
              <div className="flex items-start gap-2"><Hospital className="mt-0.5 h-4 w-4 text-[#17645c]" /><span>{isFilipino ? 'Hinihintay' : 'Current wait time'}<br /><strong className="text-[#17312e]">{isFilipino ? 'Sundin ang counter' : 'Confirm at registration'}</strong></span></div>
            </div>
            <div className="mt-6 border-l-2 border-amber-500 bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-950">
              <strong>Holiday advisory:</strong> Verify clinic operations before visiting on holidays.
            </div>
          </div>

          <div className="py-6 lg:pl-8">
            <div className="grid md:grid-cols-2">
              {featuredServices.map((service) => (
                <article key={service.id} className="border-b border-[#dfe6e1] py-4 md:px-5 md:[&:nth-child(odd)]:pl-0 md:[&:nth-child(even)]:border-l md:[&:nth-child(even)]:pr-0">
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
            <div className="mb-4 flex items-center gap-2"><Bell className="h-4 w-4 text-[#17645c]" /><h3 className="text-lg font-bold text-[#17312e]">Health announcements</h3></div>
            <div className="border-t border-[#dfe6e1]">
              {updates.map((update) => (
                <article key={update.id} className="border-b border-[#dfe6e1] py-4">
                  <div className="text-[11px] font-bold text-[#17645c]">{isFilipino ? update.categoryFil : update.category} · {update.date}</div>
                  <h4 className="mt-1 text-sm font-bold text-[#17312e]">{isFilipino ? update.titleFil : update.title}</h4>
                  <p className="mt-1 text-xs leading-relaxed text-[#66736f]">{isFilipino ? update.summaryFil : update.summary}</p>
                </article>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-4 flex items-center gap-2"><CalendarDays className="h-4 w-4 text-[#17645c]" /><h3 className="text-lg font-bold text-[#17312e]">Upcoming outreach</h3></div>
            <div className="border-t border-[#dfe6e1]">
              {outreach.map((program) => (
                <article key={program.id} className="grid grid-cols-[1fr_auto] gap-4 border-b border-[#dfe6e1] py-4">
                  <div>
                    <div className="text-[11px] font-bold text-[#17645c]">{program.scheduleDate}</div>
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
    </section>
  );
};
