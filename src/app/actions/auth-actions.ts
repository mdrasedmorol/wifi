'use server';

import { cookies } from 'next/headers';
import { createSessionToken, verifySessionToken, SESSION_COOKIE_NAME, SESSION_MAX_AGE } from '@/lib/auth';

export async function loginAction(username: string, password: string) {
  const adminUsername = process.env.ADMIN_USERNAME || 'admin';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

  if (!username || !password) {
    return { success: false, error: 'Please enter both username and password.' };
  }

  if (username !== adminUsername || password !== adminPassword) {
    return { success: false, error: 'Invalid username or password.' };
  }

  // Create signed session token
  const token = createSessionToken(username);

  // Set session cookie
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE,
  });

  return { success: true };
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
  return { success: true };
}

export async function getAuthStatus() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return { authenticated: false, username: null };
  }

  const username = verifySessionToken(token);
  if (!username) {
    return { authenticated: false, username: null };
  }

  return { authenticated: true, username };
}
