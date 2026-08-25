'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { useToast } from '@/components/ToastProvider';
import { createSubscriber } from '@/app/actions/subscriber-actions';
import { getPackages } from '@/app/actions/package-actions';
import { User, Wifi, ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';

interface PackageOption {
  id: string;
  name: string;
  speedMbps: number;
  priceBDT: number;
  durationDays: number;
}

export default function NewSubscriberPage() {
  const { t } = useLanguage();
  const { showToast } = useToast();
  const router = useRouter();
  const [packages, setPackages] = useState<PackageOption[]>([]);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    nid: '',
    packageId: '',
    notes: '',
    ipAddress: '',
    macAddress: '',
    routerModel: '',
    location: '',
    oltPort: '',
    onuSerial: '',
  });

  useEffect(() => {
    getPackages().then(setPackages).catch(() => {});
  }, []);

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.phone || !form.address || !form.packageId) {
      showToast(t('required'), 'warning');
      return;
    }

    setSaving(true);
    try {
      const selectedPkg = packages.find((p) => p.id === form.packageId);
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + (selectedPkg?.durationDays || 30));

      await createSubscriber({
        name: form.name,
        phone: form.phone,
        email: form.email || undefined,
        address: form.address,
        nid: form.nid || undefined,
        packageId: form.packageId,
        expiryDate: expiryDate.toISOString(),
        notes: form.notes || undefined,
        connection: (form.ipAddress || form.macAddress || form.routerModel)
          ? {
              ipAddress: form.ipAddress || undefined,
              macAddress: form.macAddress || undefined,
              routerModel: form.routerModel || undefined,
              location: form.location || undefined,
              oltPort: form.oltPort || undefined,
              onuSerial: form.onuSerial || undefined,
            }
          : undefined,
      });

      showToast(t('subscriberAdded'), 'success');
      router.push('/subscribers');
    } catch {
      showToast(t('error'), 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="breadcrumb">
        <Link href="/subscribers">{t('subscribers')}</Link>
        <span className="breadcrumb-separator">/</span>
        <span>{t('addSubscriber')}</span>
      </div>

      <div className="page-header">
        <h1>{t('addSubscriber')}</h1>
        <Link href="/subscribers" className="btn btn-secondary">
          <ArrowLeft size={16} />
          {t('back')}
        </Link>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-body">
            <div className="form-section">
              <h3 className="form-section-title">
                <User size={20} />
                {t('personalInfo')}
              </h3>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">
                    {t('name')} <span className="required">*</span>
                  </label>
                  <input
                    className="form-input"
                    type="text"
                    value={form.name}
                    onChange={(e) => updateField('name', e.target.value)}
                    placeholder={t('name')}
                    required
                    id="sub-name"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">
                    {t('phone')} <span className="required">*</span>
                  </label>
                  <input
                    className="form-input"
                    type="tel"
                    value={form.phone}
                    onChange={(e) => updateField('phone', e.target.value)}
                    placeholder="01XXXXXXXXX"
                    required
                    id="sub-phone"
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">{t('email')}</label>
                  <input
                    className="form-input"
                    type="email"
                    value={form.email}
                    onChange={(e) => updateField('email', e.target.value)}
                    placeholder={t('email')}
                    id="sub-email"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">{t('nid')}</label>
                  <input
                    className="form-input"
                    type="text"
                    value={form.nid}
                    onChange={(e) => updateField('nid', e.target.value)}
                    placeholder={t('nid')}
                    id="sub-nid"
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">
                  {t('address')} <span className="required">*</span>
                </label>
                <textarea
                  className="form-textarea"
                  value={form.address}
                  onChange={(e) => updateField('address', e.target.value)}
                  placeholder={t('address')}
                  required
                  rows={2}
                  id="sub-address"
                />
              </div>
              <div className="form-group">
                <label className="form-label">
                  {t('package')} <span className="required">*</span>
                </label>
                <select
                  className="form-select"
                  value={form.packageId}
                  onChange={(e) => updateField('packageId', e.target.value)}
                  required
                  id="sub-package"
                >
                  <option value="">{t('selectPackage')}</option>
                  {packages.map((pkg) => (
                    <option key={pkg.id} value={pkg.id}>
                      {pkg.name} — {pkg.speedMbps} Mbps — ৳{pkg.priceBDT}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">{t('notes')}</label>
                <textarea
                  className="form-textarea"
                  value={form.notes}
                  onChange={(e) => updateField('notes', e.target.value)}
                  placeholder={t('notes')}
                  rows={2}
                  id="sub-notes"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-body">
            <div className="form-section" style={{ marginBottom: 0 }}>
              <h3 className="form-section-title">
                <Wifi size={20} />
                {t('connectionDetails')}
              </h3>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">{t('ipAddress')}</label>
                  <input
                    className="form-input"
                    type="text"
                    value={form.ipAddress}
                    onChange={(e) => updateField('ipAddress', e.target.value)}
                    placeholder="192.168.1.x"
                    id="sub-ip"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">{t('macAddress')}</label>
                  <input
                    className="form-input"
                    type="text"
                    value={form.macAddress}
                    onChange={(e) => updateField('macAddress', e.target.value)}
                    placeholder="AA:BB:CC:DD:EE:FF"
                    id="sub-mac"
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">{t('routerModel')}</label>
                  <input
                    className="form-input"
                    type="text"
                    value={form.routerModel}
                    onChange={(e) => updateField('routerModel', e.target.value)}
                    placeholder={t('routerModel')}
                    id="sub-router"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">{t('location')}</label>
                  <input
                    className="form-input"
                    type="text"
                    value={form.location}
                    onChange={(e) => updateField('location', e.target.value)}
                    placeholder={t('location')}
                    id="sub-location"
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">{t('oltPort')}</label>
                  <input
                    className="form-input"
                    type="text"
                    value={form.oltPort}
                    onChange={(e) => updateField('oltPort', e.target.value)}
                    placeholder={t('oltPort')}
                    id="sub-olt"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">{t('onuSerial')}</label>
                  <input
                    className="form-input"
                    type="text"
                    value={form.onuSerial}
                    onChange={(e) => updateField('onuSerial', e.target.value)}
                    placeholder={t('onuSerial')}
                    id="sub-onu"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="form-actions">
          <Link href="/subscribers" className="btn btn-secondary">
            {t('cancel')}
          </Link>
          <button type="submit" className="btn btn-primary" disabled={saving} id="save-subscriber-btn">
            <Save size={16} />
            {saving ? t('loading') : t('save')}
          </button>
        </div>
      </form>
    </>
  );
}
