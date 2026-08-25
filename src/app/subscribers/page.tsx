'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { useToast } from '@/components/ToastProvider';
import StatusBadge from '@/components/StatusBadge';
import Modal from '@/components/Modal';
import { getSubscribers, deleteSubscriber, toggleSubscriberStatus } from '@/app/actions/subscriber-actions';
import { getPackages } from '@/app/actions/package-actions';
import {
  UserPlus,
  Search,
  Eye,
  Pencil,
  Trash2,
  ToggleLeft,
  ToggleRight,
  ChevronLeft,
  ChevronRight,
  Users,
} from 'lucide-react';

interface Subscriber {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  address: string;
  status: 'ACTIVE' | 'INACTIVE' | 'EXPIRED' | 'SUSPENDED';
  expiryDate: string;
  connectionDate: string;
  package: { id: string; name: string; speedMbps: number; priceBDT: number };
}

interface PackageOption {
  id: string;
  name: string;
}

export default function SubscribersPage() {
  const { t } = useLanguage();
  const { showToast } = useToast();
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [packages, setPackages] = useState<PackageOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [packageFilter, setPackageFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [deleteModal, setDeleteModal] = useState<string | null>(null);

  const loadSubscribers = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getSubscribers({
        search: search || undefined,
        status: (statusFilter as Subscriber['status']) || undefined,
        packageId: packageFilter || undefined,
        page,
        perPage: 15,
      });
      setSubscribers(result.subscribers);
      setTotalPages(result.pages);
      setTotal(result.total);
    } catch {
      setSubscribers([]);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, packageFilter, page]);

  useEffect(() => {
    loadSubscribers();
  }, [loadSubscribers]);

  useEffect(() => {
    getPackages().then(setPackages).catch(() => {});
  }, []);

  // Debounced search
  const [searchInput, setSearchInput] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const handleDelete = async () => {
    if (!deleteModal) return;
    try {
      await deleteSubscriber(deleteModal);
      showToast(t('subscriberDeleted'), 'success');
      setDeleteModal(null);
      loadSubscribers();
    } catch {
      showToast(t('error'), 'error');
    }
  };

  const handleToggleStatus = async (id: string) => {
    try {
      await toggleSubscriberStatus(id);
      loadSubscribers();
    } catch {
      showToast(t('error'), 'error');
    }
  };

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

  return (
    <>
      <div className="page-header">
        <h1>{t('subscriberList')}</h1>
        <div className="page-header-actions">
          <Link href="/subscribers/new" className="btn btn-primary" id="add-subscriber-btn">
            <UserPlus size={16} />
            {t('addSubscriber')}
          </Link>
        </div>
      </div>

      <div className="card">
        <div className="table-toolbar">
          <div className="table-search">
            <Search />
            <input
              type="text"
              placeholder={t('searchSubscribers')}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              id="subscriber-search"
            />
          </div>
          <div className="table-filters">
            <select
              className="form-select"
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              style={{ width: 'auto', minWidth: '140px' }}
              id="status-filter"
            >
              <option value="">{t('allStatuses')}</option>
              <option value="ACTIVE">{t('active')}</option>
              <option value="INACTIVE">{t('inactive')}</option>
              <option value="EXPIRED">{t('expired')}</option>
              <option value="SUSPENDED">{t('suspended')}</option>
            </select>
            <select
              className="form-select"
              value={packageFilter}
              onChange={(e) => { setPackageFilter(e.target.value); setPage(1); }}
              style={{ width: 'auto', minWidth: '140px' }}
              id="package-filter"
            >
              <option value="">{t('all')} {t('packages')}</option>
              {packages.map((pkg) => (
                <option key={pkg.id} value={pkg.id}>{pkg.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="table-container">
          {loading ? (
            <div className="page-loading" style={{ minHeight: 200 }}>
              <div className="loading-spinner" />
            </div>
          ) : subscribers.length === 0 ? (
            <div className="empty-state">
              <Users />
              <h3>{t('noSubscribers')}</h3>
              <p>
                <Link href="/subscribers/new">{t('addSubscriber')}</Link>
              </p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>{t('name')}</th>
                  <th>{t('phone')}</th>
                  <th>{t('package')}</th>
                  <th>{t('status')}</th>
                  <th>{t('expiryDate')}</th>
                  <th>{t('actions')}</th>
                </tr>
              </thead>
              <tbody>
                {subscribers.map((sub) => (
                  <tr key={sub.id}>
                    <td>
                      <Link
                        href={`/subscribers/${sub.id}`}
                        style={{ color: 'var(--text-primary)', fontWeight: 600 }}
                      >
                        {sub.name}
                      </Link>
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>{sub.phone}</td>
                    <td>
                      <span style={{
                        padding: '3px 10px',
                        borderRadius: 'var(--radius-full)',
                        background: 'rgba(59, 130, 246, 0.1)',
                        color: 'var(--accent-primary)',
                        fontSize: '12px',
                        fontWeight: 600,
                      }}>
                        {sub.package.name}
                      </span>
                    </td>
                    <td><StatusBadge status={sub.status} /></td>
                    <td style={{ color: 'var(--text-secondary)' }}>{formatDate(sub.expiryDate)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <Link
                          href={`/subscribers/${sub.id}`}
                          className="btn btn-ghost btn-icon btn-sm"
                          title={t('view')}
                        >
                          <Eye size={15} />
                        </Link>
                        <Link
                          href={`/subscribers/${sub.id}?edit=true`}
                          className="btn btn-ghost btn-icon btn-sm"
                          title={t('edit')}
                        >
                          <Pencil size={15} />
                        </Link>
                        <button
                          className="btn btn-ghost btn-icon btn-sm"
                          title={sub.status === 'ACTIVE' ? t('inactive') : t('active')}
                          onClick={() => handleToggleStatus(sub.id)}
                        >
                          {sub.status === 'ACTIVE' ? <ToggleRight size={15} style={{ color: 'var(--status-active)' }} /> : <ToggleLeft size={15} />}
                        </button>
                        <button
                          className="btn btn-ghost btn-icon btn-sm"
                          title={t('delete')}
                          onClick={() => setDeleteModal(sub.id)}
                          style={{ color: 'var(--status-expired)' }}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {totalPages > 1 && (
          <div className="table-pagination">
            <div className="table-pagination-info">
              {t('showing')} {(page - 1) * 15 + 1}–{Math.min(page * 15, total)} {t('of')} {total} {t('results')}
            </div>
            <div className="table-pagination-btns">
              <button
                className="btn btn-secondary btn-sm"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
              >
                <ChevronLeft size={14} /> {t('previous')}
              </button>
              <button
                className="btn btn-secondary btn-sm"
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
              >
                {t('next')} <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteModal}
        onClose={() => setDeleteModal(null)}
        title={t('delete')}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setDeleteModal(null)}>
              {t('cancel')}
            </button>
            <button className="btn btn-danger" onClick={handleDelete}>
              {t('confirm')}
            </button>
          </>
        }
      >
        <p style={{ color: 'var(--text-secondary)' }}>{t('deleteConfirm')}</p>
      </Modal>
    </>
  );
}
