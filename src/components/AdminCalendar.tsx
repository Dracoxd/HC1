import React, { FormEvent, useEffect, useMemo, useState } from 'react';
import { Ban, CalendarDays, ChevronLeft, ChevronRight, Clock3 } from 'lucide-react';

export interface CalendarAppointment {
  id: string;
  patient_name: string;
  reference_code: string;
  service_name: string;
  preferred_date: string;
  preferred_time: string;
  status: string;
}

export interface SlotSetting {
  appointment_date: string;
  time_slot: string;
  capacity: number;
  blocked: number;
}

export interface SlotSettingsForm {
  dateBlocked: boolean;
  morningBlocked: boolean;
  morningCapacity: number;
  afternoonBlocked: boolean;
  afternoonCapacity: number;
  noPreferenceBlocked: boolean;
  noPreferenceCapacity: number;
}

interface AdminCalendarProps {
  appointments: CalendarAppointment[];
  slotSettings: SlotSetting[];
  onSaveSettings: (date: string, settings: SlotSettingsForm) => Promise<void>;
  onSelectAppointment: (id: string) => void;
}

type CalendarView = 'month' | 'week' | 'day';

const todayString = () => new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Manila', year: 'numeric', month: '2-digit', day: '2-digit',
}).format(new Date());

function parseDate(value: string) {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day, 12);
}

