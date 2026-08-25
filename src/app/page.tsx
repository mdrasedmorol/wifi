'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { useToast } from '@/components/ToastProvider';
import PaymentModal, { SubscriberOption } from '@/components/PaymentModal';
import { getSubscriberStatusByPhone, getSubscribers } from '@/app/actions/subscriber-actions';
import { getPackages } from '@/app/actions/package-actions';
import {
  Wifi,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  Zap,
  ShieldCheck,
  CreditCard,
  Phone,
  Globe,
  ArrowRight,
  Sparkles,
  Server,
  Headphones,
  Check,
  RefreshCw,
  LayoutDashboard,
  ChevronDown,
} from 'lucide-react';

interface LookupResult {
  subscriber: {
    id: string;
    name: string;
    phone: string;
    email?: string;
    address: string;
    status: 'ACTIVE' | 'INACTIVE' | 'EXPIRED' | 'SUSPENDED';
    expiryDate: string;
    connectionDate: string;
    package: {
      id: string;
      name: string;
      speedMbps: number;
      priceBDT: number;
      description?: string;
    };
    connection?: {
      ipAddress?: string;
      macAddress?: string;
      routerModel?: string;
      location?: string;
    };
  };
  isPaymentPending: boolean;
  dueAmount: number;
  daysRemaining: number;
  currentMonthPaid: boolean;
  lastPayment?: {
    id: string;
    amount: number;
    method: string;
    date: string;
    receiptNo?: string;
  };
}

interface PackageItem {
  id: string;
  name: string;
  speedMbps: number;
  priceBDT: number;
  durationDays: number;
  description?: string;
}

const SAMPLE_NUMBERS = [
  { name: 'Rahim', phone: '01712345678', label: '01712345678 (Active)' },
  { name: 'Karim', phone: '01812345678', label: '01812345678 (Expiring)' },
  { name: 'Fatema', phone: '01612345678', label: '01612345678 (Expired)' },
];

