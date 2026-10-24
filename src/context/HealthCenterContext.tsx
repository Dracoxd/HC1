import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth } from '../firebase';
import {
  Language,
  AppointmentBooking,
  PatientRecord,
  ChatMessage,
  ContactSubmission
} from '../types';
import { translations } from '../i18n/translations';

interface HealthCenterContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: typeof translations.en;
  activeSection: string;
  setActiveSection: (section: string) => void;
  appointments: AppointmentBooking[];
  bookAppointment: (data: Omit<AppointmentBooking, 'id' | 'referenceCode' | 'status' | 'createdAt'>) => AppointmentBooking;
  cancelAppointment: (id: string) => void;

  patientRecords: PatientRecord[];
  activePatient: PatientRecord | null;
  registerPatientRecord: (data: Omit<PatientRecord, 'id' | 'patientNumber' | 'vitalsHistory' | 'prescriptions' | 'radiologyReports'>) => PatientRecord;
  setActivePatient: (patient: PatientRecord | null) => void;
  addPatientVitals: (patientId: string, vitals: { bloodPressure: string; heartRate: number; weightKg: number; heightCm: number; notes: string }) => void;
  addPatientPrescription: (patientId: string, rx: { medication: string; dosage: string; frequency: string }) => void;
  patientMessages: ChatMessage[];
  sendPatientMessage: (text: string) => void;
  contactSubmissions: ContactSubmission[];
  submitContact: (data: { name: string; phone: string; email: string; zone: string; topic: string; message: string }) => ContactSubmission;
  bookingModalOpen: boolean;
  setBookingModalOpen: (open: boolean) => void;
  messagesOpen: boolean;
  setMessagesOpen: (open: boolean) => void;
  selectedProgramForBooking: string | null;
  openBookingForProgram: (programId: string) => void;
  notificationToast: string | null;
  setNotificationToast: (msg: string | null) => void;
}

const HealthCenterContext = createContext<HealthCenterContextType | undefined>(undefined);

