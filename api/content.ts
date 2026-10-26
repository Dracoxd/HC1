import type { IncomingMessage, ServerResponse } from 'node:http';
import { getContentDatabase, readSiteContent } from './site-content-store.js';

type ApiRequest = IncomingMessage;
type ApiResponse = ServerResponse & {
  status: (code: number) => ApiResponse;
  json: (body: unknown) => void;
};

export default async function handler(request: ApiRequest, response: ApiResponse) {
  response.setHeader('Cache-Control', 'no-store');
  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET');
    return response.status(405).json({ error: 'Method not allowed.' });
  }
  const db = getContentDatabase();
  if (!db) return response.status(503).json({ error: 'Public clinic information is temporarily unavailable.' });
  try {
    const { content } = await readSiteContent(db);
    return response.status(200).json(content);
  } catch (error) {
    console.error('Public site content could not be loaded:', error);
    return response.status(500).json({ error: 'Public clinic information could not be loaded.' });
  }
}
