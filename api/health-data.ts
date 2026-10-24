import 'dotenv/config';
import { createClient } from '@libsql/client';
import { randomUUID } from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';

type ApiRequest = IncomingMessage & { body?: unknown };
type ApiResponse = ServerResponse & {
  status: (code: number) => ApiResponse;
  json: (body: unknown) => void;
};

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

async function initializeDatabase(db: ReturnType<typeof createClient>) {
  await db.batch([
    `CREATE TABLE IF NOT EXISTS patient_records (
      id TEXT PRIMARY KEY,
      owner_uid TEXT NOT NULL,
      patient_number TEXT NOT NULL UNIQUE,
      full_name TEXT NOT NULL,
      date_of_birth TEXT NOT NULL,
      gender TEXT NOT NULL,
      zone TEXT NOT NULL,
      phone TEXT NOT NULL,
      philhealth TEXT,
      category TEXT NOT NULL,
      blood_pressure TEXT,
      heart_rate INTEGER,
      weight_kg REAL,
      height_cm REAL,
      created_at TEXT NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS patient_vitals (
      id TEXT PRIMARY KEY,
      patient_id TEXT NOT NULL,
      blood_pressure TEXT NOT NULL,
      heart_rate INTEGER NOT NULL,
      weight_kg REAL NOT NULL,
      height_cm REAL NOT NULL,
      notes TEXT,
      recorded_by TEXT NOT NULL,
      recorded_at TEXT NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS patient_prescriptions (
      id TEXT PRIMARY KEY,
      patient_id TEXT NOT NULL,
      medication TEXT NOT NULL,
      dosage TEXT NOT NULL,
      frequency TEXT NOT NULL,
      prescribed_date TEXT NOT NULL,
      next_refill_date TEXT,
      status TEXT NOT NULL,
      prescribed_by TEXT NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS patient_radiology_reports (
      id TEXT PRIMARY KEY,
      patient_id TEXT NOT NULL,
      report_data TEXT NOT NULL,
      created_at TEXT NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS patient_messages (
      id TEXT PRIMARY KEY,
      patient_id TEXT NOT NULL,
      sender TEXT NOT NULL,
      sender_name TEXT NOT NULL,
      sender_role TEXT,
      message TEXT NOT NULL,
      created_at TEXT NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS contact_submissions (
      id TEXT PRIMARY KEY,
      owner_uid TEXT NOT NULL,
      ticket_id TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT,
      zone TEXT NOT NULL,
      topic TEXT NOT NULL,
      message TEXT NOT NULL,
      status TEXT NOT NULL,
      created_at TEXT NOT NULL
    )`,
  ], 'write');
}

