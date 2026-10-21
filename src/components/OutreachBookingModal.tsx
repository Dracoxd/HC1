import React, { useState, useEffect } from 'react';
import { useHealthCenter } from '../context/HealthCenterContext';
import { OUTREACH_PROGRAMS, ZONES_COVERAGE } from '../data/healthCenterData';
import { AppointmentBooking } from '../types';
import { X, Calendar, Clock, CheckCircle2, Ticket, QrCode } from 'lucide-react';

export const OutreachBookingModal: React.FC = () => {
  const { 
    t, 
    language, 
    bookingModalOpen, 
    setBookingModalOpen, 
    selectedProgramForBooking, 
    bookAppointment 
  } = useHealthCenter();

  const [programId, setProgramId] = useState<string>(selectedProgramForBooking || OUTREACH_PROGRAMS[0].id);
  const [patientName, setPatientName] = useState('');
  const [dob, setDob] = useState('1995-05-15');
  const [zone, setZone] = useState('2. Magtanggol');
  const [phone, setPhone] = useState('+63 9');
  const [email, setEmail] = useState('');
  const [philHealth, setPhilHealth] = useState('');
  const [appointmentDate, setAppointmentDate] = useState('2026-03-09');
  const [timeSlot, setTimeSlot] = useState('8:00 AM - 9:00 AM');
  const [notes, setNotes] = useState('');

  const [confirmedBooking, setConfirmedBooking] = useState<AppointmentBooking | null>(null);

  useEffect(() => {
    if (selectedProgramForBooking) {
      setProgramId(selectedProgramForBooking);
    }
  }, [selectedProgramForBooking]);

  if (!bookingModalOpen) return null;

  const selectedProgram = OUTREACH_PROGRAMS.find(p => p.id === programId) || OUTREACH_PROGRAMS[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName.trim()) return;

    const newBooking = bookAppointment({
      programId: selectedProgram.id,
      programTitle: language === 'fil' ? selectedProgram.titleFil : selectedProgram.title,
      patientName: patientName.trim(),
      dateOfBirth: dob,
      contactNumber: phone,
      email: email.trim(),
      zone,
      appointmentDate,
      timeSlot,
      philHealthNumber: philHealth.trim(),
      notes: notes.trim()
    });

    setConfirmedBooking(newBooking);
  };

  const handleClose = () => {
    setBookingModalOpen(false);
    setConfirmedBooking(null);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-200 my-8">
        
        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-4">
          <div>
            <div className="text-xs font-bold text-teal-800 uppercase tracking-wider">
              {language === 'fil' ? 'Mr. Flores Health Center Pateros' : 'Municipal Health Outreach'}
            </div>
            <h3 className="text-xl font-bold text-slate-900 mt-0.5">
              {confirmedBooking ? t.bookingSuccessTitle : t.outreachTitle}
            </h3>
          </div>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg cursor-pointer"
            aria-label="Close booking modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {confirmedBooking ? (
          /* Confirmation Ticket Pass */
          <div className="space-y-6">
            <div className="p-5 rounded-xl bg-teal-50/80 border border-teal-200 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-teal-900 font-bold text-sm">
                  <CheckCircle2 className="w-5 h-5 text-teal-700" />
                  <span>{t.bookingSuccessTitle}</span>
                </div>
                <span className="font-mono text-xs font-bold bg-white px-2 py-1 rounded border border-teal-300 text-teal-950">
                  {confirmedBooking.referenceCode}
                </span>
              </div>

              <div className="space-y-1 text-xs text-slate-700 border-t border-teal-200/60 pt-3">
                <div className="font-bold text-slate-900 text-sm">
                  {confirmedBooking.programTitle}
                </div>
                <div>Patient Name: <span className="font-semibold">{confirmedBooking.patientName}</span></div>
                <div>Resident Zone: <span className="font-semibold">{confirmedBooking.zone}</span></div>
                <div>Date & Time: <span className="font-semibold text-teal-900">{confirmedBooking.appointmentDate} · {confirmedBooking.timeSlot}</span></div>
              </div>

              {/* Barcode / Verification Placeholder */}
              <div className="pt-3 border-t border-dashed border-teal-300 flex items-center justify-between text-[11px] text-slate-500">
                <span>Facility: Mr. Flores Health Center (Pateros)</span>
                <span className="font-mono">VERIFIED DIGITAL PASS</span>
              </div>
            </div>

            <div className="space-y-2 text-xs text-slate-600">
              <div className="font-bold text-slate-900 uppercase tracking-wide">
                {t.labelBringToClinic}
              </div>
              <ul className="space-y-1 list-disc pl-4 text-slate-600">
                <li>Government ID or Barangay Certificate of Residency in San Pedro, Magtanggol, or Tabacalera.</li>
                <li>Health Card / Pink Mother's Book / Yellow Child Book / Senior Citizen Card.</li>
                <li>Arrive at least 15 minutes before your scheduled window for registration and vital signs triage.</li>
              </ul>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={handleClose}
                className="px-5 py-2 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          /* Booking Form */
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {/* Program Selection */}
            <div>
              <label className="block font-semibold text-slate-800 mb-1">
                Select Program or Clinic Service
              </label>
              <select
                value={programId}
                onChange={(e) => setProgramId(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-700"
              >
                {OUTREACH_PROGRAMS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {language === 'fil' ? p.titleFil : p.title} ({p.scheduleDate})
                  </option>
                ))}
              </select>
            </div>

            {/* Patient Name and DOB */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-800 mb-1">
                  {t.formFullName} *
                </label>
                <input
                  type="text"
                  required
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  placeholder="e.g. Maria Santos"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-700"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-800 mb-1">
                  {t.formDob}
                </label>
                <input
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-700"
                />
              </div>
            </div>

            {/* Resident Barangay and Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-800 mb-1">
                  {t.formZone}
                </label>
                <select
                  value={zone}
                  onChange={(e) => setZone(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-700"
                >
                  <option value="1. San Pedro">1. San Pedro</option>
                  <option value="2. Magtanggol">2. Magtanggol</option>
                  <option value="3. Tabacalera">3. Tabacalera</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-800 mb-1">
                  {t.formPhone} *
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+63 9XX XXX XXXX"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-700"
                />
              </div>
            </div>

            {/* PhilHealth & Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-800 mb-1">
                  {t.formPhilHealth}
                </label>
                <input
                  type="text"
                  value={philHealth}
                  onChange={(e) => setPhilHealth(e.target.value)}
                  placeholder="Optional / MDR number"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-700"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-800 mb-1">
                  {t.formEmail}
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-700"
                />
              </div>
            </div>

            {/* Date and Time Slot */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-800 mb-1">
                  {t.formDate}
                </label>
                <input
                  type="date"
                  value={appointmentDate}
                  onChange={(e) => setAppointmentDate(e.target.value)}
                  min="2026-03-01"
                  max="2026-05-30"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-700"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-800 mb-1">
                  {t.formTimeSlot}
                </label>
                <select
                  value={timeSlot}
                  onChange={(e) => setTimeSlot(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-700"
                >
                  <option value="7:00 AM - 8:30 AM">7:00 AM - 8:30 AM (Early Intake / 3rd Flr X-Ray)</option>
                  <option value="8:30 AM - 10:00 AM">8:30 AM - 10:00 AM (Morning Triage)</option>
                  <option value="10:00 AM - 11:30 AM">10:00 AM - 11:30 AM (OPT Child / Doctor)</option>
                  <option value="1:00 PM - 2:30 PM">1:00 PM - 2:30 PM (Afternoon OPD Refills)</option>
                  <option value="2:30 PM - 3:30 PM">2:30 PM - 3:30 PM (Late Session)</option>
                </select>
              </div>
            </div>

            {/* Medical Notes */}
            <div>
              <label className="block font-semibold text-slate-800 mb-1">
                {t.formNotes}
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Brief reason for consultation, symptoms, or maintenance medications needed..."
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-700"
              />
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg shadow-xs cursor-pointer"
              >
                {t.btnSubmitBooking}
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};
