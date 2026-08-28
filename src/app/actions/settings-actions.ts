'use server';

import fs from 'fs';
import path from 'path';

export interface SystemSettings {
  panelName: string;
  logoUrl: string;
  supportPhone: string;
  bkashNumber: string;
  nagadNumber: string;
  rocketNumber: string;
  bankAccountDetails: string;
  notes?: string;
}

const DEFAULT_SETTINGS: SystemSettings = {
  panelName: 'NetManager',
  logoUrl: '',
  supportPhone: '+880 1700-000000',
  bkashNumber: '01700-000000',
  nagadNumber: '01700-000000',
  rocketNumber: '01700-000000',
  bankAccountDetails: 'Dutch-Bangla Bank (Acc: 123.456.789)',
  notes: 'Ultra High-Speed Fiber Broadband',
};

const SETTINGS_FILE_PATH = path.join(process.cwd(), 'data', 'system_settings.json');

function ensureDataDirectory() {
  const dir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

export async function getSystemSettings(): Promise<SystemSettings> {
  try {
    ensureDataDirectory();
    if (fs.existsSync(SETTINGS_FILE_PATH)) {
      const content = fs.readFileSync(SETTINGS_FILE_PATH, 'utf-8');
      const parsed = JSON.parse(content);
      return { ...DEFAULT_SETTINGS, ...parsed };
    }
  } catch (err) {
    console.error('Failed to read system settings, using default', err);
  }
  return DEFAULT_SETTINGS;
}

export async function updateSystemSettings(data: Partial<SystemSettings>): Promise<{ success: boolean; settings: SystemSettings }> {
  try {
    ensureDataDirectory();
    const current = await getSystemSettings();
    const updated: SystemSettings = {
      ...current,
      ...data,
    };
    fs.writeFileSync(SETTINGS_FILE_PATH, JSON.stringify(updated, null, 2), 'utf-8');
    return { success: true, settings: updated };
  } catch (err) {
    console.error('Failed to save system settings:', err);
    throw new Error('Failed to save system settings');
  }
}
