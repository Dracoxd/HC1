import React, { useEffect, useState } from 'react';
import { CalendarDays, Clock3, MapPin } from 'lucide-react';
import { useHealthCenter } from '../context/HealthCenterContext';

interface ScheduleSlot {
  date: string;
  time: string;
  bookedCount: number;
}

function dateLabel(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Manila', weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  }).format(new Date(`${value}T12:00:00+08:00`));
}

export const AppointmentSchedule: React.FC = () => {
  const { language, siteContent } = useHealthCenter();
  const isFilipino = language === 'fil';
  const settings = siteContent.settings;
  const [slots, setSlots] = useState<ScheduleSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadSchedule = () => {
    const controller = new AbortController();
    void fetch('/api/appointments', { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error('Schedule unavailable');
        return response.json() as Promise<{ slots: ScheduleSlot[] }>;
      })
      .then((data) => setSlots(data.slots))
      .catch((caught) => {
        if (caught instanceof DOMException && caught.name === 'AbortError') return;
        setError(isFilipino ? 'Hindi ma-load ang iskedyul.' : 'Schedule could not be loaded.');
      })
      .finally(() => setLoading(false));
    return controller;
    };
    let controller = loadSchedule();
    const timer = window.setInterval(() => {
      controller.abort();
      controller = loadSchedule();
    }, 3000);
    return () => {
      controller.abort();
      window.clearInterval(timer);
    };
  }, [isFilipino]);

  const timeLabels: Record<string, string> = {
    morning: isFilipino ? 'Umaga' : 'Morning',
    afternoon: isFilipino ? 'Hapon' : 'Afternoon',
    'no preference': isFilipino ? 'Anumang oras' : 'Any time',
  };
  const timeOrder: Record<string, number> = { morning: 0, afternoon: 1, 'no preference': 2 };
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' });
  const appointmentsByDate = slots.reduce<Record<string, ScheduleSlot[]>>((grouped, slot) => {
    (grouped[slot.date] ??= []).push(slot);
    return grouped;
  }, {});
  const dates = Object.keys(appointmentsByDate).filter((date) => date >= today).sort();

  return (
    <section id="appointment-schedule" className="site-section-bg section-enter border-b border-[#dce7e1] py-8 sm:py-10">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
        <div className="breadcrumb">Home <span aria-hidden="true">/</span> <span className="font-semibold text-[#0f4d3c]">Schedule</span></div>
        <div className="mb-7">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-bold text-[#2c7a5f]">
              <CalendarDays className="h-4 w-4" />
              {isFilipino ? 'Mga kumpirmadong appointment' : 'Accepted appointments'}
            </div>
            <h2 className="text-2xl font-bold text-[#0f4d3c] sm:text-3xl">
              {isFilipino ? 'Mga petsa at oras' : 'Dates and Time Slots'}
            </h2>
          </div>
        </div>

        {loading && <p className="border-y border-[#dce7e1] py-5 text-sm text-[#6b7280]">{isFilipino ? 'Nilo-load ang mga kumpirmadong appointment...' : 'Loading accepted appointments...'}</p>}
        {error && <p role="alert" className="border-y border-[#dce7e1] py-5 text-sm text-rose-800">{error}</p>}

        {!loading && !error && (
          dates.length === 0 ? (
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(260px,0.7fr)]">
              <div className="site-card flex flex-col items-start p-6 sm:p-8">
                <CalendarDays className="h-8 w-8 text-[#2c7a5f]" aria-hidden="true" />
                <h3 className="mt-4 text-xl font-bold text-[#0f4d3c]">{isFilipino ? 'Iskedyul ng appointment' : 'Appointment schedule'}</h3>
                <p className="mt-2 max-w-xl text-sm leading-relaxed text-[#6b7280]">
                  {isFilipino ? 'Lalabas dito ang mga oras ng appointment kapag naaprubahan na ng clinic staff.' : 'Approved appointment times will appear here after clinic staff accept them.'}
                </p>
              </div>
              <aside className="site-card p-5 sm:p-6">
                <h3 className="text-sm font-bold text-[#0f4d3c]">{isFilipino ? 'Mabilisang impormasyon' : 'Quick information'}</h3>
                <dl className="mt-4 space-y-4 text-sm">
                  <div><dt className="flex items-center gap-2 font-semibold text-[#374151]"><Clock3 className="h-4 w-4 text-[#2c7a5f]" />{isFilipino ? 'Oras ng klinika' : 'Clinic hours'}</dt><dd className="mt-1 pl-6 text-[#6b7280]">{isFilipino ? settings.clinicHoursFil : settings.clinicHours}</dd></div>
                  <div><dt className="flex items-center gap-2 font-semibold text-[#374151]"><MapPin className="h-4 w-4 text-[#2c7a5f]" />{isFilipino ? 'Lokasyon' : 'Location'}</dt><dd className="mt-1 pl-6 text-[#6b7280]">{isFilipino ? settings.clinicAddressFil : settings.clinicAddress}</dd></div>
                </dl>
              </aside>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {dates.flatMap((date) => appointmentsByDate[date]
                .slice()
                .sort((first, second) => (timeOrder[first.time] ?? 99) - (timeOrder[second.time] ?? 99))
                .map((slot) => (
                  <article key={`${date}-${slot.time}`} className="site-card p-5 transition-colors hover:border-[#9bbdad]">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-[#2c7a5f]">{date}</p>
                    <h3 className="mt-1 text-sm font-bold text-[#0f4d3c]">{dateLabel(date)}</h3>
                    <div className="mt-5 flex items-center gap-2 border-t border-[#e7eee9] pt-4">
                      <Clock3 className="h-5 w-5 shrink-0 text-[#2c7a5f]" />
                      <span className="text-base font-bold text-[#0f4d3c]">{timeLabels[slot.time] ?? slot.time}</span>
                    </div>
                    <p className="mt-3 text-sm text-[#6b7280]">
                      <strong className="text-[#374151]">{slot.bookedCount}</strong> {isFilipino ? 'appointment na naaprubahan' : `accepted ${slot.bookedCount === 1 ? 'appointment' : 'appointments'}`}
                    </p>
                  </article>
                )))
              }
            </div>
          )
        )}
        {!loading && !error && dates.length > 0 && (
          <div className="mt-5 flex flex-wrap items-start gap-x-8 gap-y-3 border-t border-[#dce7e1] pt-4 text-xs text-[#6b7280]">
            <span className="flex items-start gap-2"><Clock3 className="mt-0.5 h-4 w-4 text-[#2c7a5f]" />{isFilipino ? settings.clinicHoursFil : settings.clinicHours}</span>
            <span className="flex items-start gap-2"><MapPin className="mt-0.5 h-4 w-4 text-[#2c7a5f]" />{isFilipino ? settings.clinicAddressFil : settings.clinicAddress}</span>
          </div>
        )}
      </div>
    </section>
  );
};