export default async function handler(request: ApiRequest, response: ApiResponse) {
  response.setHeader('Cache-Control', 'no-store');
  const db = getDatabase();
  if (!db) return response.status(503).json({ error: 'Turso database is not configured.' });

  try {
    await initializeDatabase(db);
  } catch {
    return response.status(500).json({ error: 'Database initialization failed.' });
  }

  const ownerUid = text(request.headers['x-user-id'], 128);
  if (!ownerUid) return response.status(401).json({ error: 'Firebase user ID is required.' });

  if (request.method === 'GET') {
    const resource = text(request.headers['x-resource'], 40);
    try {
      if (resource === 'patients') {
        const patientsResult = await db.execute({ sql: 'SELECT * FROM patient_records WHERE owner_uid = ? ORDER BY created_at DESC', args: [ownerUid] });
        const patients = [];
        for (const row of patientsResult.rows) {
          const patientId = String(row.id);
          const [vitalsResult, prescriptionsResult, reportsResult, messagesResult] = await Promise.all([
            db.execute({ sql: 'SELECT * FROM patient_vitals WHERE patient_id = ? ORDER BY recorded_at DESC', args: [patientId] }),
            db.execute({ sql: 'SELECT * FROM patient_prescriptions WHERE patient_id = ? ORDER BY prescribed_date DESC', args: [patientId] }),
            db.execute({ sql: 'SELECT * FROM patient_radiology_reports WHERE patient_id = ? ORDER BY created_at DESC', args: [patientId] }),
            db.execute({ sql: 'SELECT * FROM patient_messages WHERE patient_id = ? ORDER BY created_at ASC', args: [patientId] }),
          ]);
          patients.push({
            id: patientId,
            patientNumber: String(row.patient_number),
            fullName: String(row.full_name),
            birthDate: String(row.date_of_birth),
            gender: String(row.gender),
            zone: String(row.zone),
            contactNumber: String(row.phone),
            philHealthNo: row.philhealth ? String(row.philhealth) : '',
            category: String(row.category),
            vitalsHistory: vitalsResult.rows.map((vital) => ({
              date: String(vital.recorded_at).slice(0, 10),
              bloodPressure: String(vital.blood_pressure),
              heartRate: Number(vital.heart_rate),
              weightKg: Number(vital.weight_kg),
              heightCm: Number(vital.height_cm),
              notes: vital.notes ? String(vital.notes) : '',
              recordedBy: String(vital.recorded_by),
            })),
            prescriptions: prescriptionsResult.rows.map((prescription) => ({
              medication: String(prescription.medication),
              dosage: String(prescription.dosage),
              frequency: String(prescription.frequency),
              prescribedDate: String(prescription.prescribed_date),
              nextRefillDate: String(prescription.next_refill_date ?? ''),
              status: String(prescription.status),
              prescribedBy: String(prescription.prescribed_by),
            })),
            radiologyReports: reportsResult.rows.map((report) => {
              const data = JSON.parse(String(report.report_data));
              return { id: String(report.id), ...data };
            }),
            messages: messagesResult.rows.map((message) => ({
              id: String(message.id),
              sender: String(message.sender),
              senderName: String(message.sender_name),
              senderRole: message.sender_role ? String(message.sender_role) : undefined,
              text: String(message.message),
              timestamp: String(message.created_at),
            })),
          });
        }
        return response.status(200).json({ patients });
      }
      if (resource === 'contacts') {
        const contacts = await db.execute({ sql: 'SELECT * FROM contact_submissions WHERE owner_uid = ? ORDER BY created_at DESC', args: [ownerUid] });
        return response.status(200).json({ submissions: contacts.rows });
      }
      return response.status(400).json({ error: 'Unknown resource.' });
    } catch {
      return response.status(500).json({ error: 'Data could not be loaded.' });
    }
  }

  if (request.method === 'POST') {
    const body = request.body && typeof request.body === 'object' ? request.body as Record<string, unknown> : {};
    const resource = text(body.resource, 40);
    try {
      if (resource === 'patient') {
        const id = randomUUID();
        const patientNumber = text(body.patientNumber, 80);
        await db.execute({
          sql: `INSERT INTO patient_records (id, owner_uid, patient_number, full_name, date_of_birth, gender, zone, phone, philhealth, category, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          args: [id, ownerUid, patientNumber, text(body.fullName, 120), text(body.dateOfBirth, 20), text(body.gender, 40), text(body.zone, 40), text(body.phone, 32), text(body.philHealthNumber, 80), text(body.category, 40), new Date().toISOString()],
        });
        return response.status(201).json({ id, patientNumber });
      }
      if (resource === 'vital') {
        const id = randomUUID();
        await db.execute({
          sql: `INSERT INTO patient_vitals (id, patient_id, blood_pressure, heart_rate, weight_kg, height_cm, notes, recorded_by, recorded_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          args: [id, text(body.patientId, 128), text(body.bloodPressure, 20), Number(body.heartRate), Number(body.weightKg), Number(body.heightCm), text(body.notes, 500), text(body.recordedBy, 80), new Date().toISOString()],
        });
        return response.status(201).json({ id });
      }
      if (resource === 'prescription') {
        const id = randomUUID();
        await db.execute({
          sql: `INSERT INTO patient_prescriptions (id, patient_id, medication, dosage, frequency, prescribed_date, next_refill_date, status, prescribed_by)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          args: [id, text(body.patientId, 128), text(body.medication, 120), text(body.dosage, 80), text(body.frequency, 80), text(body.prescribedDate, 20), text(body.nextRefillDate, 80), text(body.status, 40), text(body.prescribedBy, 80)],
        });
        return response.status(201).json({ id });
      }
      if (resource === 'message') {
        const id = randomUUID();
        await db.execute({
          sql: `INSERT INTO patient_messages (id, patient_id, sender, sender_name, sender_role, message, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)`,
          args: [id, text(body.patientId, 128), text(body.sender, 20), text(body.senderName, 120), text(body.senderRole, 120), text(body.message, 2000), new Date().toISOString()],
        });
        return response.status(201).json({ id });
      }
      if (resource === 'contact') {
        const id = randomUUID();
        const ticketId = text(body.ticketId, 80);
        await db.execute({
          sql: `INSERT INTO contact_submissions (id, owner_uid, ticket_id, name, phone, email, zone, topic, message, status, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          args: [id, ownerUid, ticketId, text(body.name, 120), text(body.phone, 32), text(body.email, 254), text(body.zone, 40), text(body.topic, 80), text(body.message, 2000), 'Received', new Date().toISOString()],
        });
        return response.status(201).json({ id, ticketId });
      }
      return response.status(400).json({ error: 'Unknown resource.' });
    } catch {
      return response.status(500).json({ error: 'Data could not be saved.' });
    }
  }

  response.setHeader('Allow', 'GET, POST');
  return response.status(405).json({ error: 'Method not allowed.' });
}
