import React, { FormEvent, useEffect, useMemo, useState } from 'react';
import { auth } from '../firebase';
import { CalendarCheck2, CalendarDays, Check, ChevronLeft, Clock3, LockKeyhole, MessageCircle, Search, Send, Trash2, X } from 'lucide-react';

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
  const [selectedId, setSelectedId] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadWorkspace = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;
      const token = await user.getIdToken();
      const response = await fetch('/api/admin', { headers: { Authorization: `Bearer ${token}` } });
      if (!response.ok) throw new Error(response.status === 403 ? 'This account is not an admin.' : 'Admin workspace could not be loaded.');
      const data = await response.json() as { role: string; appointments: AppointmentRow[]; messages: ChatMessage[] };
      if (data.role !== 'admin') throw new Error('This account is not an admin.');
      setAppointments(data.appointments);
      setMessages(data.messages);
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
    if (action === 'delete_chat' && !window.confirm('Delete all messages in this chat for both you and the patient? This cannot be undone.')) return;
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
      await loadWorkspace();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The action could not be completed.');
    }
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
      <header className="border-b border-[#dfe6e1] bg-white px-5 py-4 sm:px-8">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center bg-[#17645c] text-white"><CalendarCheck2 className="h-5 w-5" /></div>
            <div><div className="flex items-center gap-2"><span className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#17645c]">Health center staff</span><span className="border border-[#b7d6cc] bg-[#edf7f2] px-2 py-0.5 text-[10px] font-extrabold tracking-wider text-[#17645c]">ADMIN</span></div><h1 className="mt-0.5 text-lg font-bold">Appointment management</h1></div>
          </div>
          <button type="button" onClick={() => void auth.signOut()} className="border border-[#d9e1dc] px-4 py-2 text-sm font-bold text-[#66736f] hover:bg-[#f4f6f3] hover:text-[#17312e]">Sign out</button>
        </div>
      </header>

      <div className="mx-auto max-w-[1500px] px-4 py-6 sm:px-8 sm:py-8">
        <p className="mb-6 text-sm text-[#66736f]">Review appointment requests, contact patients, and manage confirmations.</p>

        <section aria-label="Appointment summary" className="mb-6 grid gap-3 sm:grid-cols-3">
          {[
            { label: 'Awaiting review', value: counts.pending, icon: Clock3, color: 'text-amber-700', bg: 'bg-amber-50' },
            { label: 'Accepted', value: counts.confirmed, icon: Check, color: 'text-emerald-700', bg: 'bg-emerald-50' },
            { label: 'Rejected or cancelled', value: counts.rejected, icon: X, color: 'text-rose-700', bg: 'bg-rose-50' },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className="flex items-center gap-4 border border-[#dfe6e1] bg-white p-4">
              <div className={`flex h-10 w-10 items-center justify-center ${bg} ${color}`}><Icon className="h-5 w-5" /></div>
              <div><div className="text-2xl font-bold leading-none">{value}</div><div className="mt-1.5 text-xs font-medium text-[#66736f]">{label}</div></div>
            </div>
          ))}
        </section>

        <section className="grid overflow-hidden border border-[#dfe6e1] bg-white lg:min-h-[640px] lg:grid-cols-[350px_minmax(0,1fr)]">
          <aside className="border-b border-[#dfe6e1] lg:border-b-0 lg:border-r">
            <div className="border-b border-[#edf1ee] p-4">
              <div className="mb-3 flex items-center justify-between"><h2 className="text-sm font-bold">Appointment requests</h2><span className="text-xs text-[#66736f]">{filteredAppointments.length} shown</span></div>
              <label className="flex h-10 items-center gap-2 border border-[#d9e1dc] px-3 text-[#66736f] focus-within:border-[#17645c]">
                <Search className="h-4 w-4 shrink-0" />
                <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search patient or reference" className="min-w-0 flex-1 text-xs text-[#17312e] outline-none" />
              </label>
              <div className="mt-3 flex gap-1 overflow-x-auto">
                {[
                  ['all', 'All'],
                  ['pending', 'Pending'],
                  ['confirmed', 'Accepted'],
                  ['rejected', 'Rejected'],
                ].map(([value, label]) => (
                  <button key={value} type="button" onClick={() => setStatusFilter(value)} className={`whitespace-nowrap px-3 py-1.5 text-xs font-bold ${statusFilter === value ? 'bg-[#173a37] text-white' : 'bg-[#f1f4f1] text-[#66736f] hover:bg-[#e7ede8]'}`}>{label}</button>
                ))}
              </div>
            </div>
            <div className="max-h-[420px] overflow-y-auto lg:max-h-[calc(100vh-360px)]">
              {loading ? <p className="p-5 text-sm text-[#66736f]">Loading requests...</p> : filteredAppointments.map((appointment) => (
                <button key={appointment.id} type="button" onClick={() => setSelectedId(appointment.id)} className={`w-full border-b border-[#edf1ee] border-l-2 px-4 py-4 text-left transition-colors hover:bg-[#f5f8f5] ${selectedId === appointment.id ? 'border-l-[#17645c] bg-[#f0f5f1]' : 'border-l-transparent'}`}>
                  <div className="flex items-start justify-between gap-3"><div className="min-w-0"><div className="truncate text-sm font-bold">{appointment.patient_name}</div><div className="mt-1 truncate text-xs text-[#66736f]">{appointment.service_name}</div></div><span className={`shrink-0 px-2 py-1 text-[10px] font-bold uppercase ${appointment.status === 'confirmed' ? 'bg-emerald-100 text-emerald-800' : appointment.status === 'cancelled' || appointment.status === 'rejected' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'}`}>{appointment.status}</span></div>
                  <div className="mt-3 flex items-center justify-between text-[11px] text-[#66736f]"><span>{appointment.preferred_date} · {appointment.preferred_time}</span><span className="font-mono">{appointment.reference_code}</span></div>
                </button>
              ))}
              {!loading && filteredAppointments.length === 0 && <p className="p-5 text-sm text-[#66736f]">{appointments.length ? 'No requests match these filters.' : 'No appointment requests yet.'}</p>}
            </div>
          </aside>

          <section className="min-w-0 bg-[#f8faf8]">
            {!selected ? (
              <div className="flex min-h-[420px] flex-col items-center justify-center px-6 text-center">
                <CalendarDays className="h-9 w-9 text-[#9aaba0]" />
                <h2 className="mt-4 text-base font-bold">Select an appointment request</h2>
                <p className="mt-1 max-w-sm text-sm text-[#66736f]">Patient details, review actions, and messages will appear here.</p>
              </div>
            ) : (
              <div className="grid min-h-[640px] xl:grid-cols-[minmax(230px,0.7fr)_minmax(320px,1.3fr)]">
                <div className="border-b border-[#dfe6e1] bg-white p-5 xl:border-b-0 xl:border-r">
                  <button type="button" onClick={() => setSelectedId('')} className="mb-4 flex items-center gap-1 text-xs font-bold text-[#17645c] lg:hidden"><ChevronLeft className="h-4 w-4" />Back to requests</button>
                  <div className="flex items-start justify-between gap-3"><div><div className="text-[11px] font-bold uppercase tracking-wide text-[#17645c]">Request details</div><div className="mt-1 font-mono text-xs text-[#66736f]">{selected.reference_code}</div></div><span className={`px-2 py-1 text-[10px] font-bold uppercase ${selected.status === 'confirmed' ? 'bg-emerald-100 text-emerald-800' : selected.status === 'cancelled' || selected.status === 'rejected' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'}`}>{selected.status}</span></div>
                  <h2 className="mt-5 text-xl font-bold">{selected.patient_name}</h2>
                  <p className="mt-1 text-sm text-[#66736f]">{selected.service_name}</p>
                  <dl className="mt-6 space-y-4 border-y border-[#edf1ee] py-5 text-sm">
                    <div><dt className="text-[11px] font-bold uppercase tracking-wide text-[#87938c]">Preferred appointment</dt><dd className="mt-1 font-medium">{selected.preferred_date} · {selected.preferred_time}</dd></div>
                    <div><dt className="text-[11px] font-bold uppercase tracking-wide text-[#87938c]">Barangay</dt><dd className="mt-1 font-medium">{selected.zone}</dd></div>
                    <div><dt className="text-[11px] font-bold uppercase tracking-wide text-[#87938c]">Contact number</dt><dd className="mt-1 font-medium">{selected.phone}</dd></div>
                    {selected.email && <div><dt className="text-[11px] font-bold uppercase tracking-wide text-[#87938c]">Email</dt><dd className="mt-1 break-all font-medium">{selected.email}</dd></div>}
                  </dl>
                  <div className="mt-5 grid gap-2">
                    <button type="button" disabled={selected.status === 'confirmed' || selected.status === 'rejected' || selected.status === 'cancelled'} onClick={() => void performAction('approve', selected)} className="flex h-10 items-center justify-center gap-2 bg-[#17645c] text-sm font-bold text-white hover:bg-[#104f49] disabled:cursor-not-allowed disabled:opacity-50"><Check className="h-4 w-4" />Accept request</button>
                    <button type="button" disabled={selected.status === 'rejected' || selected.status === 'cancelled'} onClick={() => void performAction('reject', selected)} className="flex h-10 items-center justify-center gap-2 border border-rose-200 text-sm font-bold text-rose-700 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"><X className="h-4 w-4" />Reject request</button>
                    <button type="button" onClick={() => void performAction(selected.chat_status === 'closed' ? 'chat_open' : 'chat_close', selected)} className="flex h-10 items-center justify-center gap-2 border border-[#d9e1dc] text-sm font-bold hover:bg-[#f4f6f3]"><LockKeyhole className="h-4 w-4" />{selected.chat_status === 'closed' ? 'Open patient chat' : 'Close patient chat'}</button>
                  </div>
                </div>

                <div className="flex min-h-[520px] flex-col">
                  <div className="flex items-center gap-3 border-b border-[#dfe6e1] bg-white px-5 py-4">
                    <div className="flex h-9 w-9 items-center justify-center bg-[#edf3ef] text-[#17645c]"><MessageCircle className="h-4 w-4" /></div>
                    <div><h3 className="text-sm font-bold">Patient conversation</h3><p className="mt-0.5 text-[11px] text-[#66736f]">{selected.chat_status === 'closed' ? 'Open chat to send messages' : 'Chat is open with the patient'}</p></div>
                    <button type="button" onClick={() => void performAction('delete_chat', selected)} className="ml-auto inline-flex items-center gap-1.5 border border-rose-200 px-3 py-2 text-xs font-bold text-rose-700 hover:bg-rose-50" title="Delete this chat for both accounts"><Trash2 className="h-4 w-4" /><span className="hidden sm:inline">Delete chat</span></button>
                  </div>
                  <div className="flex-1 space-y-3 overflow-y-auto px-5 py-5">
                    {selectedMessages.map((message) => (
                      <div key={message.id} className={`flex ${message.sender_role === 'admin' ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${message.sender_role === 'admin' ? 'rounded-br-sm bg-[#17645c] text-white' : 'rounded-bl-sm border border-[#e5ebe6] bg-white text-[#17312e]'}`}><div className="whitespace-pre-wrap break-words">{message.message}</div><div className={`mt-1.5 text-[10px] ${message.sender_role === 'admin' ? 'text-white/70' : 'text-[#66736f]'}`}>{message.sender_name}</div></div></div>
                    ))}
                    {selectedMessages.length === 0 && <div className="flex h-full min-h-40 items-center justify-center text-center text-xs text-[#87938c]">No messages for this request yet.</div>}
                  </div>
                  {selected.chat_status === 'open' ? (
                    <form onSubmit={sendMessage} className="flex gap-2 border-t border-[#dfe6e1] bg-white p-4"><input value={chatInput} onChange={(event) => setChatInput(event.target.value)} maxLength={2000} placeholder="Write a message to the patient..." className="min-w-0 flex-1 border border-[#d9e1dc] px-4 text-sm outline-none focus:border-[#17645c]" /><button type="submit" disabled={!chatInput.trim()} aria-label="Send message" className="flex h-10 w-10 shrink-0 items-center justify-center bg-[#17645c] text-white hover:bg-[#104f49] disabled:opacity-50"><Send className="h-4 w-4" /></button></form>
                  ) : <div className="border-t border-[#dfe6e1] bg-white px-5 py-4 text-center text-xs text-[#66736f]">This conversation is closed. Open patient chat to reply.</div>}
                </div>
              </div>
            )}
          </section>
        </section>
      </div>
      {error && <div role="alert" className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 border border-rose-200 bg-white px-4 py-3 text-sm text-rose-800 shadow-lg">{error}</div>}
    </main>
  );
};
