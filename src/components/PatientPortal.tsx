import React, { useState } from 'react';
import { useHealthCenter } from '../context/HealthCenterContext';
import {
  UserCheck,
  Plus,
  Activity,
  Pill,
  MessageSquare,
  Send,
  ShieldCheck,
  User,
  Search,
  LogOut,
  Calendar,
  CheckCircle2
} from 'lucide-react';

export const PatientPortal: React.FC = () => {
  const {
    t,
    language,
    patientRecords,
    activePatient,
    registerPatientRecord,
    setActivePatient,
    addPatientVitals,
    addPatientPrescription,
    patientMessages,
    sendPatientMessage
  } = useHealthCenter();

  const [activeTab, setActiveTab] = useState<'records' | 'prescriptions' | 'messaging'>('records');
  const [chatInput, setChatInput] = useState('');


  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [regName, setRegName] = useState('');
  const [regDob, setRegDob] = useState('1990-01-01');
  const [regGender, setRegGender] = useState('Female');
  const [regZone, setRegZone] = useState('2. Magtanggol');
  const [regPhone, setRegPhone] = useState('+63 9');
  const [regPhilHealth, setRegPhilHealth] = useState('');
  const [regCategory, setRegCategory] = useState<'maternal' | 'senior_maintenance' | 'pediatric_opt'>('maternal');


  const [showAddVitals, setShowAddVitals] = useState(false);
  const [bp, setBp] = useState('120/80');
  const [hr, setHr] = useState(75);
  const [wt, setWt] = useState(60);
  const [ht, setHt] = useState(160);
  const [vitalsNotes, setVitalsNotes] = useState('');


  const [showAddRx, setShowAddRx] = useState(false);
  const [medName, setMedName] = useState('Amlodipine (High blood)');
  const [medDosage, setMedDosage] = useState('5mg Tablet');
  const [medFreq, setMedFreq] = useState('Once daily');

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim()) return;

    registerPatientRecord({
      fullName: regName.trim(),
      birthDate: regDob,
      gender: regGender,
      zone: regZone,
      contactNumber: regPhone.trim(),
      philHealthNo: regPhilHealth.trim() || 'Pending Registration',
      category: regCategory
    });

    setShowRegisterForm(false);
    setRegName('');
  };

  const handleAddVitals = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePatient) return;

    addPatientVitals(activePatient.id, {
      bloodPressure: bp,
      heartRate: Number(hr),
      weightKg: Number(wt),
      heightCm: Number(ht),
      notes: vitalsNotes.trim() || 'Routine checkup'
    });

    setShowAddVitals(false);
    setVitalsNotes('');
  };

  const handleAddRx = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePatient) return;

    addPatientPrescription(activePatient.id, {
      medication: medName,
      dosage: medDosage,
      frequency: medFreq
    });

    setShowAddRx(false);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !activePatient) return;
    sendPatientMessage(chatInput);
    setChatInput('');
  };

  return (
    <section id="portal" className="py-16 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">


        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200 pb-4">
          <div className="space-y-1">
            <div className="text-xs font-bold text-teal-800 uppercase tracking-wider">
              {language === 'fil' ? 'Portal ng Pasyente' : 'Patient Record Portal'}
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {t.portalTitle}
            </h2>
            <p className="text-xs text-slate-600">
              {language === 'fil'
                ? 'Pamahalaan ang rekord ng kalusugan, vitals, at makipag-ugnayan sa health center.'
                : 'Manage health records, vitals, and secure messaging with health center staff.'}
            </p>
          </div>

          {activePatient && (
            <button
              onClick={() => setActivePatient(null)}
              className="text-xs font-medium text-slate-600 hover:text-rose-600 flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{language === 'fil' ? 'Magpalit ng Pasyente' : 'Switch Patient'}</span>
            </button>
          )}
        </div>


        {!activePatient ? (
          <div className="bg-slate-50 rounded-2xl p-6 sm:p-8 border border-slate-200 space-y-6">
            {!showRegisterForm ? (
              <div className="max-w-xl mx-auto text-center space-y-5">
                <div className="w-12 h-12 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center mx-auto">
                  <UserCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    {language === 'fil' ? 'Pumili o Magrehistro ng Rekord ng Pasyente' : 'Patient Access'}
                  </h3>
                  <p className="text-xs text-slate-600 mt-1">
                    {language === 'fil'
                      ? 'Magrehistro ng bagong rekord o pumili mula sa mga nai-save na pasyente sa San Pedro, Magtanggol, o Tabacalera.'
                      : 'Register a patient record or select from saved patient records in San Pedro, Magtanggol, or Tabacalera.'}
                  </p>
                </div>

                {patientRecords.length > 0 && (
                  <div className="space-y-2 text-left bg-white p-4 rounded-xl border border-slate-200">
                    <div className="text-xs font-semibold text-slate-700">
                      {language === 'fil' ? 'Mga Naka-save na Pasyente:' : 'Registered Patients:'}
                    </div>
                    <div className="divide-y divide-slate-100">
                      {patientRecords.map((p) => (
                        <div key={p.id} className="py-2 flex items-center justify-between">
                          <div>
                            <div className="text-xs font-bold text-slate-900">{p.fullName}</div>
                            <div className="text-[11px] text-slate-500">{p.patientNumber} · {p.zone}</div>
                          </div>
                          <button
                            onClick={() => setActivePatient(p)}
                            className="px-3 py-1 text-xs font-semibold text-teal-800 bg-teal-50 hover:bg-teal-100 rounded-md cursor-pointer"
                          >
                            Open Record
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-2">
                  <button
                    onClick={() => setShowRegisterForm(true)}
                    className="px-5 py-2.5 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg shadow-xs flex items-center gap-2 mx-auto cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{language === 'fil' ? 'Magrehistro ng Bagong Pasyente' : 'Register New Patient Record'}</span>
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleRegister} className="max-w-xl mx-auto space-y-4 text-xs">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <h3 className="text-base font-bold text-slate-900">
                    {language === 'fil' ? 'Pagpaparehistro ng Rekord ng Pasyente' : 'New Patient Record Registration'}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowRegisterForm(false)}
                    className="text-xs text-slate-500 hover:text-slate-800 cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>

                <div>
                  <label className="block font-semibold text-slate-800 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="e.g. Maria Santos"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-700"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-800 mb-1">
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      value={regDob}
                      onChange={(e) => setRegDob(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-700"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-800 mb-1">
                      Gender
                    </label>
                    <select
                      value={regGender}
                      onChange={(e) => setRegGender(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-700"
                    >
                      <option value="Female">Female</option>
                      <option value="Male">Male</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-800 mb-1">
                      Resident Zone *
                    </label>
                    <select
                      value={regZone}
                      onChange={(e) => setRegZone(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-700"
                    >
                      <option value="1. San Pedro">1. San Pedro</option>
                      <option value="2. Magtanggol">2. Magtanggol</option>
                      <option value="3. Tabacalera">3. Tabacalera</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-800 mb-1">
                      Program Category
                    </label>
                    <select
                      value={regCategory}
                      onChange={(e) => setRegCategory(e.target.value as any)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-700"
                    >
                      <option value="maternal">Maternity / Pregnant</option>
                      <option value="senior_maintenance">High Blood / Diabetics / TB</option>
                      <option value="pediatric_opt">Nutrition (0-59 months OPT)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-800 mb-1">
                      Contact Phone
                    </label>
                    <input
                      type="tel"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      placeholder="+63 9XX"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-700"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-800 mb-1">
                      PhilHealth / Barangay ID
                    </label>
                    <input
                      type="text"
                      value={regPhilHealth}
                      onChange={(e) => setRegPhilHealth(e.target.value)}
                      placeholder="Optional"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-700"
                    />
                  </div>
                </div>

                <div className="pt-3 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowRegisterForm(false)}
                    className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-200 rounded-lg cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg shadow-xs cursor-pointer"
                  >
                    Save & Open Record
                  </button>
                </div>
              </form>
            )}
          </div>
        ) : (
          <div className="space-y-6">

            <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-4 text-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-teal-700 text-white flex items-center justify-center font-bold text-sm">
                  {activePatient.fullName.charAt(0)}
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-900">{activePatient.fullName}</div>
                  <div className="text-slate-500 text-[11px] flex items-center gap-2">
                    <span>{activePatient.patientNumber}</span>
                    <span aria-hidden="true">·</span>
                    <span>{activePatient.zone}</span>
                    <span aria-hidden="true">·</span>
                    <span>DOB: {activePatient.birthDate}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="font-semibold text-teal-800 bg-white border border-teal-200 px-2.5 py-1 rounded">
                  {activePatient.category === 'maternal' ? 'Maternity' : (activePatient.category === 'senior_maintenance' ? 'Maintenance' : 'Nutrition')}
                </span>
              </div>
            </div>


            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl overflow-x-auto text-xs">
              <button
                onClick={() => setActiveTab('records')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 cursor-pointer ${
                  activeTab === 'records' ? 'bg-white text-slate-900 shadow-sm font-semibold' : 'text-slate-600'
                }`}
              >
                <Activity className="w-4 h-4 text-teal-700" />
                <span>Vitals History ({activePatient.vitalsHistory.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('prescriptions')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 cursor-pointer ${
                  activeTab === 'prescriptions' ? 'bg-white text-slate-900 shadow-sm font-semibold' : 'text-slate-600'
                }`}
              >
                <Pill className="w-4 h-4 text-teal-700" />
                <span>Prescriptions ({activePatient.prescriptions.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('messaging')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 cursor-pointer ${
                  activeTab === 'messaging' ? 'bg-white text-slate-900 shadow-sm font-semibold' : 'text-slate-600'
                }`}
              >
                <MessageSquare className="w-4 h-4 text-teal-700" />
                <span>Staff Messages ({patientMessages.length})</span>
              </button>
            </div>


            {activeTab === 'records' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-900">Recorded Vitals</h4>
                  <button
                    onClick={() => setShowAddVitals(true)}
                    className="px-3 py-1.5 text-xs font-semibold text-teal-800 bg-teal-50 hover:bg-teal-100 rounded-lg flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Record Vitals</span>
                  </button>
                </div>

                {showAddVitals && (
                  <form onSubmit={handleAddVitals} className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-3">
                    <div className="font-bold text-slate-900">Log New Vital Signs</div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div>
                        <label className="block text-slate-600 mb-1">Blood Pressure</label>
                        <input
                          type="text"
                          required
                          value={bp}
                          onChange={(e) => setBp(e.target.value)}
                          placeholder="e.g. 120/80"
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-600 mb-1">Heart Rate (bpm)</label>
                        <input
                          type="number"
                          value={hr}
                          onChange={(e) => setHr(Number(e.target.value))}
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-600 mb-1">Weight (kg)</label>
                        <input
                          type="number"
                          value={wt}
                          onChange={(e) => setWt(Number(e.target.value))}
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-600 mb-1">Height (cm)</label>
                        <input
                          type="number"
                          value={ht}
                          onChange={(e) => setHt(Number(e.target.value))}
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-slate-600 mb-1">Clinical Notes</label>
                      <input
                        type="text"
                        value={vitalsNotes}
                        onChange={(e) => setVitalsNotes(e.target.value)}
                        placeholder="e.g. Regular monthly checkup"
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded"
                      />
                    </div>
                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setShowAddVitals(false)}
                        className="px-3 py-1 text-slate-600 hover:bg-slate-200 rounded"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-1 font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded"
                      >
                        Save Entry
                      </button>
                    </div>
                  </form>
                )}

                {activePatient.vitalsHistory.length > 0 ? (
                  <div className="overflow-x-auto rounded-xl border border-slate-200">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-600 uppercase font-semibold border-b border-slate-200">
                        <tr>
                          <th className="py-2.5 px-4">Date</th>
                          <th className="py-2.5 px-4">Blood Pressure</th>
                          <th className="py-2.5 px-4">Heart Rate</th>
                          <th className="py-2.5 px-4">Weight & Height</th>
                          <th className="py-2.5 px-4">Notes</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {activePatient.vitalsHistory.map((v, i) => (
                          <tr key={i} className="hover:bg-slate-50/50">
                            <td className="py-2.5 px-4 font-semibold text-slate-900">{v.date}</td>
                            <td className="py-2.5 px-4 font-mono font-bold text-teal-800">{v.bloodPressure}</td>
                            <td className="py-2.5 px-4">{v.heartRate} bpm</td>
                            <td className="py-2.5 px-4">{v.weightKg} kg · {v.heightCm} cm</td>
                            <td className="py-2.5 px-4 text-slate-600">{v.notes}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-8 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-slate-200">
                    No vitals recorded yet. Click "Record Vitals" above to log your first check.
                  </div>
                )}
              </div>
            )}


            {activeTab === 'prescriptions' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-900">Maintenance Medications</h4>
                  <button
                    onClick={() => setShowAddRx(true)}
                    className="px-3 py-1.5 text-xs font-semibold text-teal-800 bg-teal-50 hover:bg-teal-100 rounded-lg flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Prescription</span>
                  </button>
                </div>

                {showAddRx && (
                  <form onSubmit={handleAddRx} className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-3">
                    <div className="font-bold text-slate-900">Add Maintenance Medication</div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-slate-600 mb-1">Medication</label>
                        <select
                          value={medName}
                          onChange={(e) => setMedName(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded"
                        >
                          <option value="Amlodipine (High blood)">Amlodipine (High blood)</option>
                          <option value="Losartan (High blood)">Losartan (High blood)</option>
                          <option value="Metformin (Diabetics)">Metformin (Diabetics)</option>
                          <option value="Gliclazide (Diabetics)">Gliclazide (Diabetics)</option>
                          <option value="TB-DOTS Regimen (TB Program)">TB-DOTS Regimen (TB Program)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-slate-600 mb-1">Dosage Form</label>
                        <input
                          type="text"
                          value={medDosage}
                          onChange={(e) => setMedDosage(e.target.value)}
                          placeholder="e.g. 5mg Tablet"
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-600 mb-1">Instructions</label>
                        <input
                          type="text"
                          value={medFreq}
                          onChange={(e) => setMedFreq(e.target.value)}
                          placeholder="e.g. Once daily after meals"
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setShowAddRx(false)}
                        className="px-3 py-1 text-slate-600 hover:bg-slate-200 rounded"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-1 font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded"
                      >
                        Save Medication
                      </button>
                    </div>
                  </form>
                )}

                {activePatient.prescriptions.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {activePatient.prescriptions.map((rx, idx) => (
                      <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-white space-y-2 text-xs">
                        <div className="flex items-start justify-between">
                          <div className="font-bold text-slate-900 text-sm">{rx.medication}</div>
                          <span className="text-[10px] font-semibold text-teal-800 bg-teal-50 px-2 py-0.5 rounded">
                            {rx.status}
                          </span>
                        </div>
                        <div className="text-slate-600">{rx.dosage} · {rx.frequency}</div>
                        <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-100 flex justify-between">
                          <span>Refill: {rx.nextRefillDate}</span>
                          <span>Dr. Tiffany Almuros</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-slate-200">
                    No active prescriptions added. Click "Add Prescription" to add your high blood, diabetes, or TB medications.
                  </div>
                )}
              </div>
            )}


            {activeTab === 'messaging' && (
              <div className="rounded-xl border border-slate-200 bg-white overflow-hidden flex flex-col h-[400px]">
                <div className="p-3 bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-700 flex justify-between items-center">
                  <span>Mr. Flores Health Center Desk (Mon-Fri 7AM-4PM)</span>
                  <span className="text-[10px] text-slate-500">{activePatient.zone}</span>
                </div>

                <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/40 text-xs">
                  {patientMessages.length > 0 ? (
                    patientMessages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${msg.sender === 'patient' ? 'items-end' : 'items-start'}`}
                      >
                        <div className="text-[10px] text-slate-400 mb-0.5 px-1">
                          {msg.senderName} · {msg.timestamp}
                        </div>
                        <div
                          className={`max-w-xs sm:max-w-md rounded-xl px-3 py-2 leading-relaxed ${
                            msg.sender === 'patient'
                              ? 'bg-teal-700 text-white rounded-br-none'
                              : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none'
                          }`}
                        >
                          {msg.text}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                      Send a message to inquire with the clinic desk.
                    </div>
                  )}
                </div>

                <form onSubmit={handleSendMessage} className="p-2.5 bg-white border-t border-slate-200 flex gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Ask a question regarding appointments or meds..."
                    className="flex-1 px-3 py-2 text-xs bg-slate-100 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-700"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-xs font-semibold cursor-pointer"
                  >
                    Send
                  </button>
                </form>
              </div>
            )}

          </div>
        )}

      </div>
    </section>
  );
};
