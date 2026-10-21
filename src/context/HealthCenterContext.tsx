import React, { createContext, useContext, useState, useEffect } from 'react';
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
  // Patient Portal State (User-managed, zero hardcoded records)
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

  // Appointments start clean with NO hardcoded entries; stored in localStorage
  const [appointments, setAppointments] = useState<AppointmentBooking[]>(() => {
    const saved = localStorage.getItem('mfhc_appointments');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return [];
      }
    }
    return [];
  });

  // Patient Records: Zero hardcoded entries; saved in localStorage as patients register
  const [patientRecords, setPatientRecords] = useState<PatientRecord[]>(() => {
    const saved = localStorage.getItem('mfhc_patient_records');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return [];
      }
    }
    return [];
  });

  const [activePatient, setActivePatientState] = useState<PatientRecord | null>(() => {
    const savedId = localStorage.getItem('mfhc_active_patient_id');
    const savedRecords = localStorage.getItem('mfhc_patient_records');
    if (savedId && savedRecords) {
      try {
        const records: PatientRecord[] = JSON.parse(savedRecords);
        return records.find(r => r.id === savedId) || null;
      } catch {
        return null;
      }
    }
    return null;
  });

  // Chat messages stored per patient in localStorage
  const [chatStore, setChatStore] = useState<Record<string, ChatMessage[]>>(() => {
    const saved = localStorage.getItem('mfhc_chats');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return {};
      }
    }
    return {};
  });

  const [contactSubmissions, setContactSubmissions] = useState<ContactSubmission[]>(() => {
    const saved = localStorage.getItem('mfhc_contacts');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return [];
      }
    }
    return [];
  });

  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [selectedProgramForBooking, setSelectedProgramForBooking] = useState<string | null>(null);
  const [notificationToast, setNotificationToast] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('mfhc_language', language);
  }, [language]);

  useEffect(() => {
    localStorage.setItem('mfhc_appointments', JSON.stringify(appointments));
  }, [appointments]);

  useEffect(() => {
    localStorage.setItem('mfhc_patient_records', JSON.stringify(patientRecords));
  }, [patientRecords]);

  useEffect(() => {
    if (activePatient) {
      localStorage.setItem('mfhc_active_patient_id', activePatient.id);
    } else {
      localStorage.removeItem('mfhc_active_patient_id');
    }
  }, [activePatient]);

  useEffect(() => {
    localStorage.setItem('mfhc_chats', JSON.stringify(chatStore));
  }, [chatStore]);

  useEffect(() => {
    localStorage.setItem('mfhc_contacts', JSON.stringify(contactSubmissions));
  }, [contactSubmissions]);

  // Toast auto dismissal
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

    setAppointments(prev => [newAppointment, ...prev]);
    setNotificationToast(
      language === 'fil' 
        ? `Naitakda ang iskedyul: ${refCode}` 
        : `Appointment confirmed: ${refCode}`
    );
    return newAppointment;
  };

  const cancelAppointment = (id: string) => {
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: 'Cancelled' as const } : a));
    setNotificationToast(language === 'fil' ? 'Kinansela ang iskedyul.' : 'Appointment cancelled.');
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

    setPatientRecords(prev => [newPatient, ...prev]);
    setActivePatientState(newPatient);
    setNotificationToast(
      language === 'fil'
        ? `Narehistro ang pasyente: ${patNo}`
        : `Patient record registered: ${patNo}`
    );
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

    // Real-time reply from health center desk
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

    setContactSubmissions(prev => [newSubmission, ...prev]);
    setNotificationToast(
      language === 'fil'
        ? `Naisumite ang katanungan: ${newSubmission.ticketId}`
        : `Inquiry submitted: ${newSubmission.ticketId}`
    );
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
