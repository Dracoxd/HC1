import React, { FormEvent, useEffect, useMemo, useState } from 'react';
import { auth } from '../firebase';
import { CalendarCheck2, Check, ChevronLeft, LockKeyhole, MessageCircle, Send, X } from 'lucide-react';

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

  const performAction = async (action: string, appointment: AppointmentRow) => {
    try {
      const user = auth.currentUser;
      if (!user) return;
      const token = await user.getIdToken();
      const response = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action, appointmentId: appointment.id }),
      });
      if (!response.ok) throw new Error('The action could not be completed.');
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
        body: JSON.stringify({ action: 'message', appointmentId: selected.id, message: chatInput.trim(), senderName: 'Clinic Staff' }),
      });
      if (!response.ok) throw new Error('Message could not be sent.');
      setChatInput('');
      await loadWorkspace();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Message could not be sent.');
    }
  };

  return (
    <main className="min-h-screen bg-[#eef2ee] text-[#17312e]">
      <header className="border-b border-[#dfe6e1] bg-[#fbfcfa] px-5 py-4 sm:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div><div className="text-xs font-bold text-[#17645c]">Clinic administration</div><h1 className="mt-1 text-xl font-bold">Appointments</h1></div>
          <button type="button" onClick={() => void auth.signOut()} className="text-sm font-bold text-[#66736f] hover:text-[#17312e]">Sign out</button>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl lg:grid-cols-[320px_1fr]">
        <aside className="border-b border-[#dfe6e1] bg-white lg:min-h-[calc(100vh-73px)] lg:border-b-0 lg:border-r">
          <div className="border-b border-[#dfe6e1] px-4 py-3 text-xs font-bold text-[#66736f]">Requests</div>
          <div className="max-h-[260px] overflow-y-auto lg:max-h-[calc(100vh-125px)]">
            {loading ? <p className="p-4 text-sm text-[#66736f]">Loading...</p> : appointments.map((appointment) => (
              <button key={appointment.id} type="button" onClick={() => setSelectedId(appointment.id)} className={`w-full border-b border-[#edf1ee] px-4 py-4 text-left hover:bg-[#f4f7f4] ${selectedId === appointment.id ? 'bg-[#edf3ef]' : 'bg-white'}`}>
                <div className="flex items-start justify-between gap-3"><div><div className="text-sm font-bold">{appointment.patient_name}</div><div className="mt-1 text-xs text-[#66736f]">{appointment.service_name}</div></div><span className={`mt-0.5 px-2 py-1 text-[10px] font-bold ${appointment.status === 'confirmed' ? 'bg-emerald-100 text-emerald-800' : appointment.status === 'cancelled' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'}`}>{appointment.status}</span></div>
                <div className="mt-2 text-xs text-[#66736f]">{appointment.preferred_date} · {appointment.preferred_time}</div>
              </button>
            ))}
          </div>
        </aside>

        <section className="min-h-[520px] bg-[#f6f8f5]">
          {!selected ? (
            <div className="flex min-h-[520px] items-center justify-center text-sm text-[#66736f]">Select a request</div>
          ) : (
            <div className="grid min-h-[520px] lg:grid-cols-[280px_1fr]">
              <div className="border-b border-[#dfe6e1] bg-white p-5 lg:border-b-0 lg:border-r">
                <button type="button" onClick={() => setSelectedId('')} className="mb-4 flex items-center gap-1 text-xs font-bold text-[#17645c] lg:hidden"><ChevronLeft className="h-4 w-4" />Back</button>
                <div className="text-xs font-bold text-[#17645c]">{selected.reference_code}</div>
                <h2 className="mt-1 text-lg font-bold">{selected.patient_name}</h2>
                <p className="mt-1 text-sm text-[#66736f]">{selected.service_name}</p>
                <div className="mt-5 space-y-2 text-xs text-[#66736f]"><div>{selected.preferred_date}</div><div>{selected.preferred_time}</div><div>{selected.zone}</div><div>{selected.phone}</div>{selected.email && <div>{selected.email}</div>}</div>
                <div className="mt-6 grid gap-2">
                  <button type="button" disabled={selected.status === 'confirmed'} onClick={() => void performAction('approve', selected)} className="flex h-10 items-center justify-center gap-2 bg-[#17645c] text-sm font-bold text-white disabled:opacity-50"><Check className="h-4 w-4" />Approve</button>
                  <button type="button" disabled={selected.status === 'cancelled'} onClick={() => void performAction('cancel', selected)} className="flex h-10 items-center justify-center gap-2 border border-rose-300 text-sm font-bold text-rose-700 disabled:opacity-50"><X className="h-4 w-4" />Cancel</button>
                  <button type="button" onClick={() => void performAction(selected.chat_status === 'closed' ? 'chat_open' : 'chat_close', selected)} className="flex h-10 items-center justify-center gap-2 border border-[#cfd8d2] text-sm font-bold text-[#17312e]"><LockKeyhole className="h-4 w-4" />{selected.chat_status === 'closed' ? 'Open chat' : 'Close chat'}</button>
                </div>
              </div>

              <div className="flex min-h-[520px] flex-col">
                <div className="flex items-center gap-2 border-b border-[#dfe6e1] bg-white px-5 py-3 text-sm font-bold"><MessageCircle className="h-4 w-4 text-[#17645c]" />Messages<span className="ml-auto text-xs font-normal text-[#66736f]">{selected.chat_status === 'closed' ? 'Chat closed' : 'Chat open'}</span></div>
                <div className="flex-1 space-y-2 overflow-y-auto px-5 py-5">
                  {selectedMessages.map((message) => (
                    <div key={message.id} className={`flex ${message.sender_role === 'admin' ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[78%] rounded-2xl px-4 py-2.5 text-sm ${message.sender_role === 'admin' ? 'rounded-br-sm bg-[#17645c] text-white' : 'rounded-bl-sm bg-white text-[#17312e] shadow-sm'}`}><div>{message.message}</div><div className={`mt-1 text-[10px] ${message.sender_role === 'admin' ? 'text-white/70' : 'text-[#66736f]'}`}>{message.sender_name}</div></div></div>
                  ))}
                  {selectedMessages.length === 0 && <p className="text-center text-xs text-[#66736f]">No messages yet</p>}
                </div>
                {selected.chat_status === 'open' && (
                  <form onSubmit={sendMessage} className="flex gap-2 border-t border-[#dfe6e1] bg-white p-3"><input value={chatInput} onChange={(event) => setChatInput(event.target.value)} placeholder="Message patient" className="min-w-0 flex-1 rounded-full border border-[#cfd8d2] px-4 text-sm outline-none focus:border-[#17645c]" /><button type="submit" aria-label="Send message" className="flex h-10 w-10 items-center justify-center rounded-full bg-[#17645c] text-white"><Send className="h-4 w-4" /></button></form>
                )}
              </div>
            </div>
          )}
        </section>
      </div>
      {error && <div role="alert" className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 border border-rose-200 bg-white px-4 py-3 text-sm text-rose-800 shadow-lg">{error}</div>}
    </main>
  );
};
