import { createHmac } from 'crypto';

export const SESSION_COOKIE_NAME = 'admin-session';
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days in seconds

/**
 * Create a signed session token using HMAC-SHA256.
 * Format: base64(username:timestamp):signature
 */
export function createSessionToken(username: string): string {
  const secret = process.env.ADMIN_SESSION_SECRET || 'netmanager-secret-key-2026';
  const timestamp = Date.now().toString();
  const payload = Buffer.from(`${username}:${timestamp}`).toString('base64');
  const signature = createHmac('sha256', secret).update(payload).digest('hex');
  return `${payload}.${signature}`;
}

/**
 * Verify a session token. Returns the username if valid, null otherwise.
 */
export function verifySessionToken(token: string): string | null {
  try {
    const secret = process.env.ADMIN_SESSION_SECRET || 'netmanager-secret-key-2026';
    const [payload, signature] = token.split('.');
    if (!payload || !signature) return null;

    // Verify signature
    const expectedSignature = createHmac('sha256', secret).update(payload).digest('hex');
    if (signature !== expectedSignature) return null;

    // Decode payload
    const decoded = Buffer.from(payload, 'base64').toString('utf-8');
    const [username, timestampStr] = decoded.split(':');
    if (!username || !timestampStr) return null;

    // Check expiry (7 days)
    const timestamp = parseInt(timestampStr, 10);
    const elapsed = Date.now() - timestamp;
    if (elapsed > SESSION_MAX_AGE * 1000) return null;

    return username;
  } catch {
    return null;
  }
}
