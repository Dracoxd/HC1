import React from 'react';
import { useHealthCenter } from '../context/HealthCenterContext';
import { OUTREACH_PROGRAMS } from '../data/healthCenterData';
import { Calendar, Clock, MapPin, Users, CheckCircle, Ticket, XCircle } from 'lucide-react';

export const OutreachSection: React.FC = () => {
  const {
    t,
    language,
    openBookingForProgram,
    setBookingModalOpen,
    appointments,
    cancelAppointment
  } = useHealthCenter();

  return (
    <section id="outreach" className="py-16 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">


        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="max-w-3xl space-y-2">
            <div className="text-xs font-bold text-teal-800 uppercase tracking-wider">
              {language === 'fil' ? 'Programang Pangkomunidad' : 'Community Health Campaigns'}
            </div>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight" style={{ textWrap: 'balance' }}>
              {t.outreachTitle}
            </h2>
            <p className="text-sm text-slate-600">
              {t.outreachSubtitle}
            </p>
          </div>

          <button
            onClick={() => setBookingModalOpen(true)}
            className="px-5 py-2.5 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg shadow-sm transition-colors flex items-center gap-2 cursor-pointer self-start md:self-auto"
          >
            <Calendar className="w-4 h-4" />
            <span>{t.btnBookOutreach}</span>
          </button>
        </div>


        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {OUTREACH_PROGRAMS.map((program) => (
            <div
              key={program.id}
              className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col justify-between hover:border-slate-300 transition-all shadow-xs"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-teal-800 bg-teal-50 px-2 py-0.5 rounded">
                    {program.targetBarangay}
                  </span>
                  <span className="font-mono tabular-nums text-slate-500">
                    {program.slotsRemaining} slots open
                  </span>
                </div>

                <div className="space-y-1.5">
                  <h3 className="text-base font-bold text-slate-900">
                    {language === 'fil' ? program.titleFil : program.title}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {language === 'fil' ? program.descriptionFil : program.description}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100 space-y-2 text-xs text-slate-600">
                  <div className="flex items-start gap-2">
                    <Calendar className="w-3.5 h-3.5 text-teal-700 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-medium text-slate-800">{program.scheduleDate}</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-slate-700">{program.timeWindow}</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-slate-700">{program.location}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-500">
                  {language === 'fil' ? program.eligibilityFil : program.eligibility}
                </span>

                <button
                  onClick={() => openBookingForProgram(program.id)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                >
                  {language === 'fil' ? 'Pumili ng Slot' : 'Reserve Slot'}
                </button>
              </div>
            </div>
          ))}
        </div>


        {appointments.length > 0 && (
          <div className="pt-10 border-t border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Ticket className="w-5 h-5 text-teal-700" />
                  <span>{language === 'fil' ? 'Aking mga Nakatakdang Iskedyul' : 'Your Scheduled Appointments'}</span>
                </h3>
                <p className="text-xs text-slate-500">
                  {language === 'fil'
                    ? 'Ipakita ang reference code sa triage desk pagdating sa Mr. Flores Health Center.'
                    : 'Present this reference ticket at the health center registration desk on arrival.'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {appointments.map((apt) => (
                <div
                  key={apt.id}
                  className={`p-4 rounded-xl border transition-all ${
                    apt.status === 'Cancelled'
                      ? 'bg-slate-50 border-slate-200 opacity-60'
                      : 'bg-teal-50/40 border-teal-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-xs font-mono font-bold text-teal-900">
                        {apt.referenceCode}
                      </span>
                      <h4 className="text-sm font-bold text-slate-900 mt-0.5">
                        {apt.programTitle}
                      </h4>
                      <div className="text-xs text-slate-600 mt-1">
                        Patient: <span className="font-semibold text-slate-900">{apt.patientName}</span> ({apt.zone})
                      </div>
                    </div>

                    <div className="text-right">
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
                        apt.status === 'Confirmed' ? 'bg-teal-100 text-teal-800' : 'bg-slate-200 text-slate-700'
                      }`}>
                        {apt.status}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-teal-100/80 flex flex-wrap items-center justify-between text-xs text-slate-600 gap-2">
                    <div className="flex items-center gap-3">
                      <span>{apt.appointmentDate}</span>
                      <span aria-hidden="true">·</span>
                      <span>{apt.timeSlot}</span>
                    </div>

                    {apt.status === 'Confirmed' && (
                      <button
                        onClick={() => cancelAppointment(apt.id)}
                        className="text-xs text-rose-600 hover:text-rose-800 font-medium cursor-pointer"
                      >
                        {language === 'fil' ? 'Kanselahin' : 'Cancel'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </section>
  );
};
