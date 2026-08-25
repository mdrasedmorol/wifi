'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { useToast } from '@/components/ToastProvider';
import StatusBadge from '@/components/StatusBadge';
import PaymentModal from '@/components/PaymentModal';
import { getSubscriber, updateSubscriber } from '@/app/actions/subscriber-actions';
import { getPackages } from '@/app/actions/package-actions';
import {
  ArrowLeft,
  User,
  Phone,
  Mail,
  MapPin,
  Wifi,
  CreditCard,
  Calendar,
  Save,
  Pencil,
  X,
  Wallet,
} from 'lucide-react';

interface SubscriberDetail {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  address: string;
  nid: string | null;
  status: 'ACTIVE' | 'INACTIVE' | 'EXPIRED' | 'SUSPENDED';
  connectionDate: string;
  expiryDate: string;
  notes: string | null;
  package: { id: string; name: string; speedMbps: number; priceBDT: number };
  connection: {
    ipAddress: string | null;
    macAddress: string | null;
    routerModel: string | null;
    location: string | null;
    oltPort: string | null;
    onuSerial: string | null;
  } | null;
  payments: Array<{
    id: string;
    amount: number;
    method: string;
    date: string;
    month: number;
    year: number;
  }>;
}

interface PackageOption {
  id: string;
  name: string;
  speedMbps: number;
  priceBDT: number;
}

