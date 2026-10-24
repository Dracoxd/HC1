import 'dotenv/config';
import { createClient } from '@libsql/client';
import { randomBytes, randomUUID } from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { applicationDefault, cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

type ApiRequest = IncomingMessage & { body?: unknown; headers: IncomingMessage['headers'] & { authorization?: string } };
type ApiResponse = ServerResponse & {
  status: (code: number) => ApiResponse;
  json: (body: unknown) => void;
};

const zones = new Set(['1. San Pedro', '2. Magtanggol', '3. Tabacalera']);
const services: Record<string, string> = {
  maternity: 'Maternity / pregnant care',
  nutrition: 'Child nutrition (BNS / Operation Timbang)',
  dental: 'Dental clinic',
  animal_bite: 'Animal bite care',
  checkup: 'Doctor consultation',
  xray: 'Pateros X-ray Clinic',
  pharmacy: 'Maintenance medicines / TB program',
};
const preferredTimes = new Set(['morning', 'afternoon', 'no preference']);

let database: ReturnType<typeof createClient> | undefined;

function getDatabase() {
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;
  if (!url || !authToken) return null;
  database ??= createClient({ url, authToken });
  return database;
}

function text(value: unknown, limit: number) {
  return typeof value === 'string' ? value.trim().slice(0, limit) : '';
}

function getFirebaseAdmin() {
  if (getApps().length > 0) return getAuth();
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  const credential = serviceAccountJson
    ? cert(JSON.parse(serviceAccountJson))
    : applicationDefault();
  initializeApp({ credential });
  return getAuth();
}

async function authenticate(request: ApiRequest) {
  const authorization = text(request.headers.authorization, 2000);
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
  if (!token) return null;
  try {
    return await getFirebaseAdmin().verifyIdToken(token);
  } catch (error) {
    console.error('Appointment API Firebase ID token verification failed:', error);
    return null;
  }
}

async function ensureAppointmentTable(db: ReturnType<typeof createClient>) {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS appointment_requests (
      id TEXT PRIMARY KEY,
      owner_uid TEXT,
      reference_code TEXT NOT NULL UNIQUE,
      patient_name TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT,
      zone TEXT NOT NULL,
      service_id TEXT NOT NULL,
      service_name TEXT NOT NULL,
      preferred_date TEXT NOT NULL,
      preferred_time TEXT NOT NULL,
      privacy_consent INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      chat_status TEXT NOT NULL DEFAULT 'closed',
      created_at TEXT NOT NULL
    )
  `);
  const columns = await db.execute('PRAGMA table_info(appointment_requests)');
  const columnNames = new Set(columns.rows.map((column) => String(column.name)));
  if (!columnNames.has('owner_uid')) {
    await db.execute('ALTER TABLE appointment_requests ADD COLUMN owner_uid TEXT');
  }
  if (!columnNames.has('chat_status')) {
    await db.execute("ALTER TABLE appointment_requests ADD COLUMN chat_status TEXT NOT NULL DEFAULT 'closed'");
  }
}

export default async function handler(request: ApiRequest, response: ApiResponse) {
  response.setHeader('Cache-Control', 'no-store');

  if (request.method === 'GET') {
    const token = text(request.headers.authorization, 2000);
    const decoded = token ? await authenticate(request) : null;
    if (token && !decoded) return response.status(401).json({ error: 'Authentication is required.' });
    const db = getDatabase();
    if (!db) return response.status(503).json({ error: 'Schedule data is temporarily unavailable.' });

    try {
      await ensureAppointmentTable(db);
      const result = await db.execute(`
        SELECT preferred_date, preferred_time, COUNT(*) AS booked_count
        FROM appointment_requests
        WHERE status = 'confirmed'
        GROUP BY preferred_date, preferred_time
        ORDER BY preferred_date ASC
      `);
      const slots = result.rows.map((row) => ({
        date: String(row.preferred_date),
        time: String(row.preferred_time),
        bookedCount: Number(row.booked_count),
      }));

      if (decoded) {
        const appointments = await db.execute({
          sql: `SELECT * FROM appointment_requests WHERE owner_uid = ? ORDER BY preferred_date ASC, preferred_time ASC`,
          args: [decoded.uid],
        });
        return response.status(200).json({ slots, appointments: appointments.rows });
      }
      return response.status(200).json({ slots });
    } catch {
      return response.status(500).json({ error: 'Schedule data could not be loaded.' });
    }
  }

  if (request.method !== 'POST') {
    response.setHeader('Allow', 'GET, POST');
    return response.status(405).json({ error: 'Method not allowed.' });
  }

  const authorization = text(request.headers.authorization, 2000);
  if (!authorization.startsWith('Bearer ')) {
    return response.status(401).json({ error: 'Sign in before requesting an appointment.' });
  }
  const decoded = await authenticate(request);
  if (!decoded) {
    return response.status(401).json({ error: 'Your sign-in could not be verified for this Firebase project.' });
  }

  const body = request.body && typeof request.body === 'object'
    ? request.body as Record<string, unknown>
    : {};
  const patientName = text(body.patientName, 120);
  const phone = text(body.phone, 32);
  const email = text(body.email, 254).toLowerCase();
  const zone = text(body.zone, 40);
  const serviceId = text(body.serviceId, 40);
  const preferredDate = text(body.preferredDate, 10);
  const preferredTime = text(body.preferredTime, 30);
  const ownerUid = decoded.uid;

  if (body.action === 'cancel') {
    const referenceCode = text(body.referenceCode, 80);
    if (!referenceCode || !ownerUid) return response.status(400).json({ error: 'Reference code and signed-in user are required.' });
    const db = getDatabase();
    if (!db) return response.status(503).json({ error: 'Appointment requests are temporarily unavailable.' });
    try {
      await db.execute({ sql: "UPDATE appointment_requests SET status = 'cancelled' WHERE reference_code = ? AND owner_uid = ?", args: [referenceCode, ownerUid] });
      return response.status(200).json({ referenceCode, status: 'cancelled' });
    } catch {
      return response.status(500).json({ error: 'Appointment could not be cancelled.' });
    }
  }

  const phoneDigits = phone.replace(/\D/g, '');
  const dateIsValid = /^\d{4}-\d{2}-\d{2}$/.test(preferredDate)
    && !Number.isNaN(Date.parse(`${preferredDate}T00:00:00Z`))
    && new Date(`${preferredDate}T00:00:00Z`).toISOString().slice(0, 10) === preferredDate;
  const today = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Manila',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());

  if (patientName.length < 2) return response.status(400).json({ error: 'Enter a valid full name.' });
  if (phoneDigits.length < 7) return response.status(400).json({ error: 'Enter a contact number with at least 7 digits.' });
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return response.status(400).json({ error: 'Enter a valid email address or leave it blank.' });
  if (!zones.has(zone)) return response.status(400).json({ error: 'Select a valid zone or barangay.' });
  if (!services[serviceId]) return response.status(400).json({ error: 'Select a valid service.' });
  if (!dateIsValid || preferredDate < today) return response.status(400).json({ error: 'Choose a valid appointment date that is today or later.' });
  if (!preferredTimes.has(preferredTime)) return response.status(400).json({ error: 'Select a valid time slot.' });
  if (body.privacyConsent !== true) return response.status(400).json({ error: 'Please agree to the contact and privacy consent.' });

  const db = getDatabase();
  if (!db) return response.status(503).json({ error: 'Appointment requests are temporarily unavailable.' });

  const id = randomUUID();
  const referenceCode = `MFHC-${randomBytes(4).toString('hex').toUpperCase()}`;
  const createdAt = new Date().toISOString();

  try {
    await ensureAppointmentTable(db);
    await db.execute({
      sql: `INSERT INTO appointment_requests (
        id, owner_uid, reference_code, patient_name, phone, email, zone, service_id,
        service_name, preferred_date, preferred_time, privacy_consent, status, chat_status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 'pending', 'closed', ?)`,
      args: [id, ownerUid || null, referenceCode, patientName, phone, email || null, zone, serviceId, services[serviceId], preferredDate, preferredTime, createdAt],
    });
  } catch {
    return response.status(500).json({ error: 'We could not save your request. Please try again.' });
  }

  return response.status(201).json({ referenceCode, status: 'pending', createdAt });
}
