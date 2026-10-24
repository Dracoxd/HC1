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
  const { language, setBookingModalOpen } = useHealthCenter();
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

  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' });
  const dates = Array.from(new Set([
    ...Array.from({ length: 14 }, (_, index) => {
      const date = new Date(`${today}T12:00:00+08:00`);
      date.setDate(date.getDate() + index);
      return date.toISOString().slice(0, 10);
    }),
    ...slots.map((slot) => slot.date),
  ])).sort().filter((date) => date >= today && new Date(`${date}T12:00:00+08:00`).getDay() !== 0);

  const timeLabels: Record<string, string> = {
    morning: isFilipino ? 'Umaga' : 'Morning',
    afternoon: isFilipino ? 'Hapon' : 'Afternoon',
    'no preference': isFilipino ? 'Anumang oras' : 'Any time',
  };

  return (
    <section id="appointment-schedule" className="border-b border-[#dfe6e1] bg-white py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
        <div className="mb-7 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-2 text-xs font-bold text-[#17645c]">Appointment schedule</div>
            <h2 className="text-2xl font-bold text-[#17312e] sm:text-3xl">
              {isFilipino ? 'Mga petsa at oras' : 'Dates and Time Slots'}
            </h2>
          </div>
          <button type="button" onClick={() => setBookingModalOpen(true)} className="inline-flex h-11 items-center justify-center gap-2 bg-[#17645c] px-4 text-sm font-bold text-white hover:bg-[#104f49]">
            <CalendarDays className="h-4 w-4" />
            {isFilipino ? 'Mag-request ng appointment' : 'Request appointment'}
          </button>
        </div>

        {loading && <p className="border-y border-[#dfe6e1] py-5 text-sm text-[#66736f]">Loading schedule...</p>}
        {error && <p role="alert" className="border-y border-[#dfe6e1] py-5 text-sm text-rose-800">{error}</p>}

        {!loading && !error && (
          <div className="border-t border-[#cfd8d2]">
            {dates.map((date) => {
              const weekday = new Date(`${date}T12:00:00+08:00`).getDay();
              if (weekday === 0) return null;
              const dateSlots = slots.filter((slot) => slot.date === date);
              const availableLabels = dateSlots.length > 0
                ? ['morning', 'afternoon', 'no preference'].filter((time) => dateSlots.some((slot) => slot.time === time))
                : ['morning', 'afternoon'];

              return (
                <article key={date} className="grid gap-4 border-b border-[#dfe6e1] py-5 md:grid-cols-[220px_1fr] md:items-start">
                  <div>
                    <div className="text-[11px] font-bold text-[#17645c]">{date}</div>
                    <h3 className="mt-1 text-sm font-bold text-[#17312e]">{dateLabel(date)}</h3>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {availableLabels.map((time) => {
                      const bookingCount = dateSlots.find((slot) => slot.time === time)?.bookedCount ?? 0;
                      return (
                        <button
                          key={time}
                          type="button"
                          onClick={() => setBookingModalOpen(true)}
                          className="flex min-h-[72px] items-center justify-between gap-3 border border-[#cfd8d2] px-4 text-left hover:border-[#17645c] hover:bg-[#f2f6f2]"
                        >
                          <span>
                            <span className="flex items-center gap-2 text-sm font-bold text-[#17312e]"><Clock3 className="h-4 w-4 text-[#17645c]" />{timeLabels[time]}</span>
                            <span className="mt-1 block text-xs text-[#66736f]">{bookingCount > 0 ? `${bookingCount} request${bookingCount === 1 ? '' : 's'} received` : (isFilipino ? 'May slot na maaaring magamit' : 'Slots may be available')}</span>
                          </span>
                          <span className="text-xs font-bold text-[#17645c]">Select</span>
                        </button>
                      );
                    })}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};
