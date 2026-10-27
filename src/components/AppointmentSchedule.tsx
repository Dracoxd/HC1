import React, { useEffect, useState } from 'react';
import { CalendarDays, Clock3 } from 'lucide-react';
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
  const { language } = useHealthCenter();
  const isFilipino = language === 'fil';
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
    <section id="appointment-schedule" className="site-section-bg section-enter border-b border-[#dfe6e1] py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
        <div className="mb-7">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-bold text-[#17645c]">
              <CalendarDays className="h-4 w-4" />
              {isFilipino ? 'Mga kumpirmadong appointment' : 'Accepted appointments'}
            </div>
            <h2 className="text-2xl font-bold uppercase text-[#17312e] sm:text-3xl">
              {isFilipino ? 'Mga petsa at oras' : 'Dates and Time Slots'}
            </h2>
          </div>
        </div>

        {loading && <p className="border-y border-[#dfe6e1] py-5 text-sm text-[#66736f]">{isFilipino ? 'Nilo-load ang mga kumpirmadong appointment...' : 'Loading accepted appointments...'}</p>}
        {error && <p role="alert" className="border-y border-[#dfe6e1] py-5 text-sm text-rose-800">{error}</p>}

        {!loading && !error && (
          dates.length === 0 ? (
            <p className="border-y border-[#dfe6e1] py-5 text-sm text-[#66736f]">
              {isFilipino ? 'Wala pang kumpirmadong appointment.' : 'There are no accepted appointments yet.'}
            </p>
          ) : (
            <div className="overflow-hidden border border-[#dfe6e1]">
              <div className="hidden grid-cols-[minmax(220px,0.8fr)_minmax(0,1.5fr)] bg-[#f2f6f2] px-5 py-3 text-[11px] font-bold uppercase tracking-wide text-[#66736f] sm:grid">
                <span>{isFilipino ? 'Petsa' : 'Date'}</span>
                <span>{isFilipino ? 'Mga oras' : 'Time slots'}</span>
              </div>
              {dates.map((date) => (
                <article key={date} className="grid min-w-0 gap-3 border-t border-[#dfe6e1] px-3 py-4 sm:grid-cols-[minmax(220px,0.8fr)_minmax(0,1.5fr)] sm:items-center sm:px-5">
                  <div>
                    <div className="text-[11px] font-bold text-[#17645c]">{date}</div>
                    <h3 className="mt-1 text-sm font-bold text-[#17312e]">{dateLabel(date)}</h3>
                  </div>
                  <div className="flex min-w-0 flex-wrap gap-2">
                    {appointmentsByDate[date]
                      .sort((first, second) => (timeOrder[first.time] ?? 99) - (timeOrder[second.time] ?? 99))
                      .map((slot) => (
                        <div key={slot.time} className="flex min-h-11 min-w-0 max-w-full items-center gap-2 border border-[#cfd8d2] bg-white px-2.5 py-2 sm:px-3">
                          <Clock3 className="h-4 w-4 shrink-0 text-[#17645c]" />
                          <span className="text-sm font-bold text-[#17312e]">{timeLabels[slot.time] ?? slot.time}</span>
                          <span className="border-l border-[#dfe6e1] pl-2 text-xs text-[#66736f]">
                            {slot.bookedCount} {isFilipino ? 'kumpirmado' : `accepted ${slot.bookedCount === 1 ? 'appointment' : 'appointments'}`}
                          </span>
                        </div>
                      ))}
                  </div>
                </article>
              ))}
            </div>
          )
        )}
      </div>
    </section>
  );
};
