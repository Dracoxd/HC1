import 'dotenv/config';
import { createClient } from '@libsql/client';
import { randomUUID } from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { applicationDefault, cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

type ApiRequest = IncomingMessage & { body?: unknown; headers: IncomingMessage['headers'] & { authorization?: string } };
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

function getFirebaseAdmin() {
  if (getApps().length > 0) return getAuth();
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  const credential = serviceAccountJson
    ? cert(JSON.parse(serviceAccountJson))
    : applicationDefault();
  initializeApp({ credential });
  return getAuth();
}

async function initializeAdminDatabase(db: ReturnType<typeof createClient>) {
  await db.batch([
    `ALTER TABLE appointment_requests ADD COLUMN owner_uid TEXT`,
    `ALTER TABLE appointment_requests ADD COLUMN chat_status TEXT NOT NULL DEFAULT 'open'`,
  ], 'write').catch(() => undefined);
  await db.batch([
    `CREATE TABLE IF NOT EXISTS appointment_requests (
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
    )`,
    `CREATE TABLE IF NOT EXISTS appointment_messages (
      id TEXT PRIMARY KEY,
      appointment_id TEXT NOT NULL,
      sender_uid TEXT NOT NULL,
      sender_role TEXT NOT NULL,
      sender_name TEXT NOT NULL,
      message TEXT NOT NULL,
      created_at TEXT NOT NULL
    )`,
  ], 'write');
}

async function authenticate(request: ApiRequest) {
  const authorization = text(request.headers.authorization, 2000);
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
  if (!token) return null;
  try {
    return await getFirebaseAdmin().verifyIdToken(token);
  } catch {
    return null;
  }
}

function isAdmin(decoded: Awaited<ReturnType<ReturnType<typeof getFirebaseAdmin>['verifyIdToken']>>) {
  if (decoded.admin === true) return true;
  const allowedUid = process.env.ADMIN_UIDS?.split(',').map((uid) => uid.trim()).filter(Boolean) ?? [];
  if (allowedUid.includes(decoded.uid)) return true;
  const allowedEmails = process.env.ADMIN_EMAILS?.split(',').map((email) => email.trim().toLowerCase()).filter(Boolean) ?? [];
  return decoded.email_verified === true
    && typeof decoded.email === 'string'
    && allowedEmails.includes(decoded.email.toLowerCase());
}

export default async function handler(request: ApiRequest, response: ApiResponse) {
  response.setHeader('Cache-Control', 'no-store');
  const decoded = await authenticate(request);
  if (!decoded) return response.status(401).json({ error: 'Authentication is required.' });

  const db = getDatabase();
  if (!db) return response.status(503).json({ error: 'Turso database is not configured.' });
  await initializeAdminDatabase(db);

  const admin = isAdmin(decoded);
  const body = request.body && typeof request.body === 'object' ? request.body as Record<string, unknown> : {};
  const appointmentId = text(body.appointmentId, 128);
  const referenceCode = text(body.referenceCode, 80);
  const ownerUid = text(body.ownerUid, 128);

  if (request.method === 'GET') {
    try {
      if (admin) {
        const appointments = await db.execute(`SELECT * FROM appointment_requests ORDER BY created_at DESC`);
        const messages = await db.execute(`SELECT * FROM appointment_messages ORDER BY created_at ASC`);
        return response.status(200).json({
          role: 'admin',
          appointments: appointments.rows.map((row) => ({ ...row })),
          messages: messages.rows.map((row) => ({ ...row })),
        });
      }

      const appointmentResult = appointmentId
        ? await db.execute({ sql: 'SELECT * FROM appointment_requests WHERE id = ? AND owner_uid = ?', args: [appointmentId, decoded.uid] })
        : await db.execute({ sql: 'SELECT * FROM appointment_requests WHERE owner_uid = ? ORDER BY created_at DESC', args: [decoded.uid] });
      const ids = appointmentResult.rows.map((row) => String(row.id));
      const chatResult = ids.length > 0
        ? await db.execute({ sql: `SELECT * FROM appointment_messages WHERE appointment_id IN (${ids.map(() => '?').join(',')}) ORDER BY created_at ASC`, args: ids })
        : { rows: [] };
      return response.status(200).json({ role: 'user', appointments: appointmentResult.rows, messages: chatResult.rows });
    } catch {
      return response.status(500).json({ error: 'Admin workspace data could not be loaded.' });
    }
  }

  if (request.method !== 'POST') {
    response.setHeader('Allow', 'GET, POST');
    return response.status(405).json({ error: 'Method not allowed.' });
  }

  const action = text(body.action, 30);
  try {
    if (action === 'approve' || action === 'cancel') {
      if (!admin) return response.status(403).json({ error: 'Admin permission is required.' });
      if (!appointmentId && !referenceCode) return response.status(400).json({ error: 'Appointment is required.' });
      const status = action === 'approve' ? 'confirmed' : 'cancelled';
      const result = appointmentId
        ? await db.execute({ sql: 'UPDATE appointment_requests SET status = ? WHERE id = ?', args: [status, appointmentId] })
        : await db.execute({ sql: 'UPDATE appointment_requests SET status = ? WHERE reference_code = ?', args: [status, referenceCode] });
      if (result.rowsAffected === 0) return response.status(404).json({ error: 'Appointment not found.' });
      return response.status(200).json({ appointmentId, status });
    }

    if (action === 'chat_open' || action === 'chat_close') {
      if (!admin) return response.status(403).json({ error: 'Admin permission is required.' });
      if (!appointmentId) return response.status(400).json({ error: 'Appointment is required.' });
      const chatStatus = action === 'chat_open' ? 'open' : 'closed';
      await db.execute({ sql: 'UPDATE appointment_requests SET chat_status = ? WHERE id = ?', args: [chatStatus, appointmentId] });
      return response.status(200).json({ appointmentId, chatStatus });
    }

    if (action === 'message') {
      const message = text(body.message, 2000);
      if (!appointmentId || !message) return response.status(400).json({ error: 'Appointment and message are required.' });
      const appointment = await db.execute({ sql: 'SELECT * FROM appointment_requests WHERE id = ?', args: [appointmentId] });
      if (appointment.rows.length === 0) return response.status(404).json({ error: 'Appointment not found.' });
      const row = appointment.rows[0];
      if (!admin && String(row.owner_uid) !== decoded.uid) return response.status(403).json({ error: 'You cannot access this chat.' });
      if (!admin && String(row.chat_status) === 'closed') return response.status(403).json({ error: 'This chat has been closed by the admin.' });
      const id = randomUUID();
      await db.execute({
        sql: `INSERT INTO appointment_messages (id, appointment_id, sender_uid, sender_role, sender_name, message, created_at)
              VALUES (?, ?, ?, ?, ?, ?, ?)`,
        args: [id, appointmentId, decoded.uid, admin ? 'admin' : 'user', admin ? 'Clinic Staff' : text(body.senderName, 120) || 'Patient', message, new Date().toISOString()],
      });
      return response.status(201).json({ id, message });
    }

    return response.status(400).json({ error: 'Unknown action.' });
  } catch {
    return response.status(500).json({ error: 'The action could not be completed.' });
  }
}
