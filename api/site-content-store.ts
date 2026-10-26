import { createClient } from '@libsql/client';
import { DEFAULT_CLINIC_PUBLIC_SETTINGS, NEWS_UPDATES, OUTREACH_PROGRAMS, SERVICES_DATA } from '../src/data/healthCenterData.js';
import type {
  ClinicPublicSettings,
  NewsUpdate,
  OutreachProgram,
  PublicSiteContent,
  ServiceDetail,
} from '../src/types';

let database: ReturnType<typeof createClient> | undefined;
let initialized: Promise<void> | null = null;

export function getContentDatabase() {
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;
  if (!url || !authToken) return null;
  database ??= createClient({ url, authToken });
  return database;
}

export async function ensureSiteContent(db: ReturnType<typeof createClient>) {
  initialized ??= (async () => {
    await db.batch([
      `CREATE TABLE IF NOT EXISTS public_site_content (
        content_type TEXT NOT NULL,
        content_id TEXT NOT NULL,
        content_json TEXT NOT NULL,
        published INTEGER NOT NULL DEFAULT 1,
        deleted INTEGER NOT NULL DEFAULT 0,
        updated_at TEXT NOT NULL,
        updated_by TEXT NOT NULL,
        PRIMARY KEY (content_type, content_id)
      )`,
      `CREATE TABLE IF NOT EXISTS clinic_public_settings (
        setting_key TEXT PRIMARY KEY,
        setting_value TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        updated_by TEXT NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS announcement_images (
        image_id TEXT PRIMARY KEY,
        image_data BLOB NOT NULL,
        mime_type TEXT NOT NULL,
        created_at TEXT NOT NULL,
        created_by TEXT NOT NULL
      )`,
    ], 'write');
    const columns = await db.execute('PRAGMA table_info(public_site_content)');
    if (!columns.rows.some((column) => String(column.name) === 'deleted')) {
      await db.execute('ALTER TABLE public_site_content ADD COLUMN deleted INTEGER NOT NULL DEFAULT 0');
    }

    const now = new Date().toISOString();
    const seeds: Array<{ type: 'service' | 'news' | 'outreach'; id: string; value: object }> = [
      ...SERVICES_DATA.map((value) => ({ type: 'service' as const, id: value.id, value })),
      ...NEWS_UPDATES.map((value) => ({ type: 'news' as const, id: value.id, value })),
      ...OUTREACH_PROGRAMS.map((value) => ({ type: 'outreach' as const, id: value.id, value })),
    ];
    await db.batch([
      ...seeds.map(({ type, id, value }) => ({
        sql: `INSERT OR IGNORE INTO public_site_content
              (content_type, content_id, content_json, published, updated_at, updated_by)
              VALUES (?, ?, ?, 1, ?, 'system-seed')`,
        args: [type, id, JSON.stringify(value), now],
      })),
      ...Object.entries(DEFAULT_CLINIC_PUBLIC_SETTINGS).map(([key, value]) => ({
        sql: `INSERT OR IGNORE INTO clinic_public_settings
              (setting_key, setting_value, updated_at, updated_by) VALUES (?, ?, ?, 'system-seed')`,
        args: [key, String(value), now],
      })),
    ], 'write');
  })().catch((error: unknown) => {
    initialized = null;
    throw error;
  });
  await initialized;
}

export async function readSiteContent(db: ReturnType<typeof createClient>, includeDrafts = false) {
  await ensureSiteContent(db);
  const [contentResult, settingsResult] = await Promise.all([
    db.execute({
      sql: `SELECT content_type, content_id, content_json, published, deleted, updated_at
            FROM public_site_content ${includeDrafts ? 'WHERE deleted = 0' : 'WHERE published = 1 AND deleted = 0'}
            ORDER BY content_type, content_id`,
    }),
    db.execute('SELECT setting_key, setting_value FROM clinic_public_settings ORDER BY setting_key'),
  ]);

  const content: PublicSiteContent = {
    services: [],
    news: [],
    outreach: [],
    settings: { ...DEFAULT_CLINIC_PUBLIC_SETTINGS },
  };
  for (const row of contentResult.rows) {
    const value = JSON.parse(String(row.content_json)) as ServiceDetail | NewsUpdate | OutreachProgram;
    if (row.content_type === 'service') content.services.push(value as ServiceDetail);
    else if (row.content_type === 'news') content.news.push(value as NewsUpdate);
    else if (row.content_type === 'outreach') content.outreach.push(value as OutreachProgram);
  }
  for (const row of settingsResult.rows) {
    const key = String(row.setting_key) as keyof ClinicPublicSettings;
    if (key in content.settings) content.settings[key] = String(row.setting_value);
  }
  return { content, items: contentResult.rows.map((row) => ({ ...row })) };
}

export const clinicPublicSettingKeys = Object.keys(DEFAULT_CLINIC_PUBLIC_SETTINGS) as Array<keyof ClinicPublicSettings>;

export function validateSiteContent(
  contentType: unknown,
  contentId: unknown,
  input: unknown,
): (Record<string, unknown> & { id: string }) | null {
  if (contentType !== 'service' && contentType !== 'news' && contentType !== 'outreach') return null;
  if (typeof contentId !== 'string' || !/^[a-zA-Z0-9_-]{1,80}$/.test(contentId)) return null;
  if (!input || typeof input !== 'object' || Array.isArray(input)) return null;
  const value = input as Record<string, unknown>;
  const stringFields: Record<typeof contentType, string[]> = {
    service: ['title', 'titleFil', 'shortDesc', 'shortDescFil', 'fullDesc', 'fullDescFil', 'schedule', 'scheduleFil', 'location', 'badge', 'badgeFil'],
    news: ['title', 'titleFil', 'summary', 'summaryFil', 'content', 'contentFil', 'date', 'category', 'categoryFil', 'author', 'readTime'],
    outreach: ['title', 'titleFil', 'description', 'descriptionFil', 'targetBarangay', 'scheduleDate', 'timeWindow', 'location', 'eligibility', 'eligibilityFil', 'category'],
  };
  const fields = stringFields[contentType];
  for (const field of fields) {
    if (typeof value[field] !== 'string' || value[field].length > 5000) return null;
  }
  if (contentType === 'service') {
    if (!['maternity', 'nutrition', 'dental', 'animal_bite', 'checkup', 'xray', 'pharmacy'].includes(String(value.category))) return null;
    for (const field of ['keyPersonnel', 'requirements', 'requirementsFil']) {
      if (!Array.isArray(value[field]) || value[field].length > 50
        || value[field].some((entry) => typeof entry !== 'string' || entry.length > 300)) return null;
    }
  } else if (contentType === 'news') {
    if (!['Schedule', 'Advisory', 'Campaign', 'Meds'].includes(String(value.category))) return null;
    if (value.imageUrl !== undefined && value.imageUrl !== ''
      && (typeof value.imageUrl !== 'string' || !/^\/api\/content-image\?id=[0-9a-f-]{36}$/i.test(value.imageUrl))) return null;
  } else {
    if (!['opt', 'dental', 'xray_tb', 'maintenance_refill', 'maternal', 'rabies'].includes(String(value.category))
      || !Number.isInteger(value.capacity) || Number(value.capacity) < 0 || Number(value.capacity) > 10000
      || !Number.isInteger(value.slotsRemaining) || Number(value.slotsRemaining) < 0 || Number(value.slotsRemaining) > 10000) return null;
  }
  return { ...value, id: contentId };
}
