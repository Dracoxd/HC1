export type Language = 'en' | 'fil';

export type Department =
  | 'doctors'
  | 'nutrition_bns'
  | 'dental'
  | 'radiology_lab'
  | 'nursing_midwifery'
  | 'admin_support';

export interface StaffMember {
  id: string;
  name: string;
  title: string;
  role: string;
  roleFil: string;
  department: Department;
  departmentName: string;
  qualifications: string;
  schedule: string;
  scheduleFil: string;
  location: string;
  isHead?: boolean;
  avatarInitials: string;
}

export interface ServiceDetail {
  id: string;
  title: string;
  titleFil: string;
  shortDesc: string;
  shortDescFil: string;
  fullDesc: string;
  fullDescFil: string;
  category: 'maternity' | 'nutrition' | 'dental' | 'animal_bite' | 'checkup' | 'xray' | 'pharmacy';
  schedule: string;
  scheduleFil: string;
  location: string;
  keyPersonnel: string[];
  requirements: string[];
  requirementsFil: string[];
  image?: string;
  badge?: string;
  badgeFil?: string;
}

export interface MedicationStock {
  id: string;
  name: string;
  dosage: string;
  category: 'hypertension' | 'diabetes' | 'tb';
  categoryLabel: string;
  categoryLabelFil: string;
  purpose: string;
  purposeFil: string;
  stockStatus: 'In Stock' | 'Moderate' | 'Critical';
  availableUnits: number;
  refillSchedule: string;
  refillScheduleFil: string;
  requirements: string;
  requirementsFil: string;
}

export interface ZoneCoverage {
  id: 'san_pedro' | 'magtanggol' | 'tabacalera';
  name: string;
  poblacion: string;
  assignedBNS: string[];
  assignedMidwife: string;
  designatedNurse: string;
  communityOutreachDays: string;
  communityOutreachDaysFil: string;
  activePatients: number;
  coverageRate: string;
}

export interface OutreachProgram {
  id: string;
  title: string;
  titleFil: string;
  description: string;
  descriptionFil: string;
  targetBarangay: string;
  scheduleDate: string;
  timeWindow: string;
  location: string;
  capacity: number;
  slotsRemaining: number;
  eligibility: string;
  eligibilityFil: string;
  category: 'opt' | 'dental' | 'xray_tb' | 'maintenance_refill' | 'maternal' | 'rabies';
}

export interface AppointmentBooking {
  id: string;
  referenceCode: string;
  programId: string;
  programTitle: string;
  patientName: string;
  dateOfBirth: string;
  contactNumber: string;
  email: string;
  zone: string;
  appointmentDate: string;
  timeSlot: string;
  philHealthNumber?: string;
  notes?: string;
  status: 'Confirmed' | 'Pending' | 'Completed' | 'Cancelled' | 'Rejected';
  createdAt: string;
}

export interface NewsUpdate {
  id: string;
  title: string;
  titleFil: string;
  summary: string;
  summaryFil: string;
  content: string;
  contentFil: string;
  date: string;
  category: 'Schedule' | 'Advisory' | 'Campaign' | 'Meds';
  categoryFil: string;
  author: string;
  readTime: string;
}

export interface ClinicPublicSettings {
  clinicHours: string;
  clinicHoursFil: string;
  doctorHours: string;
  doctorHoursFil: string;
  xrayHours: string;
  xrayHoursFil: string;
  dentalHours: string;
  dentalHoursFil: string;
  clinicAddress: string;
  clinicAddressFil: string;
  contactPhone: string;
  contactEmail: string;
  emergencyPhone: string;
  emergencyPhoneFil: string;
  holidayAdvisory: string;
  holidayAdvisoryFil: string;
}

export interface PublicSiteContent {
  services: ServiceDetail[];
  news: NewsUpdate[];
  outreach: OutreachProgram[];
  settings: ClinicPublicSettings;
}

export interface AdminSiteContentItem {
  content_type: 'service' | 'news' | 'outreach';
  content_id: string;
  content_json: string;
  published: number;
  deleted: number;
  updated_at: string;
}

export interface PatientRecord {
  id: string;
  patientNumber: string;
  fullName: string;
  birthDate: string;
  gender: string;
  zone: string;
  contactNumber: string;
  philHealthNo: string;
  category: 'maternal' | 'senior_maintenance' | 'pediatric_opt';
  vitalsHistory: Array<{
    date: string;
    bloodPressure: string;
    heartRate: number;
    weightKg: number;
    heightCm: number;
    bloodSugarFbs?: number;
    notes: string;
    recordedBy: string;
  }>;
  prescriptions: Array<{
    medication: string;
    dosage: string;
    frequency: string;
    prescribedDate: string;
    nextRefillDate: string;
    status: 'Available for Pick-up' | 'Active Regimen' | 'Refill Due';
    prescribedBy: string;
  }>;
  radiologyReports: Array<{
    id: string;
    procedure: string;
    date: string;
    radiologist: string;
    technologist: string;
    findings: string;
    impression: string;
    status: 'Official Report Ready';
  }>;
  nutritionProfile?: {
    ageMonths: number;
    weightKg: number;
    heightCm: number;
    zScoreWeightForAge: string;
    classification: 'Normal' | 'Underweight' | 'Severe Underweight' | 'Obese' | 'Stunted';
    bnsEvaluator: string;
    optRecordedQuarter: string;
    supplementationRecommended: string;
  };
}

export interface ChatMessage {
  id: string;
  sender: 'patient' | 'staff';
  senderName: string;
  senderRole?: string;
  text: string;
  timestamp: string;
  attachment?: string;
}

export interface ContactSubmission {
  id: string;
  ticketId: string;
  name: string;
  phone: string;
  email: string;
  zone: string;
  topic: string;
  message: string;
  submittedAt: string;
  status: 'Received' | 'Under Review';
}