export default function HomePage() {
  const { t, locale, toggleLocale } = useLanguage();
  const { showToast } = useToast();

  const [phoneInput, setPhoneInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<LookupResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [packages, setPackagesList] = useState<PackageItem[]>([]);
  const [allSubscribersList, setAllSubscribersList] = useState<SubscriberOption[]>([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedSubForPayment, setSelectedSubForPayment] = useState<SubscriberOption | null>(null);

  // Load packages & subscribers for demo dropdown / payment options
  useEffect(() => {
    async function loadData() {
      try {
        const pkgs = await getPackages(false);
        setPackagesList(pkgs);

        const subsRes = await getSubscribers({ perPage: 50 });
        if (subsRes?.subscribers) {
          setAllSubscribersList(subsRes.subscribers);
        }
      } catch (err) {
        console.error('Failed to load initial packages or subscribers', err);
      }
    }
    loadData();
  }, []);

  const handleLookup = async (phoneToSearch?: string) => {
    const targetPhone = phoneToSearch || phoneInput;
    if (!targetPhone.trim()) {
      showToast(t('enterMobileNumber'), 'warning');
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const res = await getSubscriberStatusByPhone(targetPhone);
      if (res.success && res.subscriber) {
        setResult({
          subscriber: res.subscriber,
          isPaymentPending: !!res.isPaymentPending,
          dueAmount: res.dueAmount ?? 0,
          daysRemaining: res.daysRemaining ?? 0,
          currentMonthPaid: !!res.currentMonthPaid,
          lastPayment: res.lastPayment || undefined,
        });
        showToast('Subscriber account found!', 'success');
      } else {
        setResult(null);
        setErrorMessage(res.error || 'No subscriber account found with this phone number.');
      }
    } catch {
      setErrorMessage('Server connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenPayment = (sub?: LookupResult['subscriber']) => {
    if (sub) {
      setSelectedSubForPayment({
        id: sub.id,
        name: sub.name,
        phone: sub.phone,
        package: {
          priceBDT: sub.package.priceBDT,
          name: sub.package.name,
        },
      });
    } else if (result?.subscriber) {
      setSelectedSubForPayment({
        id: result.subscriber.id,
        name: result.subscriber.name,
        phone: result.subscriber.phone,
        package: {
          priceBDT: result.subscriber.package.priceBDT,
          name: result.subscriber.package.name,
        },
      });
    }
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = () => {
    showToast('Payment completed successfully! Refreshing status...', 'success');
    if (result?.subscriber?.phone) {
      handleLookup(result.subscriber.phone);
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

  return (
    <div className="portal-page">
      {/* 1. Public Top Navigation Navbar */}
      <nav className="public-navbar">
        <div className="public-nav-inner">
          <Link href="/" className="public-brand">
            <div className="brand-icon-box">
              <Wifi size={22} className="text-white" />
            </div>
            <div>
              <div className="brand-title">{t('appName')}</div>
              <div className="brand-subtitle">Ultra Fiber Broadband</div>
            </div>
          </Link>

          <div className="public-nav-links">
            <a href="#status-search" className="nav-link-item">
              <Search size={15} />
              <span>{t('connectionStatus')}</span>
            </a>
            <a href="#packages-section" className="nav-link-item">
              <Zap size={15} />
              <span>{t('packages')}</span>
            </a>
            <a href="#network-status" className="nav-link-item">
              <Server size={15} />
              <span>{t('networkStatusLabel')}</span>
            </a>
          </div>

          <div className="public-nav-actions">
            <button type="button" className="lang-toggle-btn" onClick={toggleLocale}>
              <Globe size={15} />
              <span>{locale === 'en' ? 'বাংলা' : 'English'}</span>
            </button>

            <Link href="/dashboard" className="btn-admin-link">
              <LayoutDashboard size={15} />
              <span>{t('adminLoginBtn')}</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* 2. Hero Section with Search Container */}
      <section className="portal-hero" id="status-search">
        <div className="portal-hero-bg-lights">
          <div className="glow-sphere sphere-1" />
          <div className="glow-sphere sphere-2" />
        </div>

        <div className="portal-hero-container">
          {/* Badge */}
          <div className="portal-hero-badge">
            <Sparkles size={14} className="text-amber-400" />
            <span>{t('customerPortal')} — Instant Self-Service</span>
          </div>

          <h1 className="portal-hero-title">{t('portalHeroTitle')}</h1>
          <p className="portal-hero-subtitle">{t('portalHeroSubtitle')}</p>

          {/* Search Box */}
          <div className="search-card">
            <div className="search-input-wrapper">
              <div className="search-icon-inside">
                <Phone size={20} />
              </div>
              <input
                type="tel"
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLookup()}
                placeholder={t('searchPlaceholder')}
                className="search-input-field"
              />
              <button
                type="button"
                onClick={() => handleLookup()}
                disabled={loading}
                className="search-submit-btn"
              >
                {loading ? (
                  <>
                    <RefreshCw size={18} className="animate-spin" />
                    <span>Checking...</span>
                  </>
                ) : (
                  <>
                    <Search size={18} />
                    <span>{t('checkStatusBtn')}</span>
                  </>
                )}
              </button>
            </div>

            {/* Quick Sample Pills */}
            <div className="sample-pills-row">
              <span className="sample-label">{t('sampleNumbers')}</span>
              {SAMPLE_NUMBERS.map((sample) => (
                <button
                  key={sample.phone}
                  type="button"
                  onClick={() => {
                    setPhoneInput(sample.phone);
                    handleLookup(sample.phone);
                  }}
                  className="sample-pill-btn"
                >
                  ⚡ {sample.label}
                </button>
              ))}
            </div>
          </div>

          {/* Error Notice */}
          {errorMessage && (
            <div className="error-alert-box animate-fade-in">
              <AlertCircle size={20} />
              <div>
                <strong>Account Not Found</strong>
                <p>{errorMessage}</p>
              </div>
            </div>
          )}

          {/* 3. Lookup Results Dashboard Card */}
          {result && (
            <div className="result-card animate-slide-up">
              <div className="result-card-header">
                <div className="subscriber-title-group">
                  <div className="subscriber-avatar">
                    {result.subscriber.name.charAt(0)}
                  </div>
                  <div>
                    <h2 className="subscriber-name">{result.subscriber.name}</h2>
                    <p className="subscriber-phone">📱 {result.subscriber.phone} • {result.subscriber.address}</p>
                  </div>
                </div>

                <div className="status-badges-group">
                  {/* Connection Status Badge */}
                  <div className={`status-badge-lg ${result.subscriber.status.toLowerCase()}`}>
                    <span className="dot-pulse" />
                    <span>{result.subscriber.status}</span>
                  </div>

                  {/* Expiry Badge */}
                  <div className={`expiry-badge ${result.daysRemaining <= 0 ? 'expired' : 'active'}`}>
                    <Clock size={14} />
                    <span>
                      {result.daysRemaining <= 0
                        ? `Expired (${Math.abs(result.daysRemaining)} days ago)`
                        : `${result.daysRemaining} ${t('daysLeft')}`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Status Grid Cards */}
              <div className="result-grid">
                {/* Active Subscription Package Details */}
                <div className="info-subcard">
                  <div className="subcard-header">
                    <Zap size={18} className="text-cyan-400" />
                    <span>{t('subscriptionPackage')}</span>
                  </div>
                  <div className="package-highlight-title">{result.subscriber.package.name}</div>
                  <div className="package-speed-tag">
                    ⚡ {result.subscriber.package.speedMbps} Mbps Ultra Speed
                  </div>
                  <div className="subcard-footer-item">
                    <span>Package Price:</span>
                    <strong className="text-white">৳{result.subscriber.package.priceBDT} / month</strong>
                  </div>
                  <div className="subcard-footer-item">
                    <span>Expiry Date:</span>
                    <strong>{formatDate(result.subscriber.expiryDate)}</strong>
                  </div>
                </div>

                {/* Payment Status & Direct Payment Card */}
                <div className={`info-subcard payment-card ${result.isPaymentPending ? 'pending' : 'paid'}`}>
                  <div className="subcard-header">
                    <CreditCard size={18} />
                    <span>{t('paymentStatus')}</span>
                  </div>

                  {result.isPaymentPending ? (
                    <div>
                      <div className="payment-status-title pending">
                        <AlertCircle size={22} />
                        <span>{t('pendingStatus')}</span>
                      </div>
                      <div className="due-amount-display">
                        <span>{t('dueAmount')}:</span>
                        <strong className="due-price">৳{result.dueAmount} BDT</strong>
                      </div>

                      {/* Pay Pending Bill Button */}
                      <button
                        type="button"
                        onClick={() => handleOpenPayment()}
                        className="btn-pay-now-glow"
                      >
                        <Sparkles size={18} />
                        <span>{t('payNowBtn')} (৳{result.dueAmount})</span>
                        <ArrowRight size={18} />
                      </button>
                    </div>
                  ) : (
                    <div>
                      <div className="payment-status-title paid">
                        <CheckCircle2 size={22} />
                        <span>{t('paidStatus')}</span>
                      </div>
                      <p className="paid-description">
                        Your subscription bill for the current month is fully paid. Thank you!
                      </p>
                      {result.lastPayment && (
                        <div className="receipt-preview">
                          <div>
                            <span>Receipt / Ref:</span> <strong>{result.lastPayment.receiptNo || 'N/A'}</strong>
                          </div>
                          <div>
                            <span>Method & Date:</span> <strong>{result.lastPayment.method} • {formatDate(result.lastPayment.date)}</strong>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Connection & IP Details */}
                <div className="info-subcard">
                  <div className="subcard-header">
                    <Server size={18} className="text-blue-400" />
                    <span>Connection & Router Details</span>
                  </div>
                  <div className="tech-details-list">
                    <div className="tech-item">
                      <span>{t('ipAddressLabel')}:</span>
                      <code>{result.subscriber.connection?.ipAddress || '192.168.1.100'}</code>
                    </div>
                    <div className="tech-item">
                      <span>{t('routerModelLabel')}:</span>
                      <strong>{result.subscriber.connection?.routerModel || 'TP-Link Fiber ONU'}</strong>
                    </div>
                    <div className="tech-item">
                      <span>MAC Address:</span>
                      <code>{result.subscriber.connection?.macAddress || 'AA:BB:CC:DD:EE'}</code>
                    </div>
                    <div className="tech-item">
                      <span>Connection Date:</span>
                      <strong>{formatDate(result.subscriber.connectionDate)}</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 4. WiFi Packages Showcase Section */}
      <section className="packages-showcase-section" id="packages-section">
        <div className="section-header-center">
          <div className="section-pill">
            <Zap size={14} />
            <span>High-Speed Fiber Internet</span>
          </div>
          <h2 className="section-title">{t('popularPackages')}</h2>
          <p className="section-subtitle">{t('choosePackageSubtitle')}</p>
        </div>

        <div className="packages-grid-container">
          {packages.length > 0 ? (
            packages.map((pkg) => (
              <div key={pkg.id} className="pkg-card">
                <div className="pkg-speed-badge">
                  <Zap size={16} />
                  <span>{pkg.speedMbps} Mbps</span>
                </div>
                <h3 className="pkg-name">{pkg.name}</h3>
                <div className="pkg-price-box">
                  <span className="pkg-price-currency">৳</span>
                  <span className="pkg-price-val">{pkg.priceBDT}</span>
                  <span className="pkg-price-period">/ month</span>
                </div>

                <p className="pkg-desc">{pkg.description || 'Buffer-free streaming and online gaming.'}</p>

                <ul className="pkg-features">
                  <li>
                    <Check size={16} className="text-emerald-400" />
                    <span>100% Fiber Optical Network</span>
                  </li>
                  <li>
                    <Check size={16} className="text-emerald-400" />
                    <span>Unlimited Download & Upload</span>
                  </li>
                  <li>
                    <Check size={16} className="text-emerald-400" />
                    <span>24/7 Dedicated Support</span>
                  </li>
                  <li>
                    <Check size={16} className="text-emerald-400" />
                    <span>Instant bKash/Nagad Auto Payment</span>
                  </li>
                </ul>

                <button
                  type="button"
                  onClick={() => {
                    // Pre-fill search if available or open payment modal
                    if (result?.subscriber) {
                      handleOpenPayment();
                    } else {
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                      showToast('Please enter your mobile number above to pay or renew.', 'warning');
                    }
                  }}
                  className="btn-pkg-subscribe"
                >
                  <span>{t('payAndSubscribe')}</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            ))
          ) : (
            <div className="empty-packages-state">
              <Zap size={32} />
              <p>Loading package details...</p>
            </div>
          )}
        </div>
      </section>

      {/* 5. Live Network Health & Features */}
      <section className="network-health-bar" id="network-status">
        <div className="network-health-inner">
          <div className="health-stat">
            <div className="health-icon green">
              <ShieldCheck size={24} />
            </div>
            <div>
              <div className="health-val">99.98%</div>
              <div className="health-lbl">Uptime Reliability</div>
            </div>
          </div>

          <div className="health-stat">
            <div className="health-icon blue">
              <Server size={24} />
            </div>
            <div>
              <div className="health-val">&lt; 3 ms</div>
              <div className="health-lbl">Fiber Ping Latency</div>
            </div>
          </div>

          <div className="health-stat">
            <div className="health-icon amber">
              <Sparkles size={24} />
            </div>
            <div>
              <div className="health-val">Instant</div>
              <div className="health-lbl">Auto Reconnection</div>
            </div>
          </div>

          <div className="health-stat">
            <div className="health-icon purple">
              <Headphones size={24} />
            </div>
            <div>
              <div className="health-val">24/7</div>
              <div className="health-lbl">NOC Support Team</div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Public Footer */}
      <footer className="public-footer">
        <div className="public-footer-inner">
          <div className="footer-col brand-col">
            <div className="public-brand">
              <div className="brand-icon-box">
                <Wifi size={22} className="text-white" />
              </div>
              <span className="brand-title">{t('appName')} Broadband</span>
            </div>
            <p className="footer-desc">
              Premier high-speed fiber internet provider delivering reliable, ultra-fast broadband connectivity and seamless self-service bill payments.
            </p>
            <div className="hotline-box">
              <Phone size={16} />
              <span>{t('helplineText')} <strong>+880 1700-000000</strong></span>
            </div>
          </div>

          <div className="footer-col">
            <h4>Quick Links</h4>
            <ul className="footer-links">
              <li><a href="#status-search">Check Bill Status</a></li>
              <li><a href="#packages-section">Fiber Packages</a></li>
              <li><a href="#network-status">Network Status</a></li>
              <li><Link href="/dashboard">ISP Management Dashboard</Link></li>
            </ul>
          </div>

          <div className="footer-col">
            <h4>Supported Gateways</h4>
            <div className="gateway-tags">
              <span className="gw-tag bkash">bKash</span>
              <span className="gw-tag nagad">Nagad</span>
              <span className="gw-tag rocket">Rocket</span>
              <span className="gw-tag bank">Bank</span>
              <span className="gw-tag cash">Cash</span>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} {t('appName')} Telecom Limited. All rights reserved.</p>
        </div>
      </footer>

      {/* 7. Payment Modal Instance */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        subscriber={selectedSubForPayment}
        subscribersList={allSubscribersList}
        onPaymentSuccess={handlePaymentSuccess}
      />
    </div>
  );
}
