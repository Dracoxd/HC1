import React from 'react';
import { useHealthCenter } from '../context/HealthCenterContext';
import { Clock, MapPin, CalendarDays, ShieldAlert } from 'lucide-react';

export const ContactSection: React.FC = () => {
  const { t, language, setBookingModalOpen, clinicOpen, appointmentRequestAvailability } = useHealthCenter();
  const bookingEnabled = clinicOpen === true && appointmentRequestAvailability === 'available';
  const bookingLabel = appointmentRequestAvailability === 'pending'
    ? 'Appointment under review'
    : appointmentRequestAvailability === 'checking'
      ? 'Checking request status'
      : appointmentRequestAvailability === 'error'
        ? 'Unable to check request'
        : clinicOpen === true ? 'REQUEST AN APPOINTMENT' : clinicOpen === false ? 'CLOSED' : 'Checking availability';

  return (
    <section id="contact" className="py-16 sm:py-20 bg-[#f3f7f4] border-t border-slate-200">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">
        <div className="max-w-2xl mb-10">
          <div className="text-xs font-bold text-teal-800 uppercase tracking-wider mb-3">
            {language === 'fil' ? 'Makipag-ugnayan' : 'Visit or call'}
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-950">
            {t.contactTitle}
          </h2>
          <p className="mt-3 text-base text-slate-600">
            {language === 'fil' ? 'Magpadala ng online appointment request. Makikipag-ugnayan ang kawani para kumpirmahin ito.' : 'Send an appointment request online. Clinic staff will contact you to confirm.'}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 border-y border-slate-300 py-7">
          <div className="flex gap-4">
            <CalendarDays className="w-5 h-5 text-teal-800 shrink-0 mt-1" />
            <div>
              <h3 className="text-sm font-bold text-slate-900">Online appointment</h3>
              <p className="mt-1 text-sm text-slate-600">Choose a service and preferred date. Requests are confirmed by clinic staff.</p>
              <button disabled={!bookingEnabled} onClick={() => setBookingModalOpen(true)} className="mt-3 min-h-11 px-4 py-2.5 bg-teal-900 text-white text-sm font-bold rounded-md hover:bg-teal-950 disabled:cursor-not-allowed disabled:opacity-50">{bookingLabel}</button>
            </div>
          </div>

          <div className="flex gap-4">
            <MapPin className="w-5 h-5 text-teal-800 shrink-0 mt-1" />
            <div>
              <h3 className="text-sm font-bold text-slate-900">Mayor Moises R. Flores Health Center</h3>
              <p className="mt-1 text-sm text-slate-600">Municipality of Pateros, Metro Manila</p>
              <p className="mt-1 text-sm text-slate-600">Serving San Pedro, Magtanggol, and Tabacalera</p>
            </div>
          </div>

          <div className="flex gap-4">
            <Clock className="w-5 h-5 text-teal-800 shrink-0 mt-1" />
            <div>
              <h3 className="text-sm font-bold text-slate-900">Clinic schedules</h3>
              <p className="mt-1 text-sm text-slate-600">Doctors: Mon 8 AM-3 PM · Tue-Fri 9 AM-3 PM</p>
              <p className="mt-1 text-sm text-slate-600">X-ray: Mon-Fri 7 AM-10 AM · 3rd floor</p>
              <p className="mt-1 text-sm text-slate-600">Dental: Monday, Wednesday, Friday</p>
            </div>
          </div>
        </div>

        <a href="tel:+63286425159" className="mt-6 flex items-start gap-3 text-sm text-slate-700 hover:text-teal-900">
          <ShieldAlert className="w-4 h-4 text-rose-700 shrink-0 mt-0.5" />
          <span><strong className="text-slate-900">Emergency rescue:</strong> (02) 8642-5159 · 24-hour ambulance and disaster response</span>
        </a>
      </div>
    </section>
  );
};
