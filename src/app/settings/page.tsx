'use client';

import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { useToast } from '@/components/ToastProvider';
import { getSystemSettings, updateSystemSettings, SystemSettings } from '@/app/actions/settings-actions';
import {
  Settings,
  Globe,
  Info,
  Building,
  PhoneCall,
  CreditCard,
  Save,
  RefreshCw,
  Image as ImageIcon,
  ShieldCheck,
} from 'lucide-react';

export default function SettingsPage() {
  const { locale, setLocale, t } = useLanguage();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<SystemSettings>({
    panelName: 'NetManager',
    logoUrl: '',
    supportPhone: '+880 1700-000000',
    bkashNumber: '01700-000000',
    nagadNumber: '01700-000000',
    rocketNumber: '01700-000000',
    bankAccountDetails: 'Dutch-Bangla Bank (Acc: 123.456.789)',
    notes: 'Ultra High-Speed Fiber Broadband',
  });

  useEffect(() => {
    async function load() {
      try {
        const data = await getSystemSettings();
        setSettings(data);
      } catch {
        showToast('Failed to load settings', 'error');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [showToast]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await updateSystemSettings(settings);
      if (res.success) {
        showToast('Super Admin System Settings updated successfully!', 'success');
      }
    } catch {
      showToast('Failed to save settings. Please try again.', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="page-loading" style={{ minHeight: 300 }}>
        <div className="loading-spinner" />
      </div>
    );
  }

  return (
    <div className="settings-container">
      <div className="page-header">
        <div>
          <h1>Super Admin Control & Settings</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>
            Customize your panel name, app logo, 24/7 support hotline, and payment gateway numbers.
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="settings-grid-layout">
        {/* 1. Panel & Branding Settings Card */}
        <div className="card">
          <div className="card-header">
            <h2>
              <Building size={18} className="text-cyan-400" style={{ marginRight: 8, verticalAlign: 'middle' }} />
              Panel Branding & Identity
            </h2>
          </div>
          <div className="card-body">
            <div className="form-group">
              <label className="form-label">Panel / Company Name *</label>
              <input
                type="text"
                className="form-input"
                value={settings.panelName}
                onChange={(e) => setSettings({ ...settings, panelName: e.target.value })}
                placeholder="e.g. NetManager Broadband"
                required
              />
              <span className="form-hint">This name will be displayed on headers, navbars, and customer invoices.</span>
            </div>

            <div className="form-group">
              <label className="form-label">Logo Image URL</label>
              <div style={{ display: 'flex', gap: 10 }}>
                <input
                  type="url"
                  className="form-input"
                  value={settings.logoUrl || ''}
                  onChange={(e) => setSettings({ ...settings, logoUrl: e.target.value })}
                  placeholder="https://example.com/logo.png"
                />
                {settings.logoUrl && (
                  <div style={{
                    width: 42,
                    height: 42,
                    borderRadius: 8,
                    overflow: 'hidden',
                    border: '1px solid var(--border-color)',
                    background: '#000',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <img src={settings.logoUrl} alt="Logo Preview" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  </div>
                )}
              </div>
              <span className="form-hint">Leave blank to use default modern vector logo.</span>
            </div>

            <div className="form-group">
              <label className="form-label">Tagline / Subtitle</label>
              <input
                type="text"
                className="form-input"
                value={settings.notes || ''}
                onChange={(e) => setSettings({ ...settings, notes: e.target.value })}
                placeholder="e.g. Ultra High-Speed Fiber Internet"
              />
            </div>
          </div>
        </div>

        {/* 2. Customer Support Helpline Settings Card */}
        <div className="card">
          <div className="card-header">
            <h2>
              <PhoneCall size={18} className="text-emerald-400" style={{ marginRight: 8, verticalAlign: 'middle' }} />
              24/7 Support Hotline Numbers
            </h2>
          </div>
          <div className="card-body">
            <div className="form-group">
              <label className="form-label">Primary NOC Support Phone Number *</label>
              <input
                type="text"
                className="form-input"
                value={settings.supportPhone}
                onChange={(e) => setSettings({ ...settings, supportPhone: e.target.value })}
                placeholder="+880 1700-000000"
                required
              />
              <span className="form-hint">Displayed on customer self-service portal, footers, and direct call buttons.</span>
            </div>
          </div>
        </div>

        {/* 3. Mobile Banking & Payment Gateway Numbers Card */}
        <div className="card">
          <div className="card-header">
            <h2>
              <CreditCard size={18} className="text-amber-400" style={{ marginRight: 8, verticalAlign: 'middle' }} />
              Payment Numbers & Gateways
            </h2>
          </div>
          <div className="card-body">
            <div className="form-group">
              <label className="form-label">bKash Personal / Merchant Number</label>
              <input
                type="text"
                className="form-input"
                value={settings.bkashNumber}
                onChange={(e) => setSettings({ ...settings, bkashNumber: e.target.value })}
                placeholder="e.g. 01700000000"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Nagad Personal / Merchant Number</label>
              <input
                type="text"
                className="form-input"
                value={settings.nagadNumber}
                onChange={(e) => setSettings({ ...settings, nagadNumber: e.target.value })}
                placeholder="e.g. 01700000000"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Rocket Number</label>
              <input
                type="text"
                className="form-input"
                value={settings.rocketNumber}
                onChange={(e) => setSettings({ ...settings, rocketNumber: e.target.value })}
                placeholder="e.g. 01700000000"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Bank Account Details</label>
              <textarea
                className="form-input"
                rows={2}
                value={settings.bankAccountDetails}
                onChange={(e) => setSettings({ ...settings, bankAccountDetails: e.target.value })}
                placeholder="Bank Name, Account Name, Account Number, Branch"
              />
            </div>
          </div>
        </div>

        {/* 4. Language & System Info Card */}
        <div className="card">
          <div className="card-header">
            <h2>
              <Globe size={18} className="text-blue-400" style={{ marginRight: 8, verticalAlign: 'middle' }} />
              Language & Regional
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

        {/* Save Bar */}
        <div className="settings-actions-footer">
          <button type="submit" className="btn btn-primary btn-lg" disabled={saving}>
            {saving ? (
              <>
                <RefreshCw size={18} className="animate-spin" />
                <span>Saving Changes...</span>
              </>
            ) : (
              <>
                <Save size={18} />
                <span>Save All Settings</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
