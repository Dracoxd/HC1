import React, { useEffect, useState } from 'react';
import { useHealthCenter } from '../context/HealthCenterContext';
import { SERVICES_DATA } from '../data/healthCenterData';
import { AlertCircle, CalendarDays, CheckCircle2, Clock, X } from 'lucide-react';

interface AppointmentReceipt {
  referenceCode: string;
  status: 'pending';
  createdAt: string;
}

function localDateString() {
  const date = new Date();
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 10);
}

export const OutreachBookingModal: React.FC = () => {
  const {
    t,
    language,
    bookingModalOpen,
    setBookingModalOpen,
    selectedProgramForBooking,
  } = useHealthCenter();
  const [serviceId, setServiceId] = useState('checkup');
  const [patientName, setPatientName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [zone, setZone] = useState('1. San Pedro');
  const [preferredDate, setPreferredDate] = useState(localDateString);
  const [preferredTime, setPreferredTime] = useState('morning');
  const [privacyConsent, setPrivacyConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [receipt, setReceipt] = useState<AppointmentReceipt | null>(null);

  useEffect(() => {
    if (selectedProgramForBooking && SERVICES_DATA.some((service) => service.id === selectedProgramForBooking)) {
      setServiceId(selectedProgramForBooking);
    }
  }, [selectedProgramForBooking]);

  useEffect(() => {
    if (!bookingModalOpen) {
      setReceipt(null);
      setError('');
      setPatientName('');
      setPhone('');
      setEmail('');
      setPrivacyConsent(false);
    }
  }, [bookingModalOpen]);

  if (!bookingModalOpen) return null;

  const isFilipino = language === 'fil';
  const selectedService = SERVICES_DATA.find((service) => service.id === serviceId) ?? SERVICES_DATA[0];
  const today = localDateString();

  const handleClose = () => setBookingModalOpen(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientName,
          phone,
          email,
          zone,
          serviceId,
          preferredDate,
          preferredTime,
          privacyConsent,
        }),
      });
      const result = await response.json() as AppointmentReceipt & { error?: string };
      if (!response.ok) throw new Error(result.error || 'Could not submit your appointment request.');
      setReceipt(result);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Could not submit your appointment request.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto" onMouseDown={(event) => { if (event.target === event.currentTarget) handleClose(); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="appointment-title" className="bg-white max-w-2xl w-full max-h-[92vh] overflow-y-auto shadow-2xl my-5">
        <header className="flex items-start justify-between gap-5 px-5 sm:px-7 py-5 border-b border-slate-200">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-teal-800">Mayor Moises R. Flores Health Center</div>
            <h2 id="appointment-title" className="mt-1 text-2xl font-bold text-slate-950">{receipt ? (isFilipino ? 'Natanggap ang request' : 'Request received') : (isFilipino ? 'Online appointment request' : 'Request an appointment')}</h2>
            {!receipt && <p className="mt-1 text-sm text-slate-600">{isFilipino ? 'Ipadala ang iyong kahilingan. Tatawagan ka ng kawani para kumpirmahin ang oras.' : 'Send your preferred schedule. Clinic staff will contact you to confirm.'}</p>}
          </div>
          <button onClick={handleClose} aria-label="Close appointment form" className="p-2 text-slate-500 hover:text-slate-900"><X className="w-5 h-5" /></button>
        </header>

        {receipt ? (
          <div className="px-5 sm:px-7 py-8" aria-live="polite">
            <div className="flex items-start gap-4">
              <CheckCircle2 className="w-7 h-7 text-teal-800 shrink-0" />
              <div>
                <h3 className="text-lg font-bold text-slate-950">{isFilipino ? 'Nakatala ang iyong appointment request.' : 'Your appointment request is recorded.'}</h3>
                <p className="mt-2 text-sm text-slate-600">{isFilipino ? 'Hindi pa ito kumpirmadong appointment. Makikipag-ugnayan ang clinic staff para kumpirmahin ang schedule.' : 'This is not a confirmed appointment yet. Clinic staff will contact you to confirm the schedule.'}</p>
                <p className="mt-4 text-sm text-slate-700">{selectedService.title}</p>
                <p className="mt-1 text-sm text-slate-600">{preferredDate} · {preferredTime === 'morning' ? 'Morning' : preferredTime === 'afternoon' ? 'Afternoon' : 'No preference'} · {zone}</p>
                <p className="mt-4 text-xs text-slate-500">{isFilipino ? 'Reference number' : 'Request reference'}: <strong className="font-mono text-slate-900">{receipt.referenceCode}</strong></p>
                <button onClick={handleClose} className="mt-6 px-4 py-2.5 bg-teal-900 text-white text-sm font-bold rounded-md hover:bg-teal-950">{isFilipino ? 'Isara' : 'Done'}</button>
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="px-5 sm:px-7 py-6 space-y-5">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label htmlFor="appointment-service" className="block text-sm font-semibold text-slate-800 mb-1.5">{isFilipino ? 'Serbisyo' : 'Service'}</label>
                <select id="appointment-service" value={serviceId} onChange={(event) => setServiceId(event.target.value)} className="w-full px-3.5 py-3 bg-white border border-slate-300 rounded-md text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-700">
                  {SERVICES_DATA.map((service) => <option key={service.id} value={service.id}>{isFilipino ? service.titleFil : service.title}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="appointment-name" className="block text-sm font-semibold text-slate-800 mb-1.5">{t.formFullName} *</label>
                <input id="appointment-name" required minLength={2} maxLength={120} autoComplete="name" value={patientName} onChange={(event) => setPatientName(event.target.value)} className="w-full px-3.5 py-3 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-teal-700" />
              </div>
              <div>
                <label htmlFor="appointment-phone" className="block text-sm font-semibold text-slate-800 mb-1.5">{t.formPhone} *</label>
                <input id="appointment-phone" required type="tel" autoComplete="tel" minLength={7} maxLength={32} value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="09XX XXX XXXX" className="w-full px-3.5 py-3 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-teal-700" />
              </div>
              <div>
                <label htmlFor="appointment-email" className="block text-sm font-semibold text-slate-800 mb-1.5">{t.formEmail}</label>
                <input id="appointment-email" type="email" autoComplete="email" maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} className="w-full px-3.5 py-3 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-teal-700" />
              </div>
              <div>
                <label htmlFor="appointment-zone" className="block text-sm font-semibold text-slate-800 mb-1.5">{t.formZone} *</label>
                <select id="appointment-zone" required value={zone} onChange={(event) => setZone(event.target.value)} className="w-full px-3.5 py-3 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-teal-700">
                  <option>1. San Pedro</option><option>2. Magtanggol</option><option>3. Tabacalera</option>
                </select>
              </div>
              <div>
                <label htmlFor="appointment-date" className="block text-sm font-semibold text-slate-800 mb-1.5">{t.formDate} *</label>
                <input id="appointment-date" required type="date" min={today} value={preferredDate} onChange={(event) => setPreferredDate(event.target.value)} className="w-full px-3.5 py-3 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-teal-700" />
              </div>
              <div>
                <label htmlFor="appointment-time" className="block text-sm font-semibold text-slate-800 mb-1.5">{t.formTimeSlot} *</label>
                <select id="appointment-time" value={preferredTime} onChange={(event) => setPreferredTime(event.target.value)} className="w-full px-3.5 py-3 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-teal-700">
                  <option value="morning">Morning</option><option value="afternoon">Afternoon</option><option value="no preference">No preference</option>
                </select>
              </div>
            </div>

            <label className="flex items-start gap-3 border-t border-slate-200 pt-4 text-sm text-slate-600">
              <input type="checkbox" required checked={privacyConsent} onChange={(event) => setPrivacyConsent(event.target.checked)} className="mt-0.5 h-4 w-4 accent-teal-800" />
              <span>{isFilipino ? 'Pumapayag akong gamitin ng health center staff ang aking contact details para suriin at sagutin ang appointment request na ito.' : 'I agree that health center staff may use my contact details to review and respond to this appointment request.'}</span>
            </label>

            {error && <p role="alert" className="flex items-start gap-2 text-sm text-rose-800"><AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />{error}</p>}

            <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-slate-200 pt-4">
              <p className="flex items-center gap-2 text-xs text-slate-500"><Clock className="w-4 h-4" />{isFilipino ? 'Pending ang request hanggang makumpirma ng staff.' : 'Requests remain pending until staff confirm.'}</p>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={handleClose} className="px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 rounded-md">{isFilipino ? 'Kanselahin' : 'Cancel'}</button>
                <button type="submit" disabled={submitting} className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-teal-900 hover:bg-teal-950 disabled:opacity-60 rounded-md"><CalendarDays className="w-4 h-4" />{submitting ? (isFilipino ? 'Ipinapadala...' : 'Sending...') : (isFilipino ? 'Ipadala ang request' : 'Send appointment request')}</button>
              </div>
            </div>
          </form>
        )}
      </section>
    </div>
  );
};
