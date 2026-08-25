'use client';

import { useEffect, useState } from 'react';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import StatsCard from '@/components/StatsCard';
import {
  Users,
  UserCheck,
  UserX,
  DollarSign,
  CreditCard,
  Clock,
  UserPlus,
  AlertTriangle,
} from 'lucide-react';
import {
  getDashboardStats,
  getRevenueChartData,
  getPackageDistribution,
  getSubscriberGrowth,
} from '@/app/actions/dashboard-actions';
import Link from 'next/link';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

const CHART_COLORS = ['#3b82f6', '#06b6d4', '#8b5cf6', '#22c55e', '#f59e0b', '#ef4444'];

interface DashboardData {
  counts: { total: number; active: number; expired: number; suspended: number; inactive: number };
  monthlyRevenue: number;
  recentPayments: Array<{
    id: string;
    amount: number;
    method: string;
    date: string;
    subscriber: { name: string; phone: string };
  }>;
  expiringSoon: Array<{
    id: string;
    name: string;
    phone: string;
    expiryDate: string;
    package: { name: string };
  }>;
}

export default function DashboardPage() {
  const { t } = useLanguage();
  const [data, setData] = useState<DashboardData | null>(null);
  const [revenueData, setRevenueData] = useState<Array<{ month: string; revenue: number }>>([]);
  const [packageData, setPackageData] = useState<Array<{ name: string; value: number }>>([]);
  const [growthData, setGrowthData] = useState<Array<{ month: string; total: number; new: number }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [stats, revenue, packages, growth] = await Promise.all([
          getDashboardStats(),
          getRevenueChartData(),
          getPackageDistribution(),
          getSubscriberGrowth(),
        ]);
        setData(stats);
        setRevenueData(revenue);
        setPackageData(packages);
        setGrowthData(growth);
      } catch {
        // Database not connected yet — show empty state
        setData({
          counts: { total: 0, active: 0, expired: 0, suspended: 0, inactive: 0 },
          monthlyRevenue: 0,
          recentPayments: [],
          expiringSoon: [],
        });
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="page-loading">
        <div className="loading-spinner" />
      </div>
    );
  }

  if (!data) return null;

  const daysUntil = (date: string) => {
    const diff = new Date(date).getTime() - Date.now();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });

  return (
    <>
      {/* KPI Stats */}
      <div className="stats-grid">
        <StatsCard
          icon={<Users size={22} />}
          label={t('totalSubscribers')}
          value={data.counts.total}
          color="blue"
        />
        <StatsCard
          icon={<UserCheck size={22} />}
          label={t('activeSubscribers')}
          value={data.counts.active}
          color="green"
        />
        <StatsCard
          icon={<UserX size={22} />}
          label={t('expiredSubscribers')}
          value={data.counts.expired}
          color="red"
        />
        <StatsCard
          icon={<DollarSign size={22} />}
          label={t('monthlyRevenue')}
          value={`৳${data.monthlyRevenue.toLocaleString()}`}
          color="cyan"
        />
      </div>

      {/* Charts Row */}
      <div className="dashboard-grid">
        <div className="card">
          <div className="card-header">
            <h2>{t('revenueOverview')}</h2>
          </div>
          <div className="card-body">
            <div className="chart-container">
              {revenueData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueData}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" />
                    <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
                    <YAxis stroke="#64748b" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        background: '#1e293b',
                        border: '1px solid rgba(148,163,184,0.2)',
                        borderRadius: '8px',
                        color: '#f1f5f9',
                      }}
                      formatter={(value: unknown) => [`৳${Number(value || 0).toLocaleString()}`, 'Revenue']}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorRevenue)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="empty-state">
                  <DollarSign />
                  <h3>{t('noData')}</h3>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Package Distribution */}
        <div className="card">
          <div className="card-header">
            <h2>{t('packageDistribution')}</h2>
          </div>
          <div className="card-body">
            <div className="chart-container">
              {packageData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={packageData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {packageData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: '#1e293b',
                        border: '1px solid rgba(148,163,184,0.2)',
                        borderRadius: '8px',
                        color: '#f1f5f9',
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="empty-state">
                  <Users />
                  <h3>{t('noData')}</h3>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Subscriber Growth */}
      <div className="dashboard-grid-equal" style={{ marginBottom: 20 }}>
        <div className="card">
          <div className="card-header">
            <h2>{t('subscriberGrowth')}</h2>
          </div>
          <div className="card-body">
            <div className="chart-container">
              {growthData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={growthData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" />
                    <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
                    <YAxis stroke="#64748b" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        background: '#1e293b',
                        border: '1px solid rgba(148,163,184,0.2)',
                        borderRadius: '8px',
                        color: '#f1f5f9',
                      }}
                    />
                    <Bar dataKey="total" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Total" />
                    <Bar dataKey="new" fill="#22c55e" radius={[4, 4, 0, 0]} name="New" />
                    <Legend />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="empty-state">
                  <Users />
                  <h3>{t('noData')}</h3>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Expiring Soon */}
        <div className="card">
          <div className="card-header">
            <h2>{t('expiringSoon')}</h2>
            <Link href="/subscribers" className="btn btn-ghost btn-sm">
              {t('viewAll')}
            </Link>
          </div>
          <div className="card-body" style={{ padding: '8px 22px' }}>
            {data.expiringSoon.length > 0 ? (
              <div className="activity-list">
                {data.expiringSoon.map((sub) => {
                  const days = daysUntil(sub.expiryDate);
                  return (
                    <Link
                      key={sub.id}
                      href={`/subscribers/${sub.id}`}
                      className="activity-item"
                      style={{ textDecoration: 'none' }}
                    >
                      <div className="activity-icon expiry">
                        <AlertTriangle size={18} />
                      </div>
                      <div className="activity-info">
                        <div className="activity-info-name">{sub.name}</div>
                        <div className="activity-info-detail">{sub.package.name}</div>
                      </div>
                      <div className="activity-time">
                        {days <= 0 ? t('expired') : `${days} ${t('daysLeft')}`}
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="empty-state" style={{ padding: '32px 0' }}>
                <Clock />
                <h3>{t('noData')}</h3>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Payments & Quick Actions */}
      <div className="dashboard-grid">
        <div className="card">
          <div className="card-header">
            <h2>{t('recentPayments')}</h2>
            <Link href="/billing" className="btn btn-ghost btn-sm">
              {t('viewAll')}
            </Link>
          </div>
          <div className="card-body" style={{ padding: '8px 22px' }}>
            {data.recentPayments.length > 0 ? (
              <div className="activity-list">
                {data.recentPayments.map((payment) => (
                  <div key={payment.id} className="activity-item">
                    <div className="activity-icon payment">
                      <CreditCard size={18} />
                    </div>
                    <div className="activity-info">
                      <div className="activity-info-name">
                        {payment.subscriber.name}
                      </div>
                      <div className="activity-info-detail">
                        {payment.method} • {payment.subscriber.phone}
                      </div>
                    </div>
                    <div className="activity-amount">৳{payment.amount.toLocaleString()}</div>
                    <div className="activity-time">{formatDate(payment.date)}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state" style={{ padding: '32px 0' }}>
                <CreditCard />
                <h3>{t('noData')}</h3>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card">
          <div className="card-header">
            <h2>{t('quickActions')}</h2>
          </div>
          <div className="card-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <Link href="/subscribers/new" className="btn btn-primary" style={{ justifyContent: 'center' }}>
                <UserPlus size={18} />
                {t('addSubscriber')}
              </Link>
              <Link href="/billing" className="btn btn-secondary" style={{ justifyContent: 'center' }}>
                <CreditCard size={18} />
                {t('recordPayment')}
              </Link>
              <Link href="/packages" className="btn btn-secondary" style={{ justifyContent: 'center' }}>
                <Users size={18} />
                {t('packages')}
              </Link>
              <Link href="/" className="btn btn-ghost" style={{ justifyContent: 'center', color: '#38bdf8' }}>
                View Customer Home Page Portal ↗
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
