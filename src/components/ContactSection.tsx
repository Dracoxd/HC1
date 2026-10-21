import React, { useState } from 'react';
import { useHealthCenter } from '../context/HealthCenterContext';
import { Phone, Mail, MapPin, Clock, Send, CheckCircle2, AlertCircle } from 'lucide-react';

export const ContactSection: React.FC = () => {
  const { t, language, submitContact } = useHealthCenter();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [zone, setZone] = useState('2. Magtanggol');
  const [topic, setTopic] = useState('Maintenance Medicine Refill');
  const [message, setMessage] = useState('');
  const [submittedTicket, setSubmittedTicket] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !message.trim()) return;

    const res = submitContact({
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim(),
      zone,
      topic,
      message: message.trim()
    });

    setSubmittedTicket(res.ticketId);
    setName('');
    setPhone('');
    setEmail('');
    setMessage('');
  };

  return (
    <section id="contact" className="py-16 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* Header */}
        <div className="max-w-3xl space-y-2">
          <div className="text-xs font-bold text-teal-800 uppercase tracking-wider">
            {language === 'fil' ? 'Tanggapan at Ugnayan' : 'Community Care Inquiries'}
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight" style={{ textWrap: 'balance' }}>
            {t.contactTitle}
          </h2>
          <p className="text-sm text-slate-600">
            {t.contactSubtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* Left: Contact Form */}
          <div className="lg:col-span-7 bg-slate-50 p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs">
            {submittedTicket ? (
              <div className="p-6 bg-white rounded-xl border border-teal-200 text-center space-y-4">
                <CheckCircle2 className="w-12 h-12 text-teal-700 mx-auto" />
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-slate-900">
                    {language === 'fil' ? 'Naisumite ang Katanungan' : 'Inquiry Submitted Successfully'}
                  </h3>
                  <p className="text-xs text-slate-600">
                    {t.inquirySuccess}
                  </p>
                  <div className="pt-2 text-xs font-mono font-bold text-teal-800">
                    Ticket ID: {submittedTicket}
                  </div>
                </div>
                <button
                  onClick={() => setSubmittedTicket(null)}
                  className="px-4 py-2 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg cursor-pointer"
                >
                  Send Another Inquiry
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-800 mb-1">
                      {t.contactFormName} *
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Juan Dela Cruz"
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-700 text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-800 mb-1">
                      {t.contactFormPhone} *
                    </label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+63 9XX XXX XXXX"
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-700 text-slate-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-800 mb-1">
                      {t.contactFormEmail}
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-700 text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-800 mb-1">
                      {t.contactFormZone}
                    </label>
                    <select
                      value={zone}
                      onChange={(e) => setZone(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-700 text-slate-900"
                    >
                      <option value="1. San Pedro">1. San Pedro</option>
                      <option value="2. Magtanggol">2. Magtanggol</option>
                      <option value="3. Tabacalera">3. Tabacalera</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-800 mb-1">
                    {t.contactFormTopic}
                  </label>
                  <select
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-700 text-slate-900"
                  >
                    <option value="Maintenance Medicine Refill">Maintenance Medicine Refill (Amlodipine / Metformin / Losartan)</option>
                    <option value="3rd Floor X-Ray Clinic Inquiry">3rd Floor X-Ray Clinic (7:00 AM - 10:00 AM)</option>
                    <option value="Operation Timbang Plus (OPT)">Operation Timbang Plus (0-59 months growth screening)</option>
                    <option value="Dental Clinic Consultation">Dental Clinic (Monday, Wednesday, Friday)</option>
                    <option value="Animal Bite / Rabies Vaccine">Animal Bite Wound / Rabies Vaccination Schedule</option>
                    <option value="Maternal & Prenatal Checkup">Maternal Care & Prenatal Coordination</option>
                    <option value="General Health Question">General Health Center Inquiry</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-800 mb-1">
                    {t.contactFormMessage} *
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Enter your inquiry or request details..."
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-700 text-slate-900"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                >
                  <Send className="w-4 h-4" />
                  <span>{t.btnSendInquiry}</span>
                </button>
              </form>
            )}
          </div>

          {/* Right: Emergency Contacts & Location Info */}
          <div className="lg:col-span-5 space-y-6">
            {/* Hotlines Card */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Phone className="w-4 h-4 text-rose-600" />
                <span>{t.hotlineTitle}</span>
              </h3>

              <div className="space-y-3 text-xs">
                <div className="p-3 bg-rose-50/70 border border-rose-100 rounded-xl space-y-1">
                  <div className="font-semibold text-rose-950">Pateros Municipal Emergency Rescue</div>
                  <div className="text-rose-800 font-mono font-bold text-sm">(02) 8642-5159</div>
                  <div className="text-[11px] text-rose-700">24/7 Ambulance & Disaster Response</div>
                </div>

                <div className="p-3 bg-amber-50/70 border border-amber-100 rounded-xl space-y-1">
                  <div className="font-semibold text-amber-950">Animal Bite Immediate Triage Hotline</div>
                  <div className="text-amber-800 font-mono font-bold text-sm">(02) 8641-7640</div>
                  <div className="text-[11px] text-amber-700">For active bite assessment guidance</div>
                </div>

                <div className="p-3 bg-teal-50/70 border border-teal-100 rounded-xl space-y-1">
                  <div className="font-semibold text-teal-950">Mr. Flores Health Center Desk</div>
                  <div className="text-teal-800 font-mono font-bold text-sm">(02) 8642-1923</div>
                  <div className="text-[11px] text-teal-700">Mon - Fri: 7:00 AM - 4:00 PM</div>
                </div>
              </div>
            </div>

            {/* Location & Directions */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 text-xs text-slate-700">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                <MapPin className="w-4 h-4 text-teal-700" />
                <span>Facility Location & Accessibility</span>
              </div>

              <div className="space-y-1 text-slate-600">
                <div className="font-medium text-slate-800">Mr. Flores Health Center</div>
                <div>Serving San Pedro, Magtanggol, and Tabacalera</div>
                <div>Municipality of Pateros, Metro Manila, Philippines</div>
              </div>

              <div className="pt-2 border-t border-slate-200 text-[11px] text-slate-500 space-y-1">
                <div>• Ground Floor: Triage, Doctor OPD, Dental Clinic, Pharmacy</div>
                <div>• 2nd Floor: Clinical Diagnostic Laboratory (MedTechs)</div>
                <div>• 3rd Floor: Pateros X-Ray Clinic Radiological Section (7AM-10AM)</div>
                <div>• Fully wheelchair accessible via entrance ramp</div>
              </div>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
};
