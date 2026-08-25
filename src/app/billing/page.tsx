'use client';

import { useEffect, useState, useCallback } from 'react';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { useToast } from '@/components/ToastProvider';
import PaymentModal, { SubscriberOption } from '@/components/PaymentModal';
import {
  getPayments,
  createPayment,
  getMonthlyBillingSummary,
} from '@/app/actions/payment-actions';
import { getSubscribers } from '@/app/actions/subscriber-actions';
import {
  Plus,
  CreditCard,
  Search,
  ChevronLeft,
  ChevronRight,
  Save,
  DollarSign,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';

interface Payment {
  id: string;
  amount: number;
  method: string;
  date: string;
  month: number;
  year: number;
  receiptNo: string | null;
  note: string | null;
  subscriber: { id: string; name: string; phone: string };
}

interface BillingSummary {
  collected: number;
  expectedRevenue: number;
  due: number;
  totalActive: number;
  paidCount: number;
  unpaidCount: number;
  unpaidSubscribers: Array<{
    id: string;
    name: string;
    phone: string;
    packageName: string;
    amount: number;
  }>;
}
const monthNames = [
  'january', 'february', 'march', 'april', 'may', 'june',
  'july', 'august', 'september', 'october', 'november', 'december',
] as const;

export default function BillingPage() {
  const { t } = useLanguage();
  const { showToast } = useToast();
  const now = new Date();
  const [currentMonth, setCurrentMonth] = useState(now.getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(now.getFullYear());
  const [payments, setPayments] = useState<Payment[]>([]);
  const [summary, setSummary] = useState<BillingSummary | null>(null);
  const [subscribers, setSubscribers] = useState<SubscriberOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Payment modal
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedSub, setSelectedSub] = useState<SubscriberOption | null>(null);

  // Tab state
  const [activeTab, setActiveTab] = useState<'payments' | 'unpaid'>('payments');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [paymentResult, summaryResult] = await Promise.all([
        getPayments({ month: currentMonth, year: currentYear, page, perPage: 15 }),
        getMonthlyBillingSummary(currentMonth, currentYear),
      ]);
      setPayments(paymentResult.payments);
      setTotalPages(paymentResult.pages);
      setSummary(summaryResult);
    } catch {
      setPayments([]);
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }, [currentMonth, currentYear, page]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    getSubscribers({ perPage: 1000 }).then((r) => setSubscribers(r.subscribers)).catch(() => {});
  }, []);

  const openPaymentModal = (subId?: string) => {
    const sub = subId ? subscribers.find((s) => s.id === subId) : null;
    setSelectedSub(sub || null);
    setModalOpen(true);
  };

  const navigateMonth = (direction: number) => {
    let m = currentMonth + direction;
    let y = currentYear;
    if (m > 12) { m = 1; y++; }
    if (m < 1) { m = 12; y--; }
    setCurrentMonth(m);
    setCurrentYear(y);
    setPage(1);
  };

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

  return (
    <>
      {/* Month Navigation */}
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button className="btn btn-ghost btn-icon" onClick={() => navigateMonth(-1)}>
            <ChevronLeft size={20} />
          </button>
          <h1>{t(monthNames[currentMonth - 1])} {currentYear}</h1>
          <button className="btn btn-ghost btn-icon" onClick={() => navigateMonth(1)}>
            <ChevronRight size={20} />
          </button>
        </div>
        <button className="btn btn-primary" onClick={() => openPaymentModal()} id="record-payment-btn">
          <Plus size={16} />
          {t('recordPayment')}
        </button>
      </div>

      {/* Billing Summary */}
      {summary && (
        <div className="billing-summary">
          <div className="billing-summary-card">
            <h3>{t('totalCollected')}</h3>
            <div className="value green">৳{summary.collected.toLocaleString()}</div>
          </div>
          <div className="billing-summary-card">
            <h3>{t('totalDue')}</h3>
            <div className="value amber">৳{Math.max(0, summary.due).toLocaleString()}</div>
          </div>
          <div className="billing-summary-card">
            <h3>{t('overdue')}</h3>
            <div className="value red">{summary.unpaidCount}</div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="tabs">
        <button
          className={`tab ${activeTab === 'payments' ? 'active' : ''}`}
          onClick={() => setActiveTab('payments')}
        >
          <CreditCard size={16} style={{ marginRight: 6, verticalAlign: 'middle' }} />
          {t('paymentHistory')} ({payments.length})
        </button>
        <button
          className={`tab ${activeTab === 'unpaid' ? 'active' : ''}`}
          onClick={() => setActiveTab('unpaid')}
        >
          <AlertTriangle size={16} style={{ marginRight: 6, verticalAlign: 'middle' }} />
          {t('overdue')} ({summary?.unpaidCount || 0})
        </button>
      </div>

      {loading ? (
        <div className="page-loading" style={{ minHeight: 200 }}>
          <div className="loading-spinner" />
        </div>
      ) : activeTab === 'payments' ? (
        <div className="card">
          {payments.length === 0 ? (
            <div className="empty-state">
              <CreditCard />
              <h3>{t('noPayments')}</h3>
            </div>
          ) : (
            <>
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>{t('name')}</th>
                      <th>{t('phone')}</th>
                      <th>{t('amount')}</th>
                      <th>{t('paymentMethod')}</th>
                      <th>{t('paymentDate')}</th>
                      <th>{t('receiptNo')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((p) => (
                      <tr key={p.id}>
                        <td style={{ fontWeight: 600 }}>{p.subscriber.name}</td>
                        <td style={{ color: 'var(--text-secondary)' }}>{p.subscriber.phone}</td>
                        <td style={{ fontWeight: 700, color: 'var(--status-active)' }}>
                          ৳{p.amount.toLocaleString()}
                        </td>
                        <td>
                          <span style={{
                            padding: '3px 10px',
                            borderRadius: 'var(--radius-full)',
                            background: 'rgba(6, 182, 212, 0.1)',
                            color: 'var(--accent-secondary)',
                            fontSize: 12,
                            fontWeight: 600,
                          }}>
                            {t(p.method.toLowerCase() as keyof typeof import('@/lib/i18n/translations').translations.en)}
                          </span>
                        </td>
                        <td style={{ color: 'var(--text-secondary)' }}>{formatDate(p.date)}</td>
                        <td style={{ color: 'var(--text-muted)' }}>{p.receiptNo || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="table-pagination">
                  <div className="table-pagination-info">
                    {t('showing')} page {page} {t('of')} {totalPages}
                  </div>
                  <div className="table-pagination-btns">
                    <button className="btn btn-secondary btn-sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                      <ChevronLeft size={14} /> {t('previous')}
                    </button>
                    <button className="btn btn-secondary btn-sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
                      {t('next')} <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      ) : (
        <div className="card">
          {!summary || summary.unpaidSubscribers.length === 0 ? (
            <div className="empty-state">
              <CheckCircle />
              <h3>{t('noData')}</h3>
            </div>
          ) : (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>{t('name')}</th>
                    <th>{t('phone')}</th>
                    <th>{t('package')}</th>
                    <th>{t('amount')}</th>
                    <th>{t('actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.unpaidSubscribers.map((sub) => (
                    <tr key={sub.id}>
                      <td style={{ fontWeight: 600 }}>{sub.name}</td>
                      <td style={{ color: 'var(--text-secondary)' }}>{sub.phone}</td>
                      <td>{sub.packageName}</td>
                      <td style={{ fontWeight: 700, color: 'var(--status-expired)' }}>
                        ৳{sub.amount.toLocaleString()}
                      </td>
                      <td>
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => openPaymentModal(sub.id)}
                        >
                          <DollarSign size={14} />
                          {t('recordPayment')}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Pop-up Billing Payment Modal */}
      <PaymentModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedSub(null);
        }}
        subscriber={selectedSub}
        subscribersList={subscribers}
        defaultMonth={currentMonth}
        defaultYear={currentYear}
        onPaymentSuccess={() => {
          showToast(t('paymentRecorded'), 'success');
          loadData();
        }}
      />
    </>
  );
}
