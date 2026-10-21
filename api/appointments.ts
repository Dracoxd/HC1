import 'dotenv/config';
import { createClient } from '@libsql/client';
import { randomBytes, randomUUID } from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';

type ApiRequest = IncomingMessage & { body?: unknown };
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

export default async function handler(request: ApiRequest, response: ApiResponse) {
  response.setHeader('Cache-Control', 'no-store');

  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return response.status(405).json({ error: 'Method not allowed.' });
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
  const phoneDigits = phone.replace(/\D/g, '');
  const dateIsValid = /^\d{4}-\d{2}-\d{2}$/.test(preferredDate)
    && !Number.isNaN(Date.parse(`${preferredDate}T00:00:00Z`))
    && new Date(`${preferredDate}T00:00:00Z`).toISOString().slice(0, 10) === preferredDate;
  const today = new Date().toISOString().slice(0, 10);

  if (
    patientName.length < 2 ||
    phoneDigits.length < 7 ||
    (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) ||
    !zones.has(zone) ||
    !services[serviceId] ||
    !dateIsValid || preferredDate < today ||
    !preferredTimes.has(preferredTime) ||
    body.privacyConsent !== true
  ) {
    return response.status(400).json({ error: 'Check the form fields and consent, then try again.' });
  }

  const db = getDatabase();
  if (!db) return response.status(503).json({ error: 'Appointment requests are temporarily unavailable.' });

  const id = randomUUID();
  const referenceCode = `MFHC-${randomBytes(4).toString('hex').toUpperCase()}`;
  const createdAt = new Date().toISOString();

  try {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS appointment_requests (
        id TEXT PRIMARY KEY,
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
        created_at TEXT NOT NULL
      )
    `);
    await db.execute({
      sql: `INSERT INTO appointment_requests (
        id, reference_code, patient_name, phone, email, zone, service_id,
        service_name, preferred_date, preferred_time, privacy_consent, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 'pending', ?)`,
      args: [id, referenceCode, patientName, phone, email || null, zone, serviceId, services[serviceId], preferredDate, preferredTime, createdAt],
    });
  } catch {
    return response.status(500).json({ error: 'We could not save your request. Please try again.' });
  }

  return response.status(201).json({ referenceCode, status: 'pending', createdAt });
}
