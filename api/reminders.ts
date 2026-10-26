import type { IncomingMessage, ServerResponse } from 'node:http';
import { randomUUID } from 'node:crypto';
import { getContentDatabase } from './site-content-store.js';

type ApiRequest = IncomingMessage & { headers: IncomingMessage['headers'] & { authorization?: string } };
type ApiResponse = ServerResponse & {
  status: (code: number) => ApiResponse;
  json: (body: unknown) => void;
};

function manilaDate(date: Date) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Manila',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

export default async function handler(request: ApiRequest, response: ApiResponse) {
  response.setHeader('Cache-Control', 'no-store');
  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET');
    return response.status(405).json({ error: 'Method not allowed.' });
  }
  const secret = process.env.CRON_SECRET;
  if (!secret) return response.status(503).json({ error: 'Scheduled reminders are not configured.' });
  if (request.headers.authorization !== `Bearer ${secret}`) {
    return response.status(401).json({ error: 'Scheduled job authorization failed.' });
  }

  const db = getContentDatabase();
  if (!db) return response.status(503).json({ error: 'Appointment storage is not configured.' });
  try {
    await db.batch([
      `CREATE TABLE IF NOT EXISTS appointment_reminders (
        appointment_id TEXT NOT NULL,
        reminder_type TEXT NOT NULL,
        sent_at TEXT NOT NULL,
        PRIMARY KEY (appointment_id, reminder_type)
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

    const tomorrow = new Date(`${manilaDate(new Date())}T00:00:00.000Z`);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    const appointmentDate = tomorrow.toISOString().slice(0, 10);
    const appointments = await db.execute({
      sql: `SELECT id, service_name, preferred_date, preferred_time
            FROM appointment_requests
            WHERE status = 'confirmed' AND preferred_date = ? AND chat_status != 'deleted'`,
      args: [appointmentDate],
    });
    let remindersSent = 0;
    for (const appointment of appointments.rows) {
      const appointmentId = String(appointment.id);
      const sentAt = new Date().toISOString();
      const claim = await db.execute({
        sql: `INSERT OR IGNORE INTO appointment_reminders (appointment_id, reminder_type, sent_at)
              VALUES (?, 'day_before', ?)`,
        args: [appointmentId, sentAt],
      });
      if (claim.rowsAffected === 0) continue;

      const message = `Reminder: Your appointment for ${String(appointment.service_name)} is tomorrow, ${String(appointment.preferred_date)} (${String(appointment.preferred_time)}). Please arrive on time.\n\nIf you need to cancel, open Messages and choose Cancel appointment. To request a schedule change, reply here so clinic staff can assist you.\n\nPaalala: Bukas ang iyong appointment para sa ${String(appointment.service_name)}, ${String(appointment.preferred_date)} (${String(appointment.preferred_time)}). Mangyaring dumating sa tamang oras. Maaari kang magkansela sa Messages o mag-reply rito upang humiling ng pagbabago sa iskedyul.`;
      await db.execute({
        sql: `INSERT INTO appointment_messages
              (id, appointment_id, sender_uid, sender_role, sender_name, message, created_at)
              VALUES (?, ?, 'clinic-system', 'admin', 'Health Center', ?, ?)`,
        args: [randomUUID(), appointmentId, message, sentAt],
      });
      remindersSent += 1;
    }
    return response.status(200).json({ appointmentDate, remindersSent });
  } catch (error) {
    console.error('Appointment reminders could not be generated:', error);
    return response.status(500).json({ error: 'Appointment reminders could not be generated.' });
  }
}