function dateString(value: Date) {
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`;
}

function formatDate(value: string, options: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Manila', ...options }).format(new Date(`${value}T12:00:00Z`));
}

function startOfWeek(date: Date) {
  const start = new Date(date);
  start.setDate(start.getDate() - start.getDay());
  return start;
}

export const AdminCalendar: React.FC<AdminCalendarProps> = ({
  appointments, slotSettings, onSaveSettings, onSelectAppointment,
}) => {
  const [selectedDate, setSelectedDate] = useState(todayString);
  const [view, setView] = useState<CalendarView>('month');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const settingsByKey = useMemo(() => new Map(
    slotSettings.map((setting) => [`${setting.appointment_date}:${setting.time_slot}`, setting]),
  ), [slotSettings]);
  const [form, setForm] = useState<SlotSettingsForm>({
    dateBlocked: false,
    morningBlocked: false,
    morningCapacity: 0,
    afternoonBlocked: false,
    afternoonCapacity: 0,
    noPreferenceBlocked: false,
    noPreferenceCapacity: 0,
  });
  const dateBlockedSetting = Number(settingsByKey.get(`${selectedDate}:all_day`)?.blocked) === 1;
  const morningBlockedSetting = Number(settingsByKey.get(`${selectedDate}:morning`)?.blocked) === 1;
  const morningCapacitySetting = Number(settingsByKey.get(`${selectedDate}:morning`)?.capacity ?? 0);
  const afternoonBlockedSetting = Number(settingsByKey.get(`${selectedDate}:afternoon`)?.blocked) === 1;
  const afternoonCapacitySetting = Number(settingsByKey.get(`${selectedDate}:afternoon`)?.capacity ?? 0);
  const noPreferenceBlockedSetting = Number(settingsByKey.get(`${selectedDate}:no preference`)?.blocked) === 1;
  const noPreferenceCapacitySetting = Number(settingsByKey.get(`${selectedDate}:no preference`)?.capacity ?? 0);

  useEffect(() => {
    setForm({
      dateBlocked: dateBlockedSetting,
      morningBlocked: morningBlockedSetting,
      morningCapacity: morningCapacitySetting,
      afternoonBlocked: afternoonBlockedSetting,
      afternoonCapacity: afternoonCapacitySetting,
      noPreferenceBlocked: noPreferenceBlockedSetting,
      noPreferenceCapacity: noPreferenceCapacitySetting,
    });
    setError('');
  }, [selectedDate, dateBlockedSetting, morningBlockedSetting, morningCapacitySetting, afternoonBlockedSetting, afternoonCapacitySetting, noPreferenceBlockedSetting, noPreferenceCapacitySetting]);

  const appointmentsByDate = useMemo(() => appointments
    .filter((appointment) => appointment.status === 'confirmed' || appointment.status === 'pending')
    .reduce<Record<string, CalendarAppointment[]>>((grouped, appointment) => {
    (grouped[appointment.preferred_date] ??= []).push(appointment);
    return grouped;
  }, {}), [appointments]);

  const calendarDays = useMemo(() => {
    const selected = parseDate(selectedDate);
    if (view === 'day') return [dateString(selected)];
    if (view === 'week') {
      const first = startOfWeek(selected);
      return Array.from({ length: 7 }, (_, index) => {
        const day = new Date(first);
        day.setDate(first.getDate() + index);
        return dateString(day);
      });
    }
    const first = new Date(selected.getFullYear(), selected.getMonth(), 1, 12);
    first.setDate(first.getDate() - first.getDay());
    return Array.from({ length: 42 }, (_, index) => {
      const day = new Date(first);
      day.setDate(first.getDate() + index);
      return dateString(day);
    });
  }, [selectedDate, view]);

  const selectedAppointments = useMemo(() => (appointmentsByDate[selectedDate] ?? [])
    .slice()
    .sort((first, second) => {
      const order: Record<string, number> = { morning: 0, afternoon: 1, 'no preference': 2 };
      return (order[first.preferred_time] ?? 3) - (order[second.preferred_time] ?? 3)
        || first.patient_name.localeCompare(second.patient_name);
    }), [appointmentsByDate, selectedDate]);

  const moveCalendar = (direction: number) => {
    const date = parseDate(selectedDate);
    if (view === 'month') {
      const targetMonth = new Date(date.getFullYear(), date.getMonth() + direction, 1, 12);
      const lastDay = new Date(targetMonth.getFullYear(), targetMonth.getMonth() + 1, 0, 12).getDate();
      targetMonth.setDate(Math.min(date.getDate(), lastDay));
      setSelectedDate(dateString(targetMonth));
      return;
    }
    else if (view === 'week') date.setDate(date.getDate() + direction * 7);
    else date.setDate(date.getDate() + direction);
    setSelectedDate(dateString(date));
  };

  const handleSave = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      await onSaveSettings(selectedDate, form);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Slot settings could not be saved.');
    } finally {
      setSaving(false);
    }
  };

  const calendarTitle = view === 'month'
    ? formatDate(`${selectedDate.slice(0, 7)}-01`, { month: 'long', year: 'numeric' })
    : view === 'week'
      ? `${formatDate(calendarDays[0], { month: 'short', day: 'numeric' })} – ${formatDate(calendarDays[6], { month: 'short', day: 'numeric', year: 'numeric' })}`
      : formatDate(selectedDate, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  const timeSlots = [
    { id: 'morning', label: 'Morning', field: 'morning', blocked: form.morningBlocked, capacity: form.morningCapacity },
    { id: 'afternoon', label: 'Afternoon', field: 'afternoon', blocked: form.afternoonBlocked, capacity: form.afternoonCapacity },
    { id: 'no preference', label: 'No preference', field: 'noPreference', blocked: form.noPreferenceBlocked, capacity: form.noPreferenceCapacity },
  ];

  return (
    <section className="grid gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(300px,0.8fr)]">
      <div className="min-w-0 border border-[#dfe6e1] bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#dfe6e1] p-4">
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => moveCalendar(-1)} aria-label="Previous date range" className="border border-[#d9e1dc] p-2 hover:bg-[#f4f6f3]"><ChevronLeft className="h-4 w-4" /></button>
            <button type="button" onClick={() => setSelectedDate(todayString())} className="border border-[#d9e1dc] px-3 py-2 text-xs font-bold hover:bg-[#f4f6f3]">Today</button>
            <button type="button" onClick={() => moveCalendar(1)} aria-label="Next date range" className="border border-[#d9e1dc] p-2 hover:bg-[#f4f6f3]"><ChevronRight className="h-4 w-4" /></button>
            <h2 className="ml-2 text-base font-bold">{calendarTitle}</h2>
          </div>
          <div className="flex border border-[#d9e1dc] p-0.5">
            {(['month', 'week', 'day'] as const).map((option) => (
              <button key={option} type="button" onClick={() => setView(option)} className={`px-3 py-1.5 text-xs font-bold capitalize ${view === option ? 'bg-[#173a37] text-white' : 'text-[#66736f] hover:bg-[#f4f6f3]'}`}>{option}</button>
            ))}
          </div>
        </div>
        {view !== 'day' && (
          <div className="grid grid-cols-7 border-b border-[#dfe6e1] bg-[#f7f9f7]">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => <div key={day} className="py-2 text-center text-[10px] font-bold uppercase text-[#66736f]">{day}</div>)}
          </div>
        )}
        <div className={view === 'day' ? 'p-4' : 'grid grid-cols-7'}>
          {calendarDays.map((date) => {
            const inSelectedMonth = date.slice(0, 7) === selectedDate.slice(0, 7);
            const events = appointmentsByDate[date] ?? [];
            const confirmedCount = events.filter((item) => item.status === 'confirmed').length;
            const pendingCount = events.filter((item) => item.status === 'pending').length;
            const dateBlocked = Number(settingsByKey.get(`${date}:all_day`)?.blocked) === 1;
            return (
              <button
                key={date}
                type="button"
                onClick={() => setSelectedDate(date)}
                className={`${view === 'day' ? 'flex w-full items-center gap-3 border-b border-[#edf1ee] px-2 py-3 text-left' : 'min-h-[76px] border-b border-r border-[#edf1ee] p-1.5 text-left sm:min-h-[104px] sm:p-2'} ${view === 'month' && !inSelectedMonth ? 'bg-[#f8faf8] text-[#a0aaa3]' : ''} ${date === selectedDate ? 'bg-[#edf5f1] ring-1 ring-inset ring-[#17645c]' : 'hover:bg-[#f6f9f6]'}`}
              >
                <span className={`inline-flex h-6 min-w-6 items-center justify-center text-xs font-bold ${date === todayString() ? 'rounded-full bg-[#17645c] text-white' : ''}`}>{Number(date.slice(-2))}</span>
                {dateBlocked && <Ban className="h-3.5 w-3.5 text-rose-700" aria-label="Date blocked" />}
                {view === 'day' && <span className="text-xs text-[#66736f]">{events.length} appointment{events.length === 1 ? '' : 's'}{dateBlocked ? ' · blocked' : ''}</span>}
                {view !== 'day' && (
                  <span className="mt-1 flex flex-col gap-0.5 text-[9px] font-semibold sm:text-[10px]">
                    {confirmedCount > 0 && <span className="truncate text-emerald-800">{confirmedCount} accepted</span>}
                    {pendingCount > 0 && <span className="truncate text-amber-800">{pendingCount} pending</span>}
                    {dateBlocked && <span className="truncate text-rose-700">Blocked</span>}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <div className="flex flex-wrap gap-4 border-t border-[#dfe6e1] px-4 py-3 text-[11px] text-[#66736f]">
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-600" />Accepted</span>
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-amber-500" />Pending</span>
          <span className="flex items-center gap-1.5"><Ban className="h-3.5 w-3.5 text-rose-700" />Blocked date</span>
        </div>
      </div>

      <aside className="space-y-4">
        <section className="border border-[#dfe6e1] bg-white">
          <header className="border-b border-[#edf1ee] px-4 py-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-[#17645c]"><CalendarDays className="h-4 w-4" />Selected date</div>
            <h2 className="mt-1 text-sm font-bold">{formatDate(selectedDate, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</h2>
          </header>
          <div className="max-h-[310px] divide-y divide-[#edf1ee] overflow-y-auto">
            {selectedAppointments.map((appointment) => (
              <button key={appointment.id} type="button" onClick={() => onSelectAppointment(appointment.id)} className="w-full px-4 py-3 text-left hover:bg-[#f6f9f6]">
                <div className="flex items-center justify-between gap-2"><span className="truncate text-sm font-bold">{appointment.patient_name}</span><span className={`shrink-0 px-2 py-1 text-[9px] font-bold uppercase ${appointment.status === 'confirmed' ? 'bg-emerald-100 text-emerald-800' : appointment.status === 'pending' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'}`}>{appointment.status}</span></div>
                <div className="mt-1 flex items-center gap-1 text-xs text-[#66736f]"><Clock3 className="h-3.5 w-3.5" />{appointment.preferred_time} · {appointment.service_name}</div>
              </button>
            ))}
            {selectedAppointments.length === 0 && <p className="px-4 py-5 text-xs text-[#87938c]">No appointment requests for this date.</p>}
          </div>
        </section>

        <form onSubmit={handleSave} className="space-y-4 border border-[#dfe6e1] bg-white p-4">
          <div>
            <h2 className="text-sm font-bold">Manage availability</h2>
            <p className="mt-1 text-xs text-[#66736f]">Capacity counts accepted appointments only. Set 0 for unlimited.</p>
          </div>
          <label className="flex items-center gap-3 border border-rose-100 bg-rose-50/50 p-3 text-xs font-semibold text-[#17312e]">
            <input type="checkbox" checked={form.dateBlocked} onChange={(event) => setForm((current) => ({ ...current, dateBlocked: event.target.checked }))} className="h-4 w-4 accent-rose-700" />
            Block all appointment requests for this date
          </label>
          {timeSlots.map(({ id, label, field, blocked, capacity }) => {
            const acceptedCount = (appointmentsByDate[selectedDate] ?? []).filter((appointment) => appointment.status === 'confirmed' && appointment.preferred_time === id).length;
            return (
              <div key={id} className="space-y-2 border-t border-[#edf1ee] pt-3">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-sm font-bold"><Clock3 className="h-4 w-4 text-[#17645c]" />{label}</label>
                  <label className="flex items-center gap-2 text-xs text-[#66736f]"><input type="checkbox" checked={blocked} onChange={(event) => setForm((current) => ({ ...current, [`${field}Blocked`]: event.target.checked }))} className="h-4 w-4 accent-rose-700" />Blocked</label>
                </div>
                <label className="flex items-center justify-between gap-3 text-xs text-[#66736f]">
                  <span>Maximum accepted <span className="block text-[10px]">Currently {acceptedCount} accepted</span></span>
                  <input type="number" min={0} max={1000} value={capacity} onChange={(event) => setForm((current) => ({ ...current, [`${field}Capacity`]: Math.min(1000, Math.max(0, Number(event.target.value))) }))} className="w-24 border border-[#d9e1dc] px-2 py-1.5 text-right text-sm text-[#17312e]" />
                </label>
                {capacity > 0 && capacity < acceptedCount && <p role="status" className="text-[11px] text-amber-800">Current accepted bookings exceed this limit. No more requests can be accepted in this slot until capacity is increased or an appointment is cancelled.</p>}
              </div>
            );
          })}
          {error && <p role="alert" className="text-xs text-rose-800">{error}</p>}
          <button type="submit" disabled={saving} className="w-full bg-[#17645c] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#104f49] disabled:opacity-60">{saving ? 'Saving availability...' : 'Save availability'}</button>
        </form>
      </aside>
    </section>
  );
};
