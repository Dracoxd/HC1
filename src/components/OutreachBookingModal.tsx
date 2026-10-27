import React, { useEffect, useState } from 'react';
import { useHealthCenter } from '../context/HealthCenterContext';
import { AlertCircle, CalendarDays, CheckCircle2, Clock, X } from 'lucide-react';
import type { User } from 'firebase/auth';

interface AppointmentReceipt {
  referenceCode: string;
  status: 'pending';
  createdAt: string;
}

interface PublicSlotSetting {
  date: string;
  time: string;
  blocked: boolean;
}

interface PendingAppointmentRequest {
  referenceCode: string;
  preferredDate: string;
  preferredTime: string;
}

function localDateString() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Manila',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

export const OutreachBookingModal: React.FC<{ user: User }> = ({ user }) => {
  const {
    t,
    language,
    bookingModalOpen,
    setBookingModalOpen,
    clinicOpen,
    markAppointmentRequestPending,
    selectedProgramForBooking,
    siteContent,
  } = useHealthCenter();
  const services = siteContent.services;
  const [serviceId, setServiceId] = useState('checkup');
  const [patientName, setPatientName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [zone, setZone] = useState('San Pedro');
  const [preferredDate, setPreferredDate] = useState(localDateString);
  const [preferredTime, setPreferredTime] = useState('morning');
  const [privacyConsent, setPrivacyConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [availabilityError, setAvailabilityError] = useState('');
  const [receipt, setReceipt] = useState<AppointmentReceipt | null>(null);
  const [slotSettings, setSlotSettings] = useState<PublicSlotSetting[]>([]);
  const [pendingRequest, setPendingRequest] = useState<PendingAppointmentRequest | null>(null);
  const [pendingRequestLoaded, setPendingRequestLoaded] = useState(false);

  useEffect(() => {
    if (selectedProgramForBooking && services.some((service) => service.id === selectedProgramForBooking)) {
      setServiceId(selectedProgramForBooking);
    }
  }, [selectedProgramForBooking, services]);

  useEffect(() => {
    if (services.length > 0 && !services.some((service) => service.id === serviceId)) {
      setServiceId(services[0].id);
    }
  }, [services, serviceId]);

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

  useEffect(() => {
    if (!bookingModalOpen) {
      setPendingRequestLoaded(false);
      return;
    }
    let active = true;
    const loadAvailability = async () => {
      try {
        const token = await user.getIdToken();
        const response = await fetch('/api/appointments', {
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store',
        });
        const result = await response.json() as {
          slotSettings?: PublicSlotSetting[];
          appointments?: Array<{ reference_code: string; preferred_date: string; preferred_time: string; status: string }>;
          error?: string;
        };
        if (!response.ok || !Array.isArray(result.slotSettings)) {
          throw new Error(result.error || 'Appointment availability could not be loaded.');
        }
        if (active) {
          setSlotSettings(result.slotSettings);
          const pending = result.appointments?.find((appointment) => appointment.status.toLowerCase() === 'pending');
          setPendingRequest(pending ? {
            referenceCode: pending.reference_code,
            preferredDate: pending.preferred_date,
            preferredTime: pending.preferred_time,
          } : null);
          setPendingRequestLoaded(true);
          setAvailabilityError('');
        }
      } catch (caught) {
        if (active) {
          setAvailabilityError(caught instanceof Error ? caught.message : 'Appointment availability could not be loaded.');
          setPendingRequestLoaded(false);
        }
      }
    };
    void loadAvailability();
    const timer = window.setInterval(() => void loadAvailability(), 3000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [bookingModalOpen, user]);

  if (!bookingModalOpen) return null;

  const isFilipino = language === 'fil';
  const canSubmitAppointment = clinicOpen === true;
  const selectedService = services.find((service) => service.id === serviceId);
  const today = localDateString();
  const dateBlocked = slotSettings.some((setting) => setting.date === preferredDate && setting.time === 'all_day' && setting.blocked);
  const timeBlocked = slotSettings.some((setting) => setting.date === preferredDate && setting.time === preferredTime && setting.blocked);
  const slotUnavailable = dateBlocked || timeBlocked;

  const handleClose = () => setBookingModalOpen(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    if (!pendingRequestLoaded) {
      setError(isFilipino ? 'Sinusuri muna kung may nakabinbing request. Subukan muli sandali.' : 'Checking for a pending request. Please try again in a moment.');
      return;
    }
    if (pendingRequest) return;
    if (!selectedService) {
      setError(isFilipino ? 'Walang available na serbisyo para sa appointment request.' : 'No services are currently available for appointment requests.');
      return;
    }
    if (!canSubmitAppointment) {
      setError(isFilipino ? 'Sarado muna ang pagtanggap ng appointment request.' : 'The clinic is not currently accepting appointment requests.');
      return;
    }
    if (phone.replace(/\D/g, '').length < 7) {
      setError(isFilipino ? 'Maglagay ng wastong contact number na may hindi bababa sa 7 digit.' : 'Enter a valid contact number with at least 7 digits.');
      return;
    }
    if (slotUnavailable) {
      setError(isFilipino ? 'Hindi available ang napiling petsa o oras. Pumili ng ibang schedule.' : 'The selected date or time is unavailable. Please choose another schedule.');
      return;
    }
    setSubmitting(true);

    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
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
      const responseBody = await response.text();
      let result: AppointmentReceipt & {
        error?: string;
        pendingRequest?: PendingAppointmentRequest;
      };
      try {
        result = JSON.parse(responseBody) as AppointmentReceipt & { error?: string };
      } catch {
        throw new Error(isFilipino
          ? 'Pansamantalang hindi magamit ang serbisyo ng appointment. Subukan muli mamaya.'
          : `Appointment service is temporarily unavailable (HTTP ${response.status}). Please try again later.`);
      }
      if (!response.ok) {
        if (response.status === 409 && result.pendingRequest) {
          setPendingRequest(result.pendingRequest);
          setPendingRequestLoaded(true);
          markAppointmentRequestPending();
        }
        const message = response.status === 401
          ? 'Your sign-in could not be verified. Check that the Firebase service account in Vercel belongs to this app’s Firebase project, then redeploy.'
          : result.error || 'Could not submit your appointment request.';
        throw new Error(message);
      }
      setPendingRequest({
        referenceCode: result.referenceCode,
        preferredDate,
        preferredTime,
      });
      markAppointmentRequestPending();
      setReceipt(result);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Could not submit your appointment request.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/60 p-2 pt-[max(0.5rem,env(safe-area-inset-top))] pb-[max(0.5rem,env(safe-area-inset-bottom))] backdrop-blur-sm sm:items-center sm:p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) handleClose(); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="appointment-title" className="my-0 max-h-[calc(100dvh-1rem-env(safe-area-inset-top)-env(safe-area-inset-bottom))] w-full max-w-2xl overflow-y-auto bg-white shadow-2xl sm:my-5 sm:max-h-[92vh]">
        <header className="flex items-start justify-between gap-3 border-b border-slate-200 px-4 py-4 sm:gap-5 sm:px-7 sm:py-5">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-teal-800">Mayor Moises R. Flores Health Center</div>
            <h2 id="appointment-title" className="mt-1 text-xl font-bold text-slate-950 sm:text-2xl">{receipt ? (isFilipino ? 'Natanggap ang request' : 'Request received') : (isFilipino ? 'Online appointment request' : 'Request an appointment')}</h2>
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
                <p className="mt-4 text-sm text-slate-700">{selectedService?.title}</p>
                <p className="mt-1 text-sm text-slate-600">{preferredDate} · {preferredTime === 'morning' ? 'Morning' : 'Afternoon'} · {zone}</p>
                <p className="mt-4 text-xs text-slate-500">{isFilipino ? 'Reference number' : 'Request reference'}: <strong className="font-mono text-slate-900">{receipt.referenceCode}</strong></p>
                <button onClick={handleClose} className="mt-6 px-4 py-2.5 bg-teal-900 text-white text-sm font-bold rounded-md hover:bg-teal-950">{isFilipino ? 'Isara' : 'Done'}</button>
              </div>
            </div>
          </div>
        ) : pendingRequest ? (
          <div className="space-y-4 px-4 py-6 sm:px-7 sm:py-8" role="status" aria-live="polite">
            <div className="border border-amber-200 bg-amber-50 p-4 text-amber-950">
              <h3 className="text-base font-bold">{isFilipino ? 'May request ka pang sinusuri' : 'You already have a request under review'}</h3>
              <p className="mt-2 text-sm leading-relaxed">
                {isFilipino
                  ? 'Maghintay ng aksyon ng clinic staff bago magpadala ng panibagong appointment request. Maaari kang mag-request muli kapag tinanggap o tinanggihan na ang kasalukuyang request.'
                  : 'Please wait for clinic staff to accept or reject this request before sending another appointment request.'}
              </p>
            </div>
            <dl className="grid gap-2 text-sm sm:grid-cols-2">
              <div><dt className="text-xs font-semibold text-slate-500">{isFilipino ? 'Reference number' : 'Request reference'}</dt><dd className="break-all font-mono font-bold text-slate-900">{pendingRequest.referenceCode}</dd></div>
              <div><dt className="text-xs font-semibold text-slate-500">{isFilipino ? 'Petsa at oras' : 'Preferred schedule'}</dt><dd className="font-semibold text-slate-900">{pendingRequest.preferredDate} · {pendingRequest.preferredTime}</dd></div>
            </dl>
            <p className="text-xs text-slate-500">{isFilipino ? 'Awtomatikong susuriin muli ang status habang bukas ang pahinang ito.' : 'This page will automatically check again while it is open.'}</p>
          </div>
        ) : !pendingRequestLoaded ? (
          <p className="px-4 py-8 text-center text-sm text-slate-600 sm:px-7" role="status">
            {availabilityError || (isFilipino
              ? 'Sinusuri ang mga nakabinbing appointment request...'
              : 'Checking for pending appointment requests...')}
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5 px-4 py-5 sm:px-7 sm:py-6">
            {!canSubmitAppointment && (
              <p role="status" className="border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">
                {clinicOpen === false
                  ? (isFilipino ? 'Sarado ngayon ang pagtanggap ng appointment request. Subukan muli kapag bukas na.' : 'The clinic is currently closed to appointment requests. Please try again when it is open.')
                  : (isFilipino ? 'Tinitingnan ang availability ng appointment...' : 'Checking appointment availability...')}
              </p>
            )}
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label htmlFor="appointment-service" className="block text-sm font-semibold text-slate-800 mb-1.5">{isFilipino ? 'Serbisyo' : 'Service'}</label>
                <select id="appointment-service" value={serviceId} onChange={(event) => setServiceId(event.target.value)} className="w-full px-3.5 py-3 bg-white border border-slate-300 rounded-md text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-700">
                  {services.map((service) => <option key={service.id} value={service.id}>{isFilipino ? service.titleFil : service.title}</option>)}
                </select>
                {services.length === 0 && <p role="status" className="mt-2 text-xs text-amber-800">{isFilipino ? 'Walang kasalukuyang nailathalang serbisyo para sa appointment request.' : 'There are no published services available for appointment requests.'}</p>}
              </div>
              <div>
                <label htmlFor="appointment-name" className="block text-sm font-semibold text-slate-800 mb-1.5">{t.formFullName} *</label>
                <input id="appointment-name" required minLength={2} maxLength={120} autoComplete="name" value={patientName} onChange={(event) => setPatientName(event.target.value)} className="w-full px-3.5 py-3 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-teal-700" />
              </div>
              <div>
                <label htmlFor="appointment-phone" className="block text-sm font-semibold text-slate-800 mb-1.5">{t.formPhone} *</label>
                <input id="appointment-phone" required type="tel" inputMode="tel" autoComplete="tel" minLength={7} maxLength={32} value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="09XX XXX XXXX" className="w-full px-3.5 py-3 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-teal-700" />
              </div>
              <div>
                <label htmlFor="appointment-email" className="block text-sm font-semibold text-slate-800 mb-1.5">{t.formEmail}</label>
                <input id="appointment-email" type="email" autoComplete="email" maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} className="w-full px-3.5 py-3 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-teal-700" />
              </div>
              <div>
                <label htmlFor="appointment-zone" className="block text-sm font-semibold text-slate-800 mb-1.5">{t.formZone} *</label>
                <select id="appointment-zone" required value={zone} onChange={(event) => setZone(event.target.value)} className="w-full px-3.5 py-3 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-teal-700">
                  <option>San Pedro</option><option>Magtanggol</option><option>Tabacalera</option>
                </select>
              </div>
              <div>
                <label htmlFor="appointment-date" className="block text-sm font-semibold text-slate-800 mb-1.5">{t.formDate} *</label>
                <input id="appointment-date" required type="date" min={today} value={preferredDate} onChange={(event) => setPreferredDate(event.target.value)} className="w-full px-3.5 py-3 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-teal-700" />
              </div>
              <div>
                <label htmlFor="appointment-time" className="block text-sm font-semibold text-slate-800 mb-1.5">{t.formTimeSlot} *</label>
                <select id="appointment-time" value={preferredTime} onChange={(event) => setPreferredTime(event.target.value)} className="w-full px-3.5 py-3 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-teal-700">
                  <option value="morning">Morning</option><option value="afternoon">Afternoon</option>
                </select>
              </div>
            </div>

            {slotUnavailable && <p role="status" className="text-sm font-semibold text-rose-800">{isFilipino ? 'Sarado ang napiling petsa o time slot. Pumili ng ibang schedule.' : 'This date or time slot is blocked by clinic staff. Choose a different schedule.'}</p>}
            {availabilityError && <p role="status" className="text-xs text-amber-800">{isFilipino ? 'Hindi ma-check ang availability. Susuriin muli ang napiling schedule kapag ipinadala.' : 'Availability could not be checked. The server will verify your selected schedule when you submit.'}</p>}

            <label className="flex items-start gap-3 border-t border-slate-200 pt-4 text-sm text-slate-600">
              <input type="checkbox" required checked={privacyConsent} onChange={(event) => setPrivacyConsent(event.target.checked)} className="mt-0.5 h-4 w-4 accent-teal-800" />
              <span>{isFilipino ? 'Pumapayag akong gamitin ng health center staff ang aking contact details para suriin at sagutin ang appointment request na ito.' : 'I agree that health center staff may use my contact details to review and respond to this appointment request.'}</span>
            </label>

            {error && <p role="alert" className="flex items-start gap-2 text-sm text-rose-800"><AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />{error}</p>}

            <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-slate-200 pt-4">
              <p className="flex items-center gap-2 text-xs text-slate-500"><Clock className="w-4 h-4" />{isFilipino ? 'Pending ang request hanggang makumpirma ng staff.' : 'Requests remain pending until staff confirm.'}</p>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={handleClose} className="min-h-11 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 rounded-md">{isFilipino ? 'Kanselahin' : 'Cancel'}</button>
                <button type="submit" disabled={submitting || !canSubmitAppointment || !selectedService || !privacyConsent} className="inline-flex min-h-11 items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-teal-900 hover:bg-teal-950 disabled:cursor-not-allowed disabled:opacity-60 rounded-md"><CalendarDays className="w-4 h-4" />{submitting ? (isFilipino ? 'Ipinapadala...' : 'Sending...') : (isFilipino ? 'Ipadala ang request' : 'Send appointment request')}</button>
              </div>
            </div>
          </form>
        )}
      </section>
    </div>
  );
};
