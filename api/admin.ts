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
let clinicSettingsReady: Promise<void> | null = null;

function getDatabase() {
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;
  if (!url || !authToken) return null;
  database ??= createClient({ url, authToken });
  return database;
}

async function ensureClinicSettings(db: ReturnType<typeof createClient>) {
  clinicSettingsReady ??= (async () => {
    await db.execute(`CREATE TABLE IF NOT EXISTS clinic_settings (
      setting_key TEXT PRIMARY KEY,
      setting_value TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )`);
    await db.execute({
      sql: `INSERT OR IGNORE INTO clinic_settings (setting_key, setting_value, updated_at)
            VALUES ('clinic_open', '0', ?)`,
      args: [new Date().toISOString()],
    });
  })().catch((error: unknown) => {
    clinicSettingsReady = null;
    throw error;
  });
  await clinicSettingsReady;
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
    `CREATE TABLE IF NOT EXISTS clinic_settings (
      setting_key TEXT PRIMARY KEY,
      setting_value TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS appointment_slot_settings (
      appointment_date TEXT NOT NULL,
      time_slot TEXT NOT NULL,
      capacity INTEGER NOT NULL DEFAULT 0,
      blocked INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL,
      PRIMARY KEY (appointment_date, time_slot)
    )`,
  ], 'write');
  await db.execute({
    sql: `INSERT OR IGNORE INTO clinic_settings (setting_key, setting_value, updated_at)
          VALUES ('clinic_open', '0', ?)`,
    args: [new Date().toISOString()],
  });
  const columns = await db.execute('PRAGMA table_info(appointment_requests)');
  const columnNames = new Set(columns.rows.map((column) => String(column.name)));
  if (!columnNames.has('owner_uid')) {
    await db.execute('ALTER TABLE appointment_requests ADD COLUMN owner_uid TEXT');
  }
  if (!columnNames.has('chat_status')) {
    await db.execute("ALTER TABLE appointment_requests ADD COLUMN chat_status TEXT NOT NULL DEFAULT 'closed'");
  }
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

  if (request.method === 'GET' && new URL(request.url ?? '/', 'http://localhost').searchParams.get('mode') === 'role') {
    return response.status(200).json({ role: isAdmin(decoded) ? 'admin' : 'user' });
  }

  const db = getDatabase();
  if (!db) return response.status(503).json({ error: 'Turso database is not configured.' });

  const mode = new URL(request.url ?? '/', 'http://localhost').searchParams.get('mode');
  if (request.method === 'GET' && mode === 'clinic_status') {
    try {
      await ensureClinicSettings(db);
      const result = await db.execute("SELECT setting_value, updated_at FROM clinic_settings WHERE setting_key = 'clinic_open'");
      const setting = result.rows[0];
      return response.status(200).json({
        clinicOpen: setting?.setting_value === '1',
        updatedAt: setting?.updated_at ?? null,
      });
    } catch {
      return response.status(500).json({ error: 'Clinic status could not be loaded.' });
    }
  }

  await initializeAdminDatabase(db);
  const admin = isAdmin(decoded);

  const body = request.body && typeof request.body === 'object' ? request.body as Record<string, unknown> : {};
  const appointmentId = text(body.appointmentId, 128);
  const referenceCode = text(body.referenceCode, 80);

  if (request.method === 'GET') {
    try {
      if (admin) {
        const appointments = await db.execute(`SELECT * FROM appointment_requests ORDER BY created_at DESC`);
        const messages = await db.execute(`SELECT * FROM appointment_messages ORDER BY created_at ASC`);
        const slotSettings = await db.execute(`SELECT appointment_date, time_slot, capacity, blocked FROM appointment_slot_settings ORDER BY appointment_date ASC, time_slot ASC`);
        return response.status(200).json({
          role: 'admin',
          appointments: appointments.rows.map((row) => ({ ...row })),
          messages: messages.rows.map((row) => ({ ...row })),
          slotSettings: slotSettings.rows.map((row) => ({ ...row })),
        });
      }

      const appointmentResult = appointmentId
        ? await db.execute({ sql: "SELECT * FROM appointment_requests WHERE id = ? AND owner_uid = ? AND chat_status != 'deleted'", args: [appointmentId, decoded.uid] })
        : await db.execute({ sql: "SELECT * FROM appointment_requests WHERE owner_uid = ? AND chat_status != 'deleted' ORDER BY created_at DESC", args: [decoded.uid] });
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
    if (action === 'set_clinic_status') {
      if (!admin) return response.status(403).json({ error: 'Admin permission is required.' });
      if (typeof body.isOpen !== 'boolean') return response.status(400).json({ error: 'A valid clinic status is required.' });
      const updatedAt = new Date().toISOString();
      await db.execute({
        sql: `INSERT INTO clinic_settings (setting_key, setting_value, updated_at)
              VALUES ('clinic_open', ?, ?)
              ON CONFLICT(setting_key) DO UPDATE SET setting_value = excluded.setting_value, updated_at = excluded.updated_at`,
        args: [body.isOpen ? '1' : '0', updatedAt],
      });
      return response.status(200).json({ clinicOpen: body.isOpen, updatedAt });
    }

    if (action === 'save_slot_settings') {
      if (!admin) return response.status(403).json({ error: 'Admin permission is required.' });
      const appointmentDate = text(body.date, 10);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(appointmentDate)
        || Number.isNaN(Date.parse(`${appointmentDate}T00:00:00Z`))
        || new Date(`${appointmentDate}T00:00:00Z`).toISOString().slice(0, 10) !== appointmentDate) {
        return response.status(400).json({ error: 'Choose a valid date.' });
      }
      if (typeof body.dateBlocked !== 'boolean'
        || typeof body.morningBlocked !== 'boolean'
        || typeof body.afternoonBlocked !== 'boolean'
        || typeof body.noPreferenceBlocked !== 'boolean'
        || !Number.isInteger(body.morningCapacity)
        || !Number.isInteger(body.afternoonCapacity)
        || !Number.isInteger(body.noPreferenceCapacity)
        || Number(body.morningCapacity) < 0
        || Number(body.afternoonCapacity) < 0
        || Number(body.noPreferenceCapacity) < 0
        || Number(body.morningCapacity) > 1000
        || Number(body.afternoonCapacity) > 1000
        || Number(body.noPreferenceCapacity) > 1000) {
        return response.status(400).json({ error: 'Enter valid blocking options and capacities from 0 to 1,000.' });
      }
      const updatedAt = new Date().toISOString();
      const settings = [
        { timeSlot: 'all_day', capacity: 0, blocked: body.dateBlocked },
        { timeSlot: 'morning', capacity: Number(body.morningCapacity), blocked: body.morningBlocked },
        { timeSlot: 'afternoon', capacity: Number(body.afternoonCapacity), blocked: body.afternoonBlocked },
        { timeSlot: 'no preference', capacity: Number(body.noPreferenceCapacity), blocked: body.noPreferenceBlocked },
      ];
      await db.batch(settings.map(({ timeSlot, capacity, blocked }) => ({
        sql: `INSERT INTO appointment_slot_settings (appointment_date, time_slot, capacity, blocked, updated_at)
              VALUES (?, ?, ?, ?, ?)
              ON CONFLICT(appointment_date, time_slot) DO UPDATE SET
                capacity = excluded.capacity, blocked = excluded.blocked, updated_at = excluded.updated_at`,
        args: [appointmentDate, timeSlot, capacity, blocked ? 1 : 0, updatedAt],
      })), 'write');
      return response.status(200).json({
        date: appointmentDate,
        slotSettings: settings.map(({ timeSlot, capacity, blocked }) => ({
          appointment_date: appointmentDate,
          time_slot: timeSlot,
          capacity,
          blocked: blocked ? 1 : 0,
        })),
      });
    }

    if (action === 'delete_chat') {
      if (!admin) return response.status(403).json({ error: 'Admin permission is required.' });
      if (!appointmentId) return response.status(400).json({ error: 'Appointment is required.' });
      const appointment = await db.execute({
        sql: 'SELECT id FROM appointment_requests WHERE id = ?',
        args: [appointmentId],
      });
      if (appointment.rows.length === 0) return response.status(404).json({ error: 'Appointment not found.' });
      await db.batch([
        { sql: 'DELETE FROM appointment_messages WHERE appointment_id = ?', args: [appointmentId] },
        { sql: "UPDATE appointment_requests SET chat_status = 'deleted' WHERE id = ?", args: [appointmentId] },
      ], 'write');
      return response.status(200).json({ appointmentId, deleted: true });
    }

    if (action === 'approve' || action === 'reject' || action === 'cancel') {
      if (!admin) return response.status(403).json({ error: 'Admin permission is required.' });
      if (!appointmentId && !referenceCode) return response.status(400).json({ error: 'Appointment is required.' });
      const status = action === 'approve' ? 'confirmed' : action === 'reject' ? 'rejected' : 'cancelled';
      const result = action === 'approve'
        ? await db.execute({
          sql: `UPDATE appointment_requests SET status = 'confirmed'
                WHERE ${appointmentId ? 'id = ?' : 'reference_code = ?'} AND status = 'pending'
                AND NOT EXISTS (
                  SELECT 1 FROM appointment_slot_settings
                  WHERE appointment_date = appointment_requests.preferred_date
                    AND time_slot IN ('all_day', appointment_requests.preferred_time)
                    AND blocked = 1
                )
                AND (
                  COALESCE((
                    SELECT capacity FROM appointment_slot_settings
                    WHERE appointment_date = appointment_requests.preferred_date
                      AND time_slot = appointment_requests.preferred_time
                  ), 0) = 0
                  OR (
                    SELECT COUNT(*) FROM appointment_requests AS accepted
                    WHERE accepted.status = 'confirmed'
                      AND accepted.preferred_date = appointment_requests.preferred_date
                      AND accepted.preferred_time = appointment_requests.preferred_time
                  ) < (
                    SELECT capacity FROM appointment_slot_settings
                    WHERE appointment_date = appointment_requests.preferred_date
                      AND time_slot = appointment_requests.preferred_time
                  )
                )`,
          args: [appointmentId || referenceCode],
        })
        : appointmentId
          ? await db.execute({ sql: 'UPDATE appointment_requests SET status = ? WHERE id = ?', args: [status, appointmentId] })
          : await db.execute({ sql: 'UPDATE appointment_requests SET status = ? WHERE reference_code = ?', args: [status, referenceCode] });
      if (result.rowsAffected === 0 && action === 'approve') {
        const target = appointmentId
          ? await db.execute({ sql: 'SELECT * FROM appointment_requests WHERE id = ?', args: [appointmentId] })
          : await db.execute({ sql: 'SELECT * FROM appointment_requests WHERE reference_code = ?', args: [referenceCode] });
        if (target.rows.length === 0) return response.status(404).json({ error: 'Appointment not found.' });
        const row = target.rows[0];
        const setting = await db.execute({
          sql: `SELECT time_slot, capacity, blocked FROM appointment_slot_settings WHERE appointment_date = ?`,
          args: [String(row.preferred_date)],
        });
        const allSettings = setting.rows;
        const fullDayBlocked = allSettings.some((item) => item.time_slot === 'all_day' && Number(item.blocked) === 1);
        const slotSetting = allSettings.find((item) => item.time_slot === row.preferred_time);
        if (fullDayBlocked || Number(slotSetting?.blocked) === 1) {
          return response.status(409).json({ error: 'This appointment date or time slot is blocked. Unblock it before accepting the request.' });
        }
        if (String(row.status) !== 'pending') return response.status(409).json({ error: 'Only pending appointment requests can be accepted.' });
        if (Number(slotSetting?.capacity) > 0) {
          return response.status(409).json({ error: 'This time slot has reached its appointment limit. Increase the capacity or choose another request.' });
        }
        return response.status(409).json({ error: 'This appointment could not be accepted. Refresh and try again.' });
      }
      if (result.rowsAffected === 0) return response.status(404).json({ error: 'Appointment not found.' });
      return response.status(200).json({ appointmentId, status });
    }

    if (action === 'chat_open' || action === 'chat_close') {
      if (!admin) return response.status(403).json({ error: 'Admin permission is required.' });
      if (!appointmentId) return response.status(400).json({ error: 'Appointment is required.' });
      const existing = await db.execute({ sql: 'SELECT chat_status FROM appointment_requests WHERE id = ?', args: [appointmentId] });
      if (existing.rows.length === 0) return response.status(404).json({ error: 'Appointment not found.' });
      if (String(existing.rows[0].chat_status) === 'deleted') {
        return response.status(409).json({ error: 'This conversation has been deleted.' });
      }
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
      if (String(row.chat_status) === 'deleted') return response.status(410).json({ error: 'This conversation has been deleted.' });
      if (!admin && String(row.owner_uid) !== decoded.uid) return response.status(403).json({ error: 'You cannot access this chat.' });
      if (!admin && String(row.chat_status) === 'closed') return response.status(403).json({ error: 'This chat has been closed by the admin.' });
      const id = randomUUID();
      await db.execute({
        sql: `INSERT INTO appointment_messages (id, appointment_id, sender_uid, sender_role, sender_name, message, created_at)
              VALUES (?, ?, ?, ?, ?, ?, ?)`,
        args: [id, appointmentId, decoded.uid, admin ? 'admin' : 'user', admin ? 'ADMIN' : text(body.senderName, 120) || 'Patient', message, new Date().toISOString()],
      });
      return response.status(201).json({ id, message });
    }

    return response.status(400).json({ error: 'Unknown action.' });
  } catch {
    return response.status(500).json({ error: 'The action could not be completed.' });
  }
}
