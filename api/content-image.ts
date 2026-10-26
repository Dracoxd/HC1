import type { IncomingMessage, ServerResponse } from 'node:http';
import { getContentDatabase, ensureSiteContent } from './site-content-store.js';

type ApiRequest = IncomingMessage;
type ApiResponse = ServerResponse & {
  status: (code: number) => ApiResponse;
  json: (body: unknown) => void;
};

export default async function handler(request: ApiRequest, response: ApiResponse) {
  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET');
    return response.status(405).json({ error: 'Method not allowed.' });
  }

  const imageId = new URL(request.url ?? '/', 'http://localhost').searchParams.get('id') ?? '';
  if (!/^[0-9a-f-]{36}$/i.test(imageId)) {
    return response.status(400).json({ error: 'A valid announcement image is required.' });
  }

  const db = getContentDatabase();
  if (!db) return response.status(503).json({ error: 'Announcement image storage is unavailable.' });

  try {
    await ensureSiteContent(db);
    const result = await db.execute({
      sql: 'SELECT image_data, mime_type FROM announcement_images WHERE image_id = ?',
      args: [imageId],
    });
    const image = result.rows[0];
    if (!image || !(image.image_data instanceof Uint8Array)
      || !['image/webp', 'image/jpeg', 'image/png'].includes(String(image.mime_type))) {
      return response.status(404).json({ error: 'Announcement image was not found.' });
    }

    response.statusCode = 200;
    response.setHeader('Content-Type', String(image.mime_type));
    response.setHeader('Content-Length', image.image_data.byteLength);
    response.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.end(Buffer.from(image.image_data));
  } catch (error) {
    console.error('Announcement image could not be loaded:', error);
    return response.status(500).json({ error: 'Announcement image could not be loaded.' });
  }
}
