'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { useToast } from '@/components/ToastProvider';
import StatusBadge from '@/components/StatusBadge';
import Modal from '@/components/Modal';
import {
  getBillingCalendarData,
  CalendarSubscriberItem,
  BillingCalendarSummary,
} from '@/app/actions/billing-calendar-actions';
import { createPayment } from '@/app/actions/payment-actions';
import { getPackages } from '@/app/actions/package-actions';
import {
  Calendar,
  Search,
  Filter,
  Users,
  CheckCircle2,
  AlertCircle,
  Clock,
  Zap,
  CreditCard,
  Phone,
  Eye,
  PlusCircle,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  DollarSign,
  UserPlus,
  RefreshCw,
  LayoutGrid,
  ListFilter,
  Check,
  Server,
  ArrowUpRight,
} from 'lucide-react';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

interface PackageOption {
  id: string;
  name: string;
}

export default function BillingCalendarPage() {
  const { t, locale } = useLanguage();
  const { showToast } = useToast();

  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [packageFilter, setPackageFilter] = useState('');
  const [viewMode, setViewMode] = useState<'matrix' | 'timeline'>('matrix');

  const [loading, setLoading] = useState(true);
  const [subscribers, setSubscribers] = useState<CalendarSubscriberItem[]>([]);
  const [summary, setSummary] = useState<BillingCalendarSummary | null>(null);
  const [packages, setPackages] = useState<PackageOption[]>([]);

  // Selected Subscriber for Audit Modal
  const [selectedSub, setSelectedSub] = useState<CalendarSubscriberItem | null>(null);
  const [showSubModal, setShowSubModal] = useState(false);

  // Quick Pay Modal State
  const [quickPaySub, setQuickPaySub] = useState<CalendarSubscriberItem | null>(null);
  const [quickPayAmount, setQuickPayAmount] = useState<number>(0);
  const [quickPayMethod, setQuickPayMethod] = useState<'BKASH' | 'NAGAD' | 'CASH' | 'BANK' | 'ROCKET'>('BKASH');
  const [recordingPayment, setRecordingPayment] = useState(false);

  // Load Packages
  useEffect(() => {
    getPackages().then(setPackages).catch(() => {});
  }, []);

  // Debounce Search
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Load Billing Calendar Data
  const loadCalendarData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getBillingCalendarData({
        month: selectedMonth,
        year: selectedYear,
        search,
        status: statusFilter as any,
        packageId: packageFilter,
      });
      setSubscribers(res.subscribers);
      setSummary(res.summary);
    } catch (err) {
      console.error('Failed to load billing calendar', err);
      showToast('Error loading billing calendar data', 'error');
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, selectedYear, search, statusFilter, packageFilter, showToast]);

  useEffect(() => {
    loadCalendarData();
  }, [loadCalendarData]);

  // Month navigation helpers
  const handlePrevMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  // Quick Pay Submission
  const handleRecordQuickPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickPaySub) return;

    setRecordingPayment(true);
    try {
      await createPayment({
        subscriberId: quickPaySub.id,
        amount: Number(quickPayAmount),
        method: quickPayMethod,
        month: selectedMonth,
        year: selectedYear,
        note: `Paid via Billing Calendar (${MONTH_NAMES[selectedMonth - 1]} ${selectedYear})`,
      });

      showToast(`Payment recorded for ${quickPaySub.name}!`, 'success');
      setQuickPaySub(null);
      loadCalendarData();
      if (selectedSub?.id === quickPaySub.id) {
        setShowSubModal(false);
      }
    } catch {
      showToast('Failed to record payment', 'error');
    } finally {
      setRecordingPayment(false);
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString(locale === 'bn' ? 'bn-BD' : 'en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  // Days in selected month for Daily Timeline view
  const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();

  return (
    <>
      {/* Top Page Header */}
      <div className="page-header">
        <div>
          <h1>{t('billingCalendar')}</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>
            Track customer connection start dates, monthly payment timelines, and bill status details.
          </p>
        </div>
        <div className="page-header-actions">
          <Link href="/billing" className="btn btn-secondary">
            <CreditCard size={16} />
            Billing Records
          </Link>
        </div>
      </div>

      {/* Summary Metrics Row */}
      {summary && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-card-header">
              <span className="stat-card-label">{t('totalCollected')} ({MONTH_NAMES[selectedMonth - 1]})</span>
              <div className="stat-card-icon green">
                <DollarSign size={20} />
              </div>
            </div>
            <div className="stat-card-value">৳{summary.totalCollected.toLocaleString()}</div>
            <div className="stat-card-trend up">
              <CheckCircle2 size={13} />
              <span>{summary.paidCount} Subscribers Paid</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-card-header">
              <span className="stat-card-label">{t('totalDue')} ({MONTH_NAMES[selectedMonth - 1]})</span>
              <div className="stat-card-icon red">
                <AlertCircle size={20} />
              </div>
            </div>
            <div className="stat-card-value">৳{summary.totalPendingAmount.toLocaleString()}</div>
            <div className="stat-card-trend down">
              <Clock size={13} />
              <span>{summary.unpaidCount} Pending Payments</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-card-header">
              <span className="stat-card-label">{t('newCustomersThisMonth')}</span>
              <div className="stat-card-icon blue">
                <UserPlus size={20} />
              </div>
            </div>
            <div className="stat-card-value">{summary.newCustomersThisMonth}</div>
            <div className="stat-card-trend up">
              <Zap size={13} />
              <span>Joined in {MONTH_NAMES[selectedMonth - 1]}</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-card-header">
              <span className="stat-card-label">{t('collectionRate')}</span>
              <div className="stat-card-icon cyan">
                <TrendingUp size={20} />
              </div>
            </div>
            <div className="stat-card-value">{summary.collectionRate}%</div>
            <div className="stat-card-trend up">
              <span>{summary.paidCount} of {summary.totalSubscribers} Paid</span>
            </div>
          </div>
        </div>
      )}

      {/* Main Calendar Card */}
      <div className="card">
        {/* Month Navigation & Toolbar */}
        <div className="calendar-toolbar-header">
          {/* Left Month Picker Controls */}
          <div className="month-navigator">
            <button type="button" onClick={handlePrevMonth} className="btn-month-nav">
              <ChevronLeft size={18} />
            </button>
            <div className="month-display-title">
              <Calendar size={18} className="text-cyan-400" />
              <span>{MONTH_NAMES[selectedMonth - 1]} {selectedYear}</span>
            </div>
            <button type="button" onClick={handleNextMonth} className="btn-month-nav">
              <ChevronRight size={18} />
            </button>
          </div>

          {/* Right View Switcher & Filters */}
          <div className="calendar-controls-group">
            <div className="table-search" style={{ maxWidth: 220 }}>
              <Search size={15} />
              <input
                type="text"
                placeholder="Search name or phone..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
            </div>

            <select
              className="form-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ width: 'auto' }}
            >
              <option value="">{t('allStatuses')}</option>
              <option value="ACTIVE">{t('active')}</option>
              <option value="EXPIRED">{t('expired')}</option>
              <option value="SUSPENDED">{t('suspended')}</option>
            </select>

            <select
              className="form-select"
              value={packageFilter}
              onChange={(e) => setPackageFilter(e.target.value)}
              style={{ width: 'auto' }}
            >
              <option value="">All Packages</option>
              {packages.map((pkg) => (
                <option key={pkg.id} value={pkg.id}>{pkg.name}</option>
              ))}
            </select>

            <div className="view-mode-toggle">
              <button
                type="button"
                className={`view-mode-btn ${viewMode === 'matrix' ? 'active' : ''}`}
                onClick={() => setViewMode('matrix')}
                title="Payment Matrix View"
              >
                <LayoutGrid size={16} />
                <span>Matrix</span>
              </button>
              <button
                type="button"
                className={`view-mode-btn ${viewMode === 'timeline' ? 'active' : ''}`}
                onClick={() => setViewMode('timeline')}
                title="Daily Calendar View"
              >
                <Calendar size={16} />
                <span>Timeline</span>
              </button>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="calendar-body-content">
          {loading ? (
            <div className="page-loading" style={{ minHeight: 300 }}>
              <div className="loading-spinner" />
            </div>
          ) : subscribers.length === 0 ? (
            <div className="empty-state">
              <Users size={36} />
              <h3>No Subscriber Calendar Data Found</h3>
              <p>Try adjusting your search query, status filter, or selected month.</p>
            </div>
          ) : viewMode === 'matrix' ? (
            /* 1. Payment & Start Date Matrix Table View */
            <div className="table-container">
              <table className="data-table calendar-matrix-table">
                <thead>
                  <tr>
                    <th>Customer Name & Phone</th>
                    <th>{t('connectionStartDate')}</th>
                    <th>{t('billDueDate')}</th>
                    <th>Package & Rate</th>
                    <th>Status</th>
                    <th>{MONTH_NAMES[selectedMonth - 1]} Bill Status</th>
                    <th>Payment Date & Method</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {subscribers.map((sub) => {
                    const connDate = new Date(sub.connectionDate);
                    const isNewJoin = connDate.getMonth() + 1 === selectedMonth && connDate.getFullYear() === selectedYear;

                    return (
                      <tr key={sub.id}>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <button
                              type="button"
                              onClick={() => { setSelectedSub(sub); setShowSubModal(true); }}
                              className="cust-name-link"
                            >
                              {sub.name}
                            </button>
                            <span className="cust-phone-text">📱 {sub.phone}</span>
                          </div>
                        </td>

                        <td>
                          <div className="start-date-cell">
                            <span className="start-date-val">{formatDate(sub.connectionDate)}</span>
                            {isNewJoin && (
                              <span className="badge-new-join">⭐ Joined This Month</span>
                            )}
                          </div>
                        </td>

                        <td>
                          <div className="start-date-cell">
                            <span className="start-date-val text-amber-400">📅 {formatDate(sub.expiryDate)}</span>
                          </div>
                        </td>

                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <strong className="pkg-name-text">{sub.package.name}</strong>
                            <span className="pkg-price-text">৳{sub.package.priceBDT} / mo</span>
                          </div>
                        </td>

                        <td>
                          <StatusBadge status={sub.status} />
                        </td>

                        <td>
                          {sub.currentMonthStatus.isPaid ? (
                            <span className="cal-status-pill paid">
                              <CheckCircle2 size={13} />
                              <span>PAID (৳{sub.currentMonthStatus.amount})</span>
                            </span>
                          ) : (
                            <span className="cal-status-pill unpaid">
                              <AlertCircle size={13} />
                              <span>DUE (৳{sub.currentMonthStatus.amount})</span>
                            </span>
                          )}
                        </td>

                        <td>
                          {sub.currentMonthStatus.isPaid ? (
                            <div className="payment-date-info">
                              <span className="date-text">📅 {formatDate(sub.currentMonthStatus.date || '')}</span>
                              <span className="method-tag">{sub.currentMonthStatus.method || 'CASH'}</span>
                            </div>
                          ) : (
                            <span className="text-muted" style={{ fontSize: 12 }}>Not Paid Yet</span>
                          )}
                        </td>

                        <td>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button
                              type="button"
                              onClick={() => { setSelectedSub(sub); setShowSubModal(true); }}
                              className="btn btn-ghost btn-sm"
                              title="Audit Customer Billing & History"
                            >
                              <Eye size={15} />
                              <span>Audit</span>
                            </button>

                            {!sub.currentMonthStatus.isPaid && (
                              <button
                                type="button"
                                onClick={() => {
                                  setQuickPaySub(sub);
                                  setQuickPayAmount(sub.package.priceBDT);
                                }}
                                className="btn btn-primary btn-sm"
                                style={{ padding: '4px 10px', fontSize: 12 }}
                              >
                                <PlusCircle size={13} />
                                <span>Record Bill</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            /* 2. Daily Calendar Timeline View */
            <div className="daily-timeline-container">
              <div className="timeline-grid">
                {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((dayNum) => {
                  const dayPayments = subscribers.filter((sub) => {
                    if (!sub.currentMonthStatus.isPaid || !sub.currentMonthStatus.date) return false;
                    const pDate = new Date(sub.currentMonthStatus.date);
                    return pDate.getDate() === dayNum;
                  });

                  const dayJoins = subscribers.filter((sub) => {
                    const cDate = new Date(sub.connectionDate);
                    return (
                      cDate.getDate() === dayNum &&
                      cDate.getMonth() + 1 === selectedMonth &&
                      cDate.getFullYear() === selectedYear
                    );
                  });

                  return (
                    <div key={dayNum} className="timeline-day-cell">
                      <div className="day-cell-header">
                        <span className="day-number">{dayNum}</span>
                        <span className="day-month">{MONTH_NAMES[selectedMonth - 1].slice(0, 3)}</span>
                      </div>

                      <div className="day-events-list">
                        {/* Joins */}
                        {dayJoins.map((s) => (
                          <div
                            key={`join-${s.id}`}
                            className="event-chip join"
                            onClick={() => { setSelectedSub(s); setShowSubModal(true); }}
                          >
                            <UserPlus size={12} />
                            <span>New: {s.name}</span>
                          </div>
                        ))}

                        {/* Payments */}
                        {dayPayments.map((s) => (
                          <div
                            key={`pay-${s.id}`}
                            className="event-chip pay"
                            onClick={() => { setSelectedSub(s); setShowSubModal(true); }}
                          >
                            <Check size={12} />
                            <span>{s.name} (৳{s.currentMonthStatus.amount})</span>
                          </div>
                        ))}

                        {dayJoins.length === 0 && dayPayments.length === 0 && (
                          <span className="no-events-text">—</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Customer Audit & Details Modal */}
      <Modal
        isOpen={showSubModal}
        onClose={() => setShowSubModal(false)}
        title="Customer Billing & Connection Audit"
      >
        {selectedSub && (
          <div className="sub-audit-modal-body">
            {/* Header info */}
            <div className="sub-audit-header">
              <div className="sub-avatar-lg">{selectedSub.name.charAt(0)}</div>
              <div>
                <h3 className="sub-audit-name">{selectedSub.name}</h3>
                <p className="sub-audit-meta">📱 {selectedSub.phone} • {selectedSub.address}</p>
              </div>
              <div style={{ marginLeft: 'auto' }}>
                <StatusBadge status={selectedSub.status} />
              </div>
            </div>

            {/* Grid Stats */}
            <div className="sub-audit-grid">
              <div className="audit-card">
                <span className="audit-label">{t('connectionStartDate')}</span>
                <strong className="audit-val text-cyan-400">{formatDate(selectedSub.connectionDate)}</strong>
              </div>

              <div className="audit-card">
                <span className="audit-label">{t('billDueDate')}</span>
                <strong className="audit-val text-amber-400">📅 {formatDate(selectedSub.expiryDate)}</strong>
              </div>

              <div className="audit-card">
                <span className="audit-label">Active Package</span>
                <strong className="audit-val text-white">{selectedSub.package.name} (৳{selectedSub.package.priceBDT}/mo)</strong>
              </div>

              <div className="audit-card">
                <span className="audit-label">IP & Router</span>
                <strong className="audit-val text-blue-400">
                  {selectedSub.connection?.ipAddress || '192.168.1.X'} • {selectedSub.connection?.routerModel || 'TP-Link'}
                </strong>
              </div>

              <div className="audit-card">
                <span className="audit-label">{MONTH_NAMES[selectedMonth - 1]} Status</span>
                <strong className={`audit-val ${selectedSub.currentMonthStatus.isPaid ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {selectedSub.currentMonthStatus.isPaid ? 'PAID' : 'PENDING DUE'}
                </strong>
              </div>
            </div>

            {/* Complete Payment Log Table */}
            <h4 style={{ marginTop: 20, marginBottom: 10, fontSize: 14, color: 'var(--text-primary)' }}>
              Complete Payment History Ledger
            </h4>

            {selectedSub.payments.length > 0 ? (
              <div className="table-container" style={{ maxHeight: 220, overflowY: 'auto' }}>
                <table className="data-table" style={{ fontSize: 12 }}>
                  <thead>
                    <tr>
                      <th>Month/Year</th>
                      <th>Amount</th>
                      <th>Method</th>
                      <th>Payment Date</th>
                      <th>Receipt No</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedSub.payments.map((p) => (
                      <tr key={p.id}>
                        <td><strong>{MONTH_NAMES[p.month - 1]} {p.year}</strong></td>
                        <td style={{ color: 'var(--status-active)', fontWeight: 700 }}>৳{p.amount}</td>
                        <td><span className="method-tag">{p.method}</span></td>
                        <td>{formatDate(p.date)}</td>
                        <td><code>{p.receiptNo || 'N/A'}</code></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>No previous payment records found for this customer.</p>
            )}

            {!selectedSub.currentMonthStatus.isPaid && (
              <div style={{ marginTop: 20, textAlign: 'right' }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowSubModal(false);
                    setQuickPaySub(selectedSub);
                    setQuickPayAmount(selectedSub.package.priceBDT);
                  }}
                  className="btn btn-primary"
                >
                  <PlusCircle size={16} />
                  <span>Record Bill for {MONTH_NAMES[selectedMonth - 1]} {selectedYear}</span>
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Quick Record Payment Modal */}
      <Modal
        isOpen={!!quickPaySub}
        onClose={() => setQuickPaySub(null)}
        title={`Record Bill Payment (${MONTH_NAMES[selectedMonth - 1]} ${selectedYear})`}
      >
        {quickPaySub && (
          <form onSubmit={handleRecordQuickPayment} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <p style={{ fontSize: 14, color: 'var(--text-primary)' }}>
                Recording bill payment for subscriber <strong>{quickPaySub.name}</strong> ({quickPaySub.phone}).
              </p>
            </div>

            <div className="form-group">
              <label className="form-label">Payment Amount (BDT) *</label>
              <input
                type="number"
                className="form-input"
                value={quickPayAmount}
                onChange={(e) => setQuickPayAmount(Number(e.target.value))}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Payment Method *</label>
              <select
                className="form-select"
                value={quickPayMethod}
                onChange={(e) => setQuickPayMethod(e.target.value as any)}
              >
                <option value="BKASH">bKash Mobile Banking</option>
                <option value="NAGAD">Nagad Mobile Banking</option>
                <option value="CASH">Cash Payment</option>
                <option value="BANK">Bank Transfer</option>
                <option value="ROCKET">Rocket</option>
              </select>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setQuickPaySub(null)}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={recordingPayment}
              >
                {recordingPayment ? 'Recording...' : 'Confirm & Save Payment'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </>
  );
}