export default function SubscriberDetailPage() {
  const { t } = useLanguage();
  const { showToast } = useToast();
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params.id as string;

  const [subscriber, setSubscriber] = useState<SubscriberDetail | null>(null);
  const [packages, setPackages] = useState<PackageOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(searchParams.get('edit') === 'true');
  const [saving, setSaving] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);

  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    nid: '',
    packageId: '',
    status: '' as string,
    expiryDate: '',
    notes: '',
    ipAddress: '',
    macAddress: '',
    routerModel: '',
    location: '',
    oltPort: '',
    onuSerial: '',
  });

  useEffect(() => {
    async function load() {
      try {
        const [sub, pkgs] = await Promise.all([
          getSubscriber(id),
          getPackages(),
        ]);
        if (sub) {
          setSubscriber(sub);
          setForm({
            name: sub.name,
            phone: sub.phone,
            email: sub.email || '',
            address: sub.address,
            nid: sub.nid || '',
            packageId: sub.package.id,
            status: sub.status,
            expiryDate: new Date(sub.expiryDate).toISOString().split('T')[0],
            notes: sub.notes || '',
            ipAddress: sub.connection?.ipAddress || '',
            macAddress: sub.connection?.macAddress || '',
            routerModel: sub.connection?.routerModel || '',
            location: sub.connection?.location || '',
            oltPort: sub.connection?.oltPort || '',
            onuSerial: sub.connection?.onuSerial || '',
          });
        }
        setPackages(pkgs);
      } catch {
        showToast(t('error'), 'error');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, showToast, t]);

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateSubscriber(id, {
        name: form.name,
        phone: form.phone,
        email: form.email || undefined,
        address: form.address,
        nid: form.nid || undefined,
        packageId: form.packageId,
        status: form.status as SubscriberDetail['status'],
        expiryDate: form.expiryDate,
        notes: form.notes || undefined,
        connection: {
          ipAddress: form.ipAddress || undefined,
          macAddress: form.macAddress || undefined,
          routerModel: form.routerModel || undefined,
          location: form.location || undefined,
          oltPort: form.oltPort || undefined,
          onuSerial: form.onuSerial || undefined,
        },
      });
      showToast(t('subscriberUpdated'), 'success');
      setEditing(false);
      // Reload
      const sub = await getSubscriber(id);
      if (sub) setSubscriber(sub);
    } catch {
      showToast(t('error'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  if (loading) {
    return (
      <div className="page-loading">
        <div className="loading-spinner" />
      </div>
    );
  }

  if (!subscriber) {
    return (
      <div className="empty-state">
        <User />
        <h3>{t('noSubscribers')}</h3>
        <Link href="/subscribers" className="btn btn-primary" style={{ marginTop: 16 }}>
          {t('back')}
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="breadcrumb">
        <Link href="/subscribers">{t('subscribers')}</Link>
        <span className="breadcrumb-separator">/</span>
        <span>{subscriber.name}</span>
      </div>

      <div className="detail-header">
        <div className="detail-header-info">
          <div className="detail-avatar">
            {subscriber.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="detail-name">{subscriber.name}</div>
            <div className="detail-meta">
              <StatusBadge status={subscriber.status} />
              <span>{subscriber.package.name}</span>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary" onClick={() => setPaymentModalOpen(true)}>
            <Wallet size={16} />
            {t('recordPayment')}
          </button>
          <Link href="/subscribers" className="btn btn-secondary">
            <ArrowLeft size={16} />
            {t('back')}
          </Link>
          {!editing ? (
            <button className="btn btn-primary" onClick={() => setEditing(true)}>
              <Pencil size={16} />
              {t('edit')}
            </button>
          ) : (
            <>
              <button className="btn btn-secondary" onClick={() => setEditing(false)}>
                <X size={16} />
                {t('cancel')}
              </button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                <Save size={16} />
                {saving ? t('loading') : t('save')}
              </button>
            </>
          )}
        </div>
      </div>

      <div className="detail-grid">
        {/* Personal Info */}
        <div className="card">
          <div className="card-header">
            <h2><User size={18} style={{ marginRight: 8, verticalAlign: 'middle' }} />{t('personalInfo')}</h2>
          </div>
          <div className="card-body">
            {editing ? (
              <>
                <div className="form-group">
                  <label className="form-label">{t('name')}</label>
                  <input className="form-input" value={form.name} onChange={(e) => updateField('name', e.target.value)} />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">{t('phone')}</label>
                    <input className="form-input" value={form.phone} onChange={(e) => updateField('phone', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">{t('email')}</label>
                    <input className="form-input" value={form.email} onChange={(e) => updateField('email', e.target.value)} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">{t('address')}</label>
                  <textarea className="form-textarea" value={form.address} onChange={(e) => updateField('address', e.target.value)} rows={2} />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">{t('nid')}</label>
                    <input className="form-input" value={form.nid} onChange={(e) => updateField('nid', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">{t('status')}</label>
                    <select className="form-select" value={form.status} onChange={(e) => updateField('status', e.target.value)}>
                      <option value="ACTIVE">{t('active')}</option>
                      <option value="INACTIVE">{t('inactive')}</option>
                      <option value="EXPIRED">{t('expired')}</option>
                      <option value="SUSPENDED">{t('suspended')}</option>
                    </select>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">{t('package')}</label>
                    <select className="form-select" value={form.packageId} onChange={(e) => updateField('packageId', e.target.value)}>
                      {packages.map((p) => (
                        <option key={p.id} value={p.id}>{p.name} — {p.speedMbps}Mbps</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">{t('expiryDate')}</label>
                    <input className="form-input" type="date" value={form.expiryDate} onChange={(e) => updateField('expiryDate', e.target.value)} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">{t('notes')}</label>
                  <textarea className="form-textarea" value={form.notes} onChange={(e) => updateField('notes', e.target.value)} rows={2} />
                </div>
              </>
            ) : (
              <>
                <div className="detail-field">
                  <div className="detail-field-label"><Phone size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />{t('phone')}</div>
                  <div className="detail-field-value">{subscriber.phone}</div>
                </div>
                <div className="detail-field">
                  <div className="detail-field-label"><Mail size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />{t('email')}</div>
                  <div className="detail-field-value">{subscriber.email || '—'}</div>
                </div>
                <div className="detail-field">
                  <div className="detail-field-label"><MapPin size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />{t('address')}</div>
                  <div className="detail-field-value">{subscriber.address}</div>
                </div>
                <div className="detail-field">
                  <div className="detail-field-label">{t('nid')}</div>
                  <div className="detail-field-value">{subscriber.nid || '—'}</div>
                </div>
                <div className="detail-field">
                  <div className="detail-field-label"><Calendar size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />{t('connectionDate')}</div>
                  <div className="detail-field-value">{formatDate(subscriber.connectionDate)}</div>
                </div>
                <div className="detail-field">
                  <div className="detail-field-label"><Calendar size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />{t('expiryDate')}</div>
                  <div className="detail-field-value">{formatDate(subscriber.expiryDate)}</div>
                </div>
                {subscriber.notes && (
                  <div className="detail-field">
                    <div className="detail-field-label">{t('notes')}</div>
                    <div className="detail-field-value">{subscriber.notes}</div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Connection Details & Payment History */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="card">
            <div className="card-header">
              <h2><Wifi size={18} style={{ marginRight: 8, verticalAlign: 'middle' }} />{t('connectionDetails')}</h2>
            </div>
            <div className="card-body">
              {editing ? (
                <>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">{t('ipAddress')}</label>
                      <input className="form-input" value={form.ipAddress} onChange={(e) => updateField('ipAddress', e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">{t('macAddress')}</label>
                      <input className="form-input" value={form.macAddress} onChange={(e) => updateField('macAddress', e.target.value)} />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">{t('routerModel')}</label>
                      <input className="form-input" value={form.routerModel} onChange={(e) => updateField('routerModel', e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">{t('location')}</label>
                      <input className="form-input" value={form.location} onChange={(e) => updateField('location', e.target.value)} />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">{t('oltPort')}</label>
                      <input className="form-input" value={form.oltPort} onChange={(e) => updateField('oltPort', e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">{t('onuSerial')}</label>
                      <input className="form-input" value={form.onuSerial} onChange={(e) => updateField('onuSerial', e.target.value)} />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {[
                    { label: t('ipAddress'), value: subscriber.connection?.ipAddress },
                    { label: t('macAddress'), value: subscriber.connection?.macAddress },
                    { label: t('routerModel'), value: subscriber.connection?.routerModel },
                    { label: t('location'), value: subscriber.connection?.location },
                    { label: t('oltPort'), value: subscriber.connection?.oltPort },
                    { label: t('onuSerial'), value: subscriber.connection?.onuSerial },
                  ].map((field, i) => (
                    <div key={i} className="detail-field">
                      <div className="detail-field-label">{field.label}</div>
                      <div className="detail-field-value">{field.value || '—'}</div>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>

          {/* Payment History */}
          <div className="card">
            <div className="card-header">
              <h2><CreditCard size={18} style={{ marginRight: 8, verticalAlign: 'middle' }} />{t('paymentHistory')}</h2>
            </div>
            <div className="card-body" style={{ padding: '8px 22px' }}>
              {subscriber.payments.length > 0 ? (
                <div className="activity-list">
                  {subscriber.payments.map((payment) => (
                    <div key={payment.id} className="activity-item">
                      <div className="activity-icon payment">
                        <CreditCard size={16} />
                      </div>
                      <div className="activity-info">
                        <div className="activity-info-name">
                          {monthNames[payment.month - 1]} {payment.year}
                        </div>
                        <div className="activity-info-detail">{payment.method}</div>
                      </div>
                      <div className="activity-amount">৳{payment.amount.toLocaleString()}</div>
                      <div className="activity-time">{formatDate(payment.date)}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state" style={{ padding: '24px 0' }}>
                  <CreditCard />
                  <h3>{t('noPayments')}</h3>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <PaymentModal
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        subscriber={{
          id: subscriber.id,
          name: subscriber.name,
          phone: subscriber.phone,
          package: subscriber.package,
        }}
        onPaymentSuccess={async () => {
          showToast(t('paymentRecorded'), 'success');
          const updatedSub = await getSubscriber(id);
          if (updatedSub) setSubscriber(updatedSub);
        }}
      />
    </>
  );
}
