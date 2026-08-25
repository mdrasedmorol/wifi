'use client';

import { useLanguage } from '@/lib/i18n/LanguageContext';
import { Globe, Info } from 'lucide-react';

export default function SettingsPage() {
  const { locale, setLocale, t } = useLanguage();

  return (
    <>
      <div className="page-header">
        <h1>{t('settings')}</h1>
      </div>

      <div className="card" style={{ maxWidth: 600 }}>
        <div className="card-header">
          <h2>
            <Globe size={18} style={{ marginRight: 8, verticalAlign: 'middle' }} />
            {t('language')}
          </h2>
        </div>
        <div className="card-body">
          <div className="form-group">
            <label className="form-label">{t('language')}</label>
            <select
              className="form-select"
              value={locale}
              onChange={(e) => setLocale(e.target.value as 'en' | 'bn')}
              id="language-select"
            >
              <option value="en">{t('english')}</option>
              <option value="bn">{t('bangla')}</option>
            </select>
          </div>
        </div>
      </div>

      <div className="card" style={{ maxWidth: 600, marginTop: 20 }}>
        <div className="card-header">
          <h2>
            <Info size={18} style={{ marginRight: 8, verticalAlign: 'middle' }} />
            About
          </h2>
        </div>
        <div className="card-body">
          <div className="detail-field">
            <div className="detail-field-label">Application</div>
            <div className="detail-field-value">NetManager — WiFi Subscriber Management</div>
          </div>
          <div className="detail-field">
            <div className="detail-field-label">Version</div>
            <div className="detail-field-value">1.0.0</div>
          </div>
          <div className="detail-field">
            <div className="detail-field-label">Stack</div>
            <div className="detail-field-value">Next.js • PostgreSQL • Prisma</div>
          </div>
        </div>
      </div>
    </>
  );
}
