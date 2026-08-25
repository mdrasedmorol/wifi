'use client';

import { useEffect, useState } from 'react';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { useToast } from '@/components/ToastProvider';
import Modal from '@/components/Modal';
import {
  getPackages,
  createPackage,
  updatePackage,
  deletePackage,
  togglePackageStatus,
} from '@/app/actions/package-actions';
import {
  Plus,
  Zap,
  Users,
  Clock,
  Pencil,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Package as PackageIcon,
  Save,
} from 'lucide-react';

interface PackageData {
  id: string;
  name: string;
  speedMbps: number;
  priceBDT: number;
  durationDays: number;
  description: string | null;
  isActive: boolean;
  _count: { subscribers: number };
}

const emptyForm = {
  name: '',
  speedMbps: '',
  priceBDT: '',
  durationDays: '30',
  description: '',
};

export default function PackagesPage() {
  const { t } = useLanguage();
  const { showToast } = useToast();
  const [packages, setPackages] = useState<PackageData[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const loadPackages = async () => {
    try {
      const pkgs = await getPackages(true);
      setPackages(pkgs);
    } catch {
      setPackages([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPackages();
  }, []);

  const openAdd = () => {
    setForm(emptyForm);
    setEditingId(null);
    setModalOpen(true);
  };

  const openEdit = (pkg: PackageData) => {
    setForm({
      name: pkg.name,
      speedMbps: String(pkg.speedMbps),
      priceBDT: String(pkg.priceBDT),
      durationDays: String(pkg.durationDays),
      description: pkg.description || '',
    });
    setEditingId(pkg.id);
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.speedMbps || !form.priceBDT) {
      showToast(t('required'), 'warning');
      return;
    }

    setSaving(true);
    try {
      if (editingId) {
        await updatePackage(editingId, {
          name: form.name,
          speedMbps: parseInt(form.speedMbps),
          priceBDT: parseFloat(form.priceBDT),
          durationDays: parseInt(form.durationDays) || 30,
          description: form.description || undefined,
        });
        showToast(t('packageUpdated'), 'success');
      } else {
        await createPackage({
          name: form.name,
          speedMbps: parseInt(form.speedMbps),
          priceBDT: parseFloat(form.priceBDT),
          durationDays: parseInt(form.durationDays) || 30,
          description: form.description || undefined,
        });
        showToast(t('packageAdded'), 'success');
      }
      setModalOpen(false);
      loadPackages();
    } catch {
      showToast(t('error'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deletePackage(deleteId);
      showToast(t('packageDeleted'), 'success');
      setDeleteId(null);
      loadPackages();
    } catch (err) {
      showToast(err instanceof Error ? err.message : t('error'), 'error');
    }
  };

  const handleToggle = async (id: string) => {
    try {
      await togglePackageStatus(id);
      loadPackages();
    } catch {
      showToast(t('error'), 'error');
    }
  };

  if (loading) {
    return (
      <div className="page-loading">
        <div className="loading-spinner" />
      </div>
    );
  }

  return (
    <>
      <div className="page-header">
        <h1>{t('packages')}</h1>
        <button className="btn btn-primary" onClick={openAdd} id="add-package-btn">
          <Plus size={16} />
          {t('addPackage')}
        </button>
      </div>

      {packages.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <PackageIcon />
            <h3>{t('noPackages')}</h3>
            <p style={{ marginTop: 8 }}>
              <button className="btn btn-primary" onClick={openAdd}>
                <Plus size={16} />
                {t('addPackage')}
              </button>
            </p>
          </div>
        </div>
      ) : (
        <div className="package-grid">
          {packages.map((pkg) => (
            <div key={pkg.id} className={`package-card ${!pkg.isActive ? 'inactive' : ''}`}>
              <div className="package-card-speed">
                {pkg.speedMbps} <span>{t('mbps')}</span>
              </div>
              <div className="package-card-name">{pkg.name}</div>
              <div className="package-card-price">
                {t('bdt')}{pkg.priceBDT.toLocaleString()}
                <span> {t('perMonth')}</span>
              </div>

              <div className="package-card-meta">
                <div className="package-card-meta-item">
                  <Users size={16} />
                  {pkg._count.subscribers} {t('subscriberCount')}
                </div>
                <div className="package-card-meta-item">
                  <Clock size={16} />
                  {pkg.durationDays} {t('days')}
                </div>
                <div className="package-card-meta-item">
                  <Zap size={16} />
                  {pkg.isActive ? t('active') : t('inactive')}
                </div>
                {pkg.description && (
                  <div className="package-card-meta-item" style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                    {pkg.description}
                  </div>
                )}
              </div>

              <div className="package-card-actions">
                <button className="btn btn-secondary btn-sm" onClick={() => openEdit(pkg)}>
                  <Pencil size={14} />
                  {t('edit')}
                </button>
                <button className="btn btn-ghost btn-sm" onClick={() => handleToggle(pkg.id)}>
                  {pkg.isActive ? <ToggleRight size={14} style={{ color: 'var(--status-active)' }} /> : <ToggleLeft size={14} />}
                </button>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => setDeleteId(pkg.id)}
                  style={{ color: 'var(--status-expired)' }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? t('editPackage') : t('addPackage')}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setModalOpen(false)}>
              {t('cancel')}
            </button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              <Save size={16} />
              {saving ? t('loading') : t('save')}
            </button>
          </>
        }
      >
        <div className="form-group">
          <label className="form-label">{t('packageName')} <span className="required">*</span></label>
          <input
            className="form-input"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder={t('packageName')}
            id="pkg-name"
          />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">{t('speedMbps')} <span className="required">*</span></label>
            <input
              className="form-input"
              type="number"
              value={form.speedMbps}
              onChange={(e) => setForm({ ...form, speedMbps: e.target.value })}
              placeholder="10"
              id="pkg-speed"
            />
          </div>
          <div className="form-group">
            <label className="form-label">{t('priceBDT')} <span className="required">*</span></label>
            <input
              className="form-input"
              type="number"
              value={form.priceBDT}
              onChange={(e) => setForm({ ...form, priceBDT: e.target.value })}
              placeholder="500"
              id="pkg-price"
            />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">{t('durationDays')}</label>
          <input
            className="form-input"
            type="number"
            value={form.durationDays}
            onChange={(e) => setForm({ ...form, durationDays: e.target.value })}
            placeholder="30"
            id="pkg-duration"
          />
        </div>
        <div className="form-group">
          <label className="form-label">{t('description')}</label>
          <textarea
            className="form-textarea"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder={t('description')}
            rows={3}
            id="pkg-desc"
          />
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <Modal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        title={t('delete')}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setDeleteId(null)}>
              {t('cancel')}
            </button>
            <button className="btn btn-danger" onClick={handleDelete}>
              {t('confirm')}
            </button>
          </>
        }
      >
        <p style={{ color: 'var(--text-secondary)' }}>
          {t('deleteConfirm')}
        </p>
      </Modal>
    </>
  );
}
