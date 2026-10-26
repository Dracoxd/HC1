import React, { FormEvent, useEffect, useMemo, useState } from 'react';
import { auth } from '../firebase';
import { CalendarCheck2, CalendarDays, Check, CheckCircle2, ChevronLeft, Clock3, LockKeyhole, MessageCircle, Search, Send, Trash2, X } from 'lucide-react';
import { AdminCalendar, SlotSetting, SlotSettingsForm } from './AdminCalendar';
import { AdminContentManager } from './AdminContentManager';
import { AdminReports } from './AdminReports';

interface AppointmentRow {
  id: string;
  owner_uid: string;
  reference_code: string;
  patient_name: string;
  phone: string;
  email: string;
  zone: string;
  service_name: string;
  preferred_date: string;
  preferred_time: string;
  status: string;
  chat_status: string;
  created_at: string;
}

interface ChatMessage {
  id: string;
  appointment_id: string;
  sender_uid: string;
  sender_role: string;
  sender_name: string;
  message: string;
  created_at: string;
}

export const AdminPanel: React.FC = () => {
  const [appointments, setAppointments] = useState<AppointmentRow[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [slotSettings, setSlotSettings] = useState<SlotSetting[]>([]);
  const [activeTab, setActiveTab] = useState<'requests' | 'calendar' | 'content' | 'reports'>('requests');
  const [selectedId, setSelectedId] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [clinicOpen, setClinicOpen] = useState<boolean | null>(null);
  const [clinicStatusSaving, setClinicStatusSaving] = useState(false);
  const [error, setError] = useState('');

  const loadWorkspace = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;
      const token = await user.getIdToken();
      const response = await fetch('/api/admin', { headers: { Authorization: `Bearer ${token}` } });
      if (!response.ok) throw new Error(response.status === 403 ? 'This account is not an admin.' : 'Admin workspace could not be loaded.');
      const data = await response.json() as { role: string; appointments: AppointmentRow[]; messages: ChatMessage[]; slotSettings?: SlotSetting[] };
      if (data.role !== 'admin') throw new Error('This account is not an admin.');
      setAppointments(data.appointments.slice().sort((first, second) =>
        second.created_at.localeCompare(first.created_at) || second.id.localeCompare(first.id)));
      setMessages(data.messages);
      setSlotSettings(data.slotSettings ?? []);
      const statusToken = await user.getIdToken();
      const statusResponse = await fetch('/api/admin?mode=clinic_status', {
        headers: { Authorization: `Bearer ${statusToken}` },
        cache: 'no-store',
      });
      const statusData = await statusResponse.json() as { clinicOpen?: boolean; error?: string };
      if (!statusResponse.ok || typeof statusData.clinicOpen !== 'boolean') {
        throw new Error(statusData.error || 'Clinic status could not be loaded.');
      }
      setClinicOpen(statusData.clinicOpen);
      setError('');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Admin workspace could not be loaded.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadWorkspace();
    const timer = window.setInterval(() => void loadWorkspace(), 3000);
    return () => window.clearInterval(timer);
  }, []);

  const selected = useMemo(() => appointments.find((appointment) => appointment.id === selectedId), [appointments, selectedId]);
  const selectedMessages = useMemo(() => messages.filter((message) => message.appointment_id === selectedId), [messages, selectedId]);
  const counts = useMemo(() => ({
    pending: appointments.filter((appointment) => appointment.status === 'pending').length,
    confirmed: appointments.filter((appointment) => appointment.status === 'confirmed').length,
    rejected: appointments.filter((appointment) => appointment.status === 'rejected' || appointment.status === 'cancelled').length,
  }), [appointments]);
  const filteredAppointments = useMemo(() => {
    const query = search.trim().toLowerCase();
    return appointments.filter((appointment) => {
      const matchesStatus = statusFilter === 'all'
        || (statusFilter === 'rejected' ? ['rejected', 'cancelled'].includes(appointment.status) : appointment.status === statusFilter);
      const matchesSearch = !query || [
        appointment.patient_name,
        appointment.reference_code,
        appointment.service_name,
        appointment.phone,
      ].some((value) => value.toLowerCase().includes(query));
      return matchesStatus && matchesSearch;
    });
  }, [appointments, search, statusFilter]);

  const performAction = async (action: string, appointment: AppointmentRow) => {
    if (action === 'delete_chat' && !window.confirm('Archive this conversation for the patient? Messages will remain available in admin records, and the appointment request will be kept.')) return;
    if (action === 'complete' && !window.confirm('Mark this appointment as completed? It will be removed from the public Dates and Time Slots schedule but remain in admin records.')) return;
    if (action === 'approve') {
      const dateSettings = slotSettings.filter((setting) => setting.appointment_date === appointment.preferred_date);
      const fullDateBlocked = dateSettings.some((setting) => setting.time_slot === 'all_day' && Number(setting.blocked) === 1);
      const slotSetting = dateSettings.find((setting) => setting.time_slot === appointment.preferred_time);
      const slotBlocked = Number(slotSetting?.blocked) === 1;
      const acceptedCount = appointments.filter((item) => item.status === 'confirmed'
        && item.preferred_date === appointment.preferred_date
        && item.preferred_time === appointment.preferred_time).length;
      const slotCapacity = Number(slotSetting?.capacity ?? 0);
      if (fullDateBlocked || slotBlocked) {
        setError('This appointment date or time slot is blocked. Unblock it in Calendar & availability before accepting.');
        return;
      }
      if (slotCapacity > 0 && acceptedCount >= slotCapacity) {
        setError('This time slot has reached its appointment limit. Increase the capacity in Calendar & availability before accepting.');
        return;
      }
    }
    try {
      const user = auth.currentUser;
      if (!user) return;
      const token = await user.getIdToken();
      const response = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action, appointmentId: appointment.id }),
      });
      if (!response.ok) {
        const result = await response.json() as { error?: string };
        throw new Error(result.error || 'The action could not be completed.');
      }
      if (action === 'delete_chat') {
        setAppointments((current) => current.map((item) => item.id === appointment.id ? { ...item, chat_status: 'deleted' } : item));
        setMessages((current) => current.filter((message) => message.appointment_id !== appointment.id));
        setChatInput('');
      }
      await loadWorkspace();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The action could not be completed.');
    }
  };

  const updateClinicStatus = async (isOpen: boolean) => {
    setClinicStatusSaving(true);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Sign in to update clinic status.');
      const token = await user.getIdToken();
      const response = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: 'set_clinic_status', isOpen }),
      });
      const result = await response.json() as { clinicOpen?: boolean; error?: string };
      if (!response.ok || typeof result.clinicOpen !== 'boolean') {
        throw new Error(result.error || 'Clinic status could not be updated.');
      }
      setClinicOpen(result.clinicOpen);
      setError('');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Clinic status could not be updated.');
    } finally {
      setClinicStatusSaving(false);
    }
  };

  const saveSlotSettings = async (date: string, settings: SlotSettingsForm) => {
    const user = auth.currentUser;
    if (!user) throw new Error('Sign in to manage appointment availability.');
    const token = await user.getIdToken();
    const response = await fetch('/api/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
      body: JSON.stringify({ action: 'save_slot_settings', date, ...settings }),
    });
    const result = await response.json() as { slotSettings?: SlotSetting[]; error?: string };
    const updatedSettings = result.slotSettings;
    if (!response.ok || !Array.isArray(updatedSettings)) {
      throw new Error(result.error || 'Slot settings could not be saved.');
    }
    setSlotSettings((current) => [
      ...current.filter((item) => item.appointment_date !== date),
      ...updatedSettings,
    ]);
  };

  const sendMessage = async (event: FormEvent) => {
    event.preventDefault();
    if (!selected || !chatInput.trim()) return;
    try {
      const user = auth.currentUser;
      if (!user) return;
      const token = await user.getIdToken();
      const response = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: 'message', appointmentId: selected.id, message: chatInput.trim(), senderName: 'ADMIN' }),
      });
      if (!response.ok) throw new Error('Message could not be sent.');
      setChatInput('');
      await loadWorkspace();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Message could not be sent.');
    }
  };

  return (
    <main className="min-h-screen bg-[#f4f6f3] text-[#17312e]">
      <header className="border-b border-[#dfe6e1] bg-white px-3 py-3 sm:px-8 sm:py-4">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-2 sm:gap-4">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center bg-[#17645c] text-white sm:h-10 sm:w-10"><CalendarCheck2 className="h-5 w-5" /></div>
            <div className="min-w-0"><div className="flex flex-wrap items-center gap-x-2 gap-y-0.5"><span className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#17645c] sm:text-[11px] sm:tracking-[0.16em]">Health center staff</span><span className="border border-[#b7d6cc] bg-[#edf7f2] px-1.5 py-0.5 text-[9px] font-extrabold tracking-wider text-[#17645c] sm:px-2 sm:text-[10px]">ADMIN</span></div><h1 className="mt-0.5 truncate text-sm font-bold sm:text-lg">Appointment management</h1></div>
          </div>
          <button type="button" onClick={() => void auth.signOut()} className="shrink-0 border border-[#d9e1dc] px-2.5 py-2 text-xs font-bold text-[#66736f] hover:bg-[#f4f6f3] hover:text-[#17312e] sm:px-4 sm:text-sm">Sign out</button>
        </div>
      </header>

      <div className="mx-auto w-full max-w-[1500px] px-3 py-4 sm:px-8 sm:py-8">
        <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <p className="text-sm text-[#66736f]">Review appointment requests, contact patients, and manage confirmations.</p>
          <div className="flex min-w-0 flex-wrap items-center gap-2 border border-[#dfe6e1] bg-white px-3 py-3 sm:gap-3 sm:px-4">
            <span className={`h-3 w-3 shrink-0 rounded-full ${clinicOpen === null ? 'bg-slate-400' : clinicOpen ? 'bg-emerald-500' : 'bg-rose-500'}`} />
            <div className="mr-auto min-w-0 sm:mr-2"><div className="text-xs font-bold">{clinicOpen === null ? 'LOADING STATUS' : clinicOpen ? 'OPEN NOW' : 'CLOSED NOW'}</div><div className="text-[10px] text-[#66736f]">Public website status</div></div>
            <button type="button" disabled={clinicStatusSaving || clinicOpen === null} onClick={() => void updateClinicStatus(!clinicOpen)} className={`min-h-11 shrink-0 px-3 text-xs font-bold text-white disabled:opacity-60 sm:px-4 ${clinicOpen ? 'bg-rose-700 hover:bg-rose-800' : 'bg-[#17645c] hover:bg-[#104f49]'}`}>
              {clinicStatusSaving ? 'Saving...' : clinicOpen === null ? 'Loading...' : clinicOpen ? 'CLOSE NOW' : 'OPEN NOW'}
            </button>
          </div>
        </div>

        <section aria-label="Appointment summary" className="mb-6 grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3">
          {[
            { label: 'Awaiting review', value: counts.pending, icon: Clock3, color: 'text-amber-700', bg: 'bg-amber-50' },
            { label: 'Accepted', value: counts.confirmed, icon: Check, color: 'text-emerald-700', bg: 'bg-emerald-50' },
            { label: 'Rejected or cancelled', value: counts.rejected, icon: X, color: 'text-rose-700', bg: 'bg-rose-50' },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className="flex min-w-0 items-center gap-2 border border-[#dfe6e1] bg-white p-3 sm:gap-4 sm:p-4">
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center ${bg} ${color} sm:h-10 sm:w-10`}><Icon className="h-5 w-5" /></div>
              <div className="min-w-0"><div className="text-2xl font-bold leading-none">{value}</div><div className="mt-1.5 text-[11px] font-medium leading-tight text-[#66736f] sm:text-xs">{label}</div></div>
            </div>
          ))}
        </section>

        <nav aria-label="Admin sections" className="mb-4 flex gap-1 overflow-x-auto border-b border-[#dfe6e1]">
          {[
            { id: 'requests', label: 'Appointment requests' },
            { id: 'calendar', label: 'Calendar & availability' },
            { id: 'content', label: 'Website content' },
            { id: 'reports', label: 'Reports & export' },
          ].map(({ id, label }) => (
            <button key={id} type="button" onClick={() => setActiveTab(id as 'requests' | 'calendar' | 'content' | 'reports')} className={`min-h-11 shrink-0 border-b-2 px-3 py-3 text-xs font-bold sm:px-4 sm:text-sm ${activeTab === id ? 'border-[#17645c] text-[#17645c]' : 'border-transparent text-[#66736f] hover:text-[#17312e]'}`}>{label}</button>
          ))}
        </nav>

        {activeTab === 'calendar' ? (
          <AdminCalendar
            appointments={appointments}
            slotSettings={slotSettings}
            onSaveSettings={saveSlotSettings}
            onSelectAppointment={(id) => { setSelectedId(id); setActiveTab('requests'); }}
          />
        ) : activeTab === 'content' ? (
          <AdminContentManager />
        ) : activeTab === 'reports' ? (
          <AdminReports appointments={appointments} />
        ) : (
        <section className="grid min-w-0 overflow-hidden border border-[#dfe6e1] bg-white lg:min-h-[640px] lg:grid-cols-[350px_minmax(0,1fr)]">
          <aside className={`${selected ? 'hidden lg:block' : ''} min-w-0 border-b border-[#dfe6e1] lg:border-b-0 lg:border-r`}>
            <div className="border-b border-[#edf1ee] p-4">
              <div className="mb-3 flex items-center justify-between"><h2 className="text-sm font-bold">Appointment requests</h2><span className="text-xs text-[#66736f]">{filteredAppointments.length} shown</span></div>
              <label className="flex h-10 items-center gap-2 border border-[#d9e1dc] px-3 text-[#66736f] focus-within:border-[#17645c]">
                <Search className="h-4 w-4 shrink-0" />
                <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search patient or reference" className="min-w-0 flex-1 text-xs text-[#17312e] outline-none" />
              </label>
              <div className="mt-3 flex gap-1 overflow-x-auto pb-1">
                {[
                  ['all', 'All'],
                  ['pending', 'Pending'],
                  ['confirmed', 'Accepted'],
                  ['completed', 'Completed'],
                  ['rejected', 'Rejected'],
                ].map(([value, label]) => (
                  <button key={value} type="button" onClick={() => setStatusFilter(value)} className={`min-h-11 shrink-0 whitespace-nowrap px-3 text-xs font-bold ${statusFilter === value ? 'bg-[#173a37] text-white' : 'bg-[#f1f4f1] text-[#66736f] hover:bg-[#e7ede8]'}`}>{label}</button>
                ))}
              </div>
            </div>
            <div className="max-h-[420px] overflow-y-auto lg:max-h-[calc(100vh-360px)]">
              {loading ? <p className="p-5 text-sm text-[#66736f]">Loading requests...</p> : filteredAppointments.map((appointment) => (
                <button key={appointment.id} type="button" onClick={() => setSelectedId(appointment.id)} className={`w-full border-b border-[#edf1ee] border-l-2 px-4 py-4 text-left transition-colors hover:bg-[#f5f8f5] ${selectedId === appointment.id ? 'border-l-[#17645c] bg-[#f0f5f1]' : 'border-l-transparent'}`}>
                  <div className="flex items-start justify-between gap-3"><div className="min-w-0"><div className="truncate text-sm font-bold">{appointment.patient_name}</div><div className="mt-1 truncate text-xs text-[#66736f]">{appointment.service_name}</div></div><span className={`shrink-0 px-2 py-1 text-[10px] font-bold uppercase ${appointment.status === 'confirmed' ? 'bg-emerald-100 text-emerald-800' : appointment.status === 'completed' ? 'bg-sky-100 text-sky-800' : appointment.status === 'cancelled' || appointment.status === 'rejected' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'}`}>{appointment.status}</span></div>
                  <div className="mt-3 flex min-w-0 flex-wrap items-center justify-between gap-x-2 gap-y-1 text-[11px] text-[#66736f]"><span>{appointment.preferred_date} · {appointment.preferred_time}</span><span className="break-all font-mono">{appointment.reference_code}</span></div>
                </button>
              ))}
              {!loading && filteredAppointments.length === 0 && <p className="p-5 text-sm text-[#66736f]">{appointments.length ? 'No requests match these filters.' : 'No appointment requests yet.'}</p>}
            </div>
          </aside>

          <section className={`${selected ? '' : 'hidden lg:block'} min-w-0 bg-[#f8faf8]`}>
            {!selected ? (
              <div className="flex min-h-[420px] flex-col items-center justify-center px-6 text-center">
                <CalendarDays className="h-9 w-9 text-[#9aaba0]" />
                <h2 className="mt-4 text-base font-bold">Select an appointment request</h2>
                <p className="mt-1 max-w-sm text-sm text-[#66736f]">Patient details, review actions, and messages will appear here.</p>
              </div>
            ) : (
              <div className="grid min-h-0 xl:min-h-[640px] xl:grid-cols-[minmax(230px,0.7fr)_minmax(320px,1.3fr)]">
                <div className="min-w-0 border-b border-[#dfe6e1] bg-white p-4 sm:p-5 xl:border-b-0 xl:border-r">
                  <button type="button" onClick={() => setSelectedId('')} className="mb-4 flex items-center gap-1 text-xs font-bold text-[#17645c] lg:hidden"><ChevronLeft className="h-4 w-4" />Back to requests</button>
                  <div className="flex items-start justify-between gap-3"><div><div className="text-[11px] font-bold uppercase tracking-wide text-[#17645c]">Request details</div><div className="mt-1 font-mono text-xs text-[#66736f]">{selected.reference_code}</div></div><span className={`px-2 py-1 text-[10px] font-bold uppercase ${selected.status === 'confirmed' ? 'bg-emerald-100 text-emerald-800' : selected.status === 'completed' ? 'bg-sky-100 text-sky-800' : selected.status === 'cancelled' || selected.status === 'rejected' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'}`}>{selected.status}</span></div>
                  <h2 className="mt-5 break-words text-xl font-bold">{selected.patient_name}</h2>
                  <p className="mt-1 break-words text-sm text-[#66736f]">{selected.service_name}</p>
                  <dl className="mt-6 space-y-4 border-y border-[#edf1ee] py-5 text-sm">
                    <div><dt className="text-[11px] font-bold uppercase tracking-wide text-[#87938c]">Preferred appointment</dt><dd className="mt-1 font-medium">{selected.preferred_date} · {selected.preferred_time}</dd></div>
                    <div><dt className="text-[11px] font-bold uppercase tracking-wide text-[#87938c]">Barangay</dt><dd className="mt-1 font-medium">{selected.zone}</dd></div>
                    <div><dt className="text-[11px] font-bold uppercase tracking-wide text-[#87938c]">Contact number</dt><dd className="mt-1 font-medium">{selected.phone}</dd></div>
                    {selected.email && <div><dt className="text-[11px] font-bold uppercase tracking-wide text-[#87938c]">Email</dt><dd className="mt-1 break-all font-medium">{selected.email}</dd></div>}
                  </dl>
                  <div className="mt-5 grid gap-2">
                    <button type="button" disabled={selected.status !== 'pending'} onClick={() => void performAction('approve', selected)} className="flex min-h-11 items-center justify-center gap-2 bg-[#17645c] px-2 text-sm font-bold text-white hover:bg-[#104f49] disabled:cursor-not-allowed disabled:opacity-50"><Check className="h-4 w-4 shrink-0" />Accept request</button>
                    <button type="button" disabled={selected.status === 'rejected' || selected.status === 'cancelled' || selected.status === 'completed'} onClick={() => void performAction('reject', selected)} className="flex min-h-11 items-center justify-center gap-2 border border-rose-200 px-2 text-sm font-bold text-rose-700 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"><X className="h-4 w-4 shrink-0" />Reject request</button>
                    {selected.status === 'confirmed' && <button type="button" onClick={() => void performAction('complete', selected)} className="flex min-h-11 items-center justify-center gap-2 border border-sky-200 px-2 text-sm font-bold text-sky-800 hover:bg-sky-50"><CheckCircle2 className="h-4 w-4 shrink-0" />Mark completed / remove from schedule</button>}
                    {selected.chat_status !== 'deleted' && <button type="button" onClick={() => void performAction(selected.chat_status === 'closed' ? 'chat_open' : 'chat_close', selected)} className="flex min-h-11 items-center justify-center gap-2 border border-[#d9e1dc] px-2 text-sm font-bold hover:bg-[#f4f6f3]"><LockKeyhole className="h-4 w-4 shrink-0" />{selected.chat_status === 'closed' ? 'Open patient chat' : 'Close patient chat'}</button>}
                  </div>
                </div>

                <div className="flex min-h-[380px] min-w-0 flex-col sm:min-h-[520px]">
                  <div className="flex min-w-0 items-center gap-2 border-b border-[#dfe6e1] bg-white px-3 py-3 sm:gap-3 sm:px-5 sm:py-4">
                    <div className="flex h-9 w-9 items-center justify-center bg-[#edf3ef] text-[#17645c]"><MessageCircle className="h-4 w-4" /></div>
                    <div className="min-w-0"><h3 className="text-sm font-bold">Patient conversation</h3><p className="mt-0.5 text-[11px] text-[#66736f]">{selected.chat_status === 'deleted' ? 'Deleted for both accounts' : selected.chat_status === 'closed' ? 'Open chat to send messages' : 'Chat is open with the patient'}</p></div>
                    {selected.chat_status !== 'deleted' && <button type="button" onClick={() => void performAction('delete_chat', selected)} className="ml-auto inline-flex items-center gap-1.5 border border-rose-200 px-3 py-2 text-xs font-bold text-rose-700 hover:bg-rose-50" title="Delete this chat for both accounts"><Trash2 className="h-4 w-4" /><span className="hidden sm:inline">Delete chat</span></button>}
                  </div>
                  <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-3 py-4 sm:px-5 sm:py-5">
                    {selectedMessages.map((message) => (
                      <div key={message.id} className={`flex ${message.sender_role === 'admin' ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${message.sender_role === 'admin' ? 'rounded-br-sm bg-[#17645c] text-white' : 'rounded-bl-sm border border-[#e5ebe6] bg-white text-[#17312e]'}`}><div className="whitespace-pre-wrap break-words">{message.message}</div><div className={`mt-1.5 text-[10px] ${message.sender_role === 'admin' ? 'text-white/70' : 'text-[#66736f]'}`}>{message.sender_name}</div></div></div>
                    ))}
                    {selectedMessages.length === 0 && <div className="flex h-full min-h-40 items-center justify-center text-center text-xs text-[#87938c]">{selected.chat_status === 'deleted' ? 'This conversation was deleted for both accounts.' : 'No messages for this request yet.'}</div>}
                  </div>
                  {selected.chat_status === 'open' ? (
                    <form onSubmit={sendMessage} className="flex shrink-0 gap-2 border-t border-[#dfe6e1] bg-white p-2.5 sm:p-4"><input value={chatInput} onChange={(event) => setChatInput(event.target.value)} maxLength={2000} placeholder="Write a message to the patient..." className="h-11 min-w-0 flex-1 border border-[#d9e1dc] px-3 text-sm outline-none focus:border-[#17645c] sm:px-4" /><button type="submit" disabled={!chatInput.trim()} aria-label="Send message" className="flex h-11 w-11 shrink-0 items-center justify-center bg-[#17645c] text-white hover:bg-[#104f49] disabled:opacity-50"><Send className="h-4 w-4" /></button></form>
                  ) : <div className="border-t border-[#dfe6e1] bg-white px-5 py-4 text-center text-xs text-[#66736f]">{selected.chat_status === 'deleted' ? 'This conversation has been deleted and cannot be reopened.' : 'This conversation is closed. Open patient chat to reply.'}</div>}
                </div>
              </div>
            )}
          </section>
        </section>
        )}
      </div>
      {error && <div role="alert" className="fixed bottom-4 left-3 right-3 z-50 mx-auto w-fit max-w-lg border border-rose-200 bg-white px-4 py-3 text-sm text-rose-800 shadow-lg sm:left-1/2 sm:right-auto sm:-translate-x-1/2">{error}</div>}
    </main>
  );
};