export const HealthCenterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('mfhc_language');
    return (saved === 'fil' || saved === 'en') ? saved : 'en';
  });

  const [activeSection, setActiveSection] = useState<string>('overview');


  const [appointments, setAppointments] = useState<AppointmentBooking[]>([]);


  const [patientRecords, setPatientRecords] = useState<PatientRecord[]>([]);

  const [activePatient, setActivePatientState] = useState<PatientRecord | null>(null);


  const [chatStore, setChatStore] = useState<Record<string, ChatMessage[]>>({});

  const [contactSubmissions, setContactSubmissions] = useState<ContactSubmission[]>([]);

  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [messagesOpen, setMessagesOpen] = useState(false);
  const [selectedProgramForBooking, setSelectedProgramForBooking] = useState<string | null>(null);
  const [notificationToast, setNotificationToast] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('mfhc_language', language);
  }, [language]);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const loadData = async () => {
      try {
        const token = await user.getIdToken();
        const [patientsResponse, contactsResponse, appointmentsResponse] = await Promise.all([
          fetch('/api/health-data', { headers: { 'x-user-id': user.uid, 'x-resource': 'patients' } }),
          fetch('/api/health-data', { headers: { 'x-user-id': user.uid, 'x-resource': 'contacts' } }),
          fetch('/api/appointments', { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        if (appointmentsResponse.ok) {
          const result = await appointmentsResponse.json() as { appointments?: Array<{ id: string; reference_code: string; service_name: string; patient_name: string; zone: string; preferred_date: string; preferred_time: string; status: string; created_at: string }> };
          setAppointments((result.appointments ?? []).map((item) => ({
            id: item.id,
            referenceCode: item.reference_code,
            programId: item.service_name,
            programTitle: item.service_name,
            patientName: item.patient_name,
            dateOfBirth: '',
            contactNumber: '',
            email: '',
            zone: item.zone,
            appointmentDate: item.preferred_date,
            timeSlot: item.preferred_time,
            status: item.status.toLowerCase() === 'cancelled'
              ? 'Cancelled'
              : item.status.toLowerCase() === 'rejected'
                ? 'Rejected'
                : item.status.toLowerCase() === 'confirmed'
                  ? 'Confirmed'
                  : 'Pending',
            createdAt: item.created_at,
          })));
        }
        if (patientsResponse.ok) {
          const result = await patientsResponse.json() as { patients: PatientRecord[] };
          setPatientRecords(result.patients);
          const chatMap: Record<string, ChatMessage[]> = {};
          result.patients.forEach((patient) => {
            const record = patient as PatientRecord & { messages?: ChatMessage[] };
            chatMap[patient.id] = record.messages ?? [];
          });
          setChatStore(chatMap);
        }
        if (contactsResponse.ok) {
          const result = await contactsResponse.json() as { submissions: Array<{ id: string; ticket_id: string; name: string; phone: string; email: string; zone: string; topic: string; message: string; status: 'Received' | 'Under Review'; created_at: string }> };
          setContactSubmissions(result.submissions.map((item) => ({
            id: item.id,
            ticketId: item.ticket_id,
            name: item.name,
            phone: item.phone,
            email: item.email ?? '',
            zone: item.zone,
            topic: item.topic,
            message: item.message,
            submittedAt: item.created_at,
            status: item.status,
          })));
        }
      } catch {
        setNotificationToast('Could not load saved health records from the database.');
      }
    };
    void loadData();
  }, []);


  useEffect(() => {
    if (notificationToast) {
      const timer = setTimeout(() => setNotificationToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [notificationToast]);

  const toggleLanguage = () => {
    setLanguageState(prev => prev === 'en' ? 'fil' : 'en');
  };

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const t = translations[language];

  const bookAppointment = (data: Omit<AppointmentBooking, 'id' | 'referenceCode' | 'status' | 'createdAt'>): AppointmentBooking => {
    const refCode = `MFHC-${Math.floor(1000 + Math.random() * 9000)}`;
    const newAppointment: AppointmentBooking = {
      ...data,
      id: `apt-${Date.now()}`,
      referenceCode: refCode,
      status: 'Confirmed',
      createdAt: new Date().toISOString()
    };

    void fetch('/api/appointments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': auth.currentUser?.uid ?? '' },
      body: JSON.stringify({
        patientName: newAppointment.patientName,
        phone: newAppointment.contactNumber,
        email: newAppointment.email,
        zone: newAppointment.zone,
        serviceId: newAppointment.programId,
        preferredDate: newAppointment.appointmentDate,
        preferredTime: newAppointment.timeSlot,
        privacyConsent: true,
      }),
    }).catch(() => setNotificationToast('Appointment could not be saved to the database.'));

    setAppointments(prev => [newAppointment, ...prev]);
    setNotificationToast(
      language === 'fil'
        ? `Naitakda ang iskedyul: ${refCode}`
        : `Appointment confirmed: ${refCode}`
    );
    return newAppointment;
  };

  const cancelAppointment = (id: string) => {
    const appointment = appointments.find((item) => item.id === id);
    if (!appointment) return;
    void fetch('/api/appointments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': auth.currentUser?.uid ?? '' },
      body: JSON.stringify({ action: 'cancel', referenceCode: appointment.referenceCode }),
    }).then((response) => {
      if (!response.ok) throw new Error('Appointment could not be cancelled.');
      setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: 'Cancelled' as const } : a));
      setNotificationToast(language === 'fil' ? 'Kinansela ang iskedyul.' : 'Appointment cancelled.');
    }).catch((error) => setNotificationToast(error instanceof Error ? error.message : 'Appointment could not be cancelled.'));
  };

  const registerPatientRecord = (data: Omit<PatientRecord, 'id' | 'patientNumber' | 'vitalsHistory' | 'prescriptions' | 'radiologyReports'>): PatientRecord => {
    const patNo = `MFHC-PAT-${Math.floor(1000 + Math.random() * 9000)}`;
    const newPatient: PatientRecord = {
      ...data,
      id: `pat-${Date.now()}`,
      patientNumber: patNo,
      vitalsHistory: [],
      prescriptions: [],
      radiologyReports: []
    };

    void fetch('/api/health-data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': auth.currentUser?.uid ?? 'anonymous' },
      body: JSON.stringify({ resource: 'patient', ...newPatient, patientNumber: patNo }),
    }).then((response) => {
      if (!response.ok) throw new Error('Patient record could not be saved.');
      setPatientRecords(prev => [newPatient, ...prev]);
      setActivePatientState(newPatient);
      setNotificationToast(
        language === 'fil'
          ? `Narehistro ang pasyente: ${patNo}`
          : `Patient record registered: ${patNo}`
      );
    }).catch((error) => setNotificationToast(error instanceof Error ? error.message : 'Patient record could not be saved.'));

    return newPatient;
  };

  const setActivePatient = (patient: PatientRecord | null) => {
    setActivePatientState(patient);
  };

  const addPatientVitals = (patientId: string, vitals: { bloodPressure: string; heartRate: number; weightKg: number; heightCm: number; notes: string }) => {
    const entry = {
      ...vitals,
      date: new Date().toISOString().split('T')[0],
      recordedBy: 'Nurse / Triage Desk'
    };

    void fetch('/api/health-data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': auth.currentUser?.uid ?? 'anonymous' },
      body: JSON.stringify({ resource: 'vital', patientId, ...entry }),
    }).catch(() => setNotificationToast('Vitals could not be saved to the database.'));

    setPatientRecords(prev => prev.map(p => {
      if (p.id === patientId) {
        return {
          ...p,
          vitalsHistory: [entry, ...p.vitalsHistory]
        };
      }
      return p;
    }));

    if (activePatient && activePatient.id === patientId) {
      setActivePatientState(prev => prev ? {
        ...prev,
        vitalsHistory: [entry, ...prev.vitalsHistory]
      } : null);
    }

    setNotificationToast(language === 'fil' ? 'Nai-record ang vitals.' : 'Vitals recorded.');
  };

  const addPatientPrescription = (patientId: string, rx: { medication: string; dosage: string; frequency: string }) => {
    const entry = {
      ...rx,
      prescribedDate: new Date().toISOString().split('T')[0],
      nextRefillDate: 'Next Month (30-day supply)',
      status: 'Available for Pick-up' as const,
      prescribedBy: 'Tiffany Almuros (Head of Doctors)'
    };

    void fetch('/api/health-data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': auth.currentUser?.uid ?? 'anonymous' },
      body: JSON.stringify({ resource: 'prescription', patientId, ...entry }),
    }).catch(() => setNotificationToast('Prescription could not be saved to the database.'));

    setPatientRecords(prev => prev.map(p => {
      if (p.id === patientId) {
        return {
          ...p,
          prescriptions: [entry, ...p.prescriptions]
        };
      }
      return p;
    }));

    if (activePatient && activePatient.id === patientId) {
      setActivePatientState(prev => prev ? {
        ...prev,
        prescriptions: [entry, ...prev.prescriptions]
      } : null);
    }

    setNotificationToast(language === 'fil' ? 'Nai-save ang reseta.' : 'Prescription saved.');
  };

  const patientMessages = activePatient ? (chatStore[activePatient.id] || []) : [];

  const sendPatientMessage = (text: string) => {
    if (!text.trim() || !activePatient) return;

    const patientId = activePatient.id;
    const newMsg: ChatMessage = {
      id: `m-${Date.now()}`,
      sender: 'patient',
      senderName: activePatient.fullName,
      text: text.trim(),
      timestamp: 'Just now'
    };

    const updated = [...(chatStore[patientId] || []), newMsg];
    setChatStore(prev => ({ ...prev, [patientId]: updated }));
    void fetch('/api/health-data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': auth.currentUser?.uid ?? 'anonymous' },
      body: JSON.stringify({ resource: 'message', patientId, sender: newMsg.sender, senderName: newMsg.senderName, senderRole: '', message: newMsg.text }),
    }).catch(() => setNotificationToast('Message could not be saved to the database.'));

    setTimeout(() => {
      const botReply: ChatMessage = {
        id: `m-${Date.now() + 1}`,
        sender: 'staff',
        senderName: 'Ms. Sery Ann G. Ulanday, RN / Clinic Desk',
        senderRole: 'Mr. Flores Health Center',
        text: language === 'fil'
          ? `Natanggap po namin ang mensahe para sa ${activePatient.fullName} (${activePatient.zone}). Bukas ang center Lunes hanggang Biyernes 7AM-4PM.`
          : `We received your inquiry for ${activePatient.fullName} (${activePatient.zone}). The center is open Monday to Friday, 7:00 AM - 4:00 PM.`,
        timestamp: 'Just now'
      };

      setChatStore(current => ({
        ...current,
        [patientId]: [...(current[patientId] || []), botReply]
      }));
    }, 1000);
  };

  const submitContact = (data: { name: string; phone: string; email: string; zone: string; topic: string; message: string }): ContactSubmission => {
    const newSubmission: ContactSubmission = {
      ...data,
      id: `cnt-${Date.now()}`,
      ticketId: `TKT-${Math.floor(10000 + Math.random() * 90000)}`,
      submittedAt: new Date().toISOString(),
      status: 'Received'
    };

    void fetch('/api/health-data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': auth.currentUser?.uid ?? 'anonymous' },
      body: JSON.stringify({ resource: 'contact', ...newSubmission, ticketId: newSubmission.ticketId }),
    }).then((response) => {
      if (!response.ok) throw new Error('Inquiry could not be saved.');
      setContactSubmissions(prev => [newSubmission, ...prev]);
      setNotificationToast(
        language === 'fil'
          ? `Naisumite ang katanungan: ${newSubmission.ticketId}`
          : `Inquiry submitted: ${newSubmission.ticketId}`
      );
    }).catch((error) => setNotificationToast(error instanceof Error ? error.message : 'Inquiry could not be saved.'));

    return newSubmission;
  };

  const openBookingForProgram = (programId: string) => {
    setSelectedProgramForBooking(programId);
    setBookingModalOpen(true);
  };

  return (
    <HealthCenterContext.Provider
      value={{
        language,
        setLanguage,
        toggleLanguage,
        t,
        activeSection,
        setActiveSection,
        appointments,
        bookAppointment,
        cancelAppointment,
        patientRecords,
        activePatient,
        registerPatientRecord,
        setActivePatient,
        addPatientVitals,
        addPatientPrescription,
        patientMessages,
        sendPatientMessage,
        contactSubmissions,
        submitContact,
        bookingModalOpen,
        setBookingModalOpen,
        messagesOpen,
        setMessagesOpen,
        selectedProgramForBooking,
        openBookingForProgram,
        notificationToast,
        setNotificationToast
      }}
    >
      {children}
    </HealthCenterContext.Provider>
  );
};

export const useHealthCenter = () => {
  const context = useContext(HealthCenterContext);
  if (!context) {
    throw new Error('useHealthCenter must be used within a HealthCenterProvider');
  }
  return context;
};
