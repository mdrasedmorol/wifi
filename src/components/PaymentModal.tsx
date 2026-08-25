'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  ArrowLeft,
  Copy,
  Check,
  Headphones,
  Phone,
  Wallet,
  CreditCard,
  Building,
  Smartphone,
  Sparkles,
  ShieldCheck,
  Clock,
  CheckCircle,
} from 'lucide-react';
import { createPayment } from '@/app/actions/payment-actions';
import { useToast } from '@/components/ToastProvider';
import { useLanguage } from '@/lib/i18n/LanguageContext';

export interface SubscriberOption {
  id: string;
  name: string;
  phone: string;
  package?: { priceBDT: number; name?: string };
}

export interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  subscriber?: SubscriberOption | null;
  subscribersList?: SubscriberOption[];
  defaultMonth?: number;
  defaultYear?: number;
  onPaymentSuccess?: () => void;
}

const WhatsAppIcon = ({ size = 18, className = '' }: { size?: number; className?: string }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.513 2.262 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.713-1.455L0 24zm11.362-3.53c3.487 0 6.311-2.813 6.316-6.283.006-3.469-2.81-6.286-6.297-6.287-3.487 0-6.314 2.813-6.319 6.283-.005 3.471 2.81 6.289 6.3 6.287zm3.174-7.427c-.173-.087-1.026-.507-1.185-.565-.159-.058-.275-.087-.39.087-.116.174-.45.565-.55.68-.1.116-.203.13-.377.043-.174-.087-.735-.271-1.398-.863-.515-.46-.863-.102-1.02-.388-.158-.285-.015-.44.128-.577.13-.124.275-.32.413-.478.137-.159.184-.271.275-.453.092-.182.046-.341-.02-.478-.068-.137-.565-1.362-.773-1.862-.203-.488-.41-.422-.564-.43-.145-.007-.31-.008-.475-.008-.166 0-.435.062-.663.31-.228.249-.87.85-.87 2.072 0 1.222.89 2.405.99 2.539.1.134 1.75 2.673 4.241 3.746.592.255 1.055.407 1.416.521.596.19 1.138.163 1.567.099.478-.071 1.472-.601 1.68-1.182.207-.581.207-1.08.145-1.182-.062-.103-.228-.162-.403-.249z" />
  </svg>
);

const ConfettiParticles = () => {
  const colors = ['#8600FF', '#DA00FF', '#3B82F6', '#10B981', '#F59E0B', '#EF4444'];
  const particles = Array.from({ length: 30 }).map((_, i) => {
    const angle = Math.random() * 360;
    const rad = (angle * Math.PI) / 180;
    const distance = 40 + Math.random() * 110;
    return {
      id: i,
      x: Math.cos(rad) * distance,
      y: Math.sin(rad) * distance - 40,
      color: colors[Math.floor(Math.random() * colors.length)],
      delay: Math.random() * 0.15,
      size: 6 + Math.random() * 6,
    };
  });

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-50">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-sm animate-confetti-pop"
          style={{
            backgroundColor: p.color,
            width: p.size,
            height: p.size,
            left: '50%',
            top: '40%',
            transform: `translate(${p.x}px, ${p.y}px)`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
    </div>
  );
};

export default function PaymentModal({
  isOpen,
  onClose,
  subscriber,
  subscribersList = [],
  defaultMonth,
  defaultYear,
  onPaymentSuccess,
}: PaymentModalProps) {
  const { t } = useLanguage();
  const { showToast } = useToast();

  const now = new Date();
  const targetMonth = defaultMonth || now.getMonth() + 1;
  const targetYear = defaultYear || now.getFullYear();

  const [selectedSubId, setSelectedSubId] = useState<string>(subscriber?.id || '');
  const [amount, setAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'BKASH' | 'NAGAD' | 'ROCKET' | 'CASH' | 'BANK' | 'OTHER'>('BKASH');
  const [paymentId, setPaymentId] = useState<string>('');
  const [note, setNote] = useState<string>('');

  const [paymentStep, setPaymentStep] = useState<1 | 2 | 3 | 4>(1);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [verificationMessageIndex, setVerificationMessageIndex] = useState(0);
  const [showDetails, setShowDetails] = useState(false);

  // Sync selected subscriber or default values when modal opens
  useEffect(() => {
    if (isOpen) {
      const activeSub = subscriber || (selectedSubId ? subscribersList.find((s) => s.id === selectedSubId) : null);
      if (activeSub) {
        setSelectedSubId(activeSub.id);
        if (activeSub.package?.priceBDT) {
          setAmount(String(activeSub.package.priceBDT));
        }
      } else if (subscribersList.length > 0 && !selectedSubId) {
        setSelectedSubId(subscribersList[0].id);
        if (subscribersList[0].package?.priceBDT) {
          setAmount(String(subscribersList[0].package.priceBDT));
        }
      }
      setPaymentStep(1);
      setPaymentId('');
      setNote('');
      setVerifying(false);
    }
  }, [isOpen, subscriber, subscribersList]);

  // Handle selected subscriber change
  const handleSelectSubscriber = (id: string) => {
    setSelectedSubId(id);
    const sub = subscribersList.find((s) => s.id === id);
    if (sub?.package?.priceBDT) {
      setAmount(String(sub.package.priceBDT));
    }
  };

  const activeSubscriber = subscriber || subscribersList.find((s) => s.id === selectedSubId);

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const gatewayConfigs = {
    BKASH: {
      id: 'BKASH',
      name: 'bKash',
      nameBengali: 'বিকাশ',
      color: '#df146e',
      hoverColor: '#c2105e',
      lightBg: '#fef1f6',
      accountNumber: '01700000000',
      holderName: 'NetManager WiFi Gateway',
      instructions: [
        '*247# ডায়াল করে আপনার BKASH মোবাইল মেনুতে যান অথবা BKASH অ্যাপে যান।',
        '"Send Money" -এ ক্লিক করুন।',
        'প্রাপক নম্বর হিসেবে এই নম্বরটি লিখুন: {accountNumber}',
        'টাকার পরিমাণ: {amount} BDT',
        'নিশ্চিত করতে আপনার BKASH পিন (PIN) লিখুন।',
        'BKASH থেকে প্রাপ্ত Transaction ID কপি করে নিচে VERIFY করুন।',
      ],
    },
    NAGAD: {
      id: 'NAGAD',
      name: 'Nagad',
      nameBengali: 'নগদ',
      color: '#e31c25',
      hoverColor: '#bd131a',
      lightBg: '#fff2f2',
      accountNumber: '01800000000',
      holderName: 'NetManager WiFi Gateway',
      instructions: [
        '*167# ডায়াল করে আপনার NAGAD মোবাইল মেনুতে যান অথবা অ্যাপে যান।',
        '"Send Money" -এ ক্লিক করুন।',
        'প্রাপক নম্বর: {accountNumber}',
        'পরিমাণ: {amount} BDT',
        'পিন দিয়ে নিশ্চিত করুন।',
        'SMS এ প্রাপ্ত Transaction ID নিচে লিখে VERIFY বাটনে চাপুন।',
      ],
    },
    ROCKET: {
      id: 'ROCKET',
      name: 'Rocket',
      nameBengali: 'রকেট',
      color: '#8c348d',
      hoverColor: '#712572',
      lightBg: '#fbf5fb',
      accountNumber: '01900000000',
      holderName: 'NetManager WiFi Gateway',
      instructions: [
        '*322# ডায়াল করে আপনার ROCKET মোবাইল মেনুতে যান অথবা অ্যাপে যান।',
        '"Send Money" -এ ক্লিক করুন।',
        'প্রাপক নম্বর: {accountNumber}',
        'পরিমাণ: {amount} BDT',
        'পিন দিয়ে নিশ্চিত করার পর Transaction ID সংগ্রহ করুন।',
      ],
    },
    CASH: {
      id: 'CASH',
      name: 'Cash',
      nameBengali: 'নগদ ক্যাশ',
      color: '#10b981',
      hoverColor: '#059669',
      lightBg: '#ecfdf5',
      accountNumber: 'Hand-to-Hand',
      holderName: 'Office Cashier',
      instructions: [
        'গ্রাহকের কাছ থেকে নগদ ক্যাশ টাকা গ্রহণ করুন।',
        'টাকার পরিমাণ সঠিক আছে কিনা নিশ্চিত করুন।',
        'রসিদ নম্বর বা নোট থাকলে নিচে উল্লেখ করুন।',
        'পেমেন্ট সংরক্ষণ করতে VERIFY এ ক্লিক করুন।',
      ],
    },
    BANK: {
      id: 'BANK',
      name: 'Bank Transfer',
      nameBengali: 'ব্যাংক ট্রান্সফার',
      color: '#3b82f6',
      hoverColor: '#2563eb',
      lightBg: '#eff6ff',
      accountNumber: '123-456-7890 (City Bank)',
      holderName: 'NetManager Telecom Ltd',
      instructions: [
        'ব্যাংক অ্যাপ বা অ্যাকাউন্টের মাধ্যমে ফান্ড ট্রান্সফার করুন।',
        'প্রাপক অ্যাকাউন্ট: 123-456-7890 (City Bank)',
        'রেফারেন্স আইডি বা রসিদ নং ট্রানজেকশন বক্সে লিখুন।',
      ],
    },
    OTHER: {
      id: 'OTHER',
      name: 'Other',
      nameBengali: 'অন্যান্য মাধ্যম',
      color: '#6366f1',
      hoverColor: '#4f46e5',
      lightBg: '#eef2ff',
      accountNumber: '01500000000',
      holderName: 'NetManager Admin',
      instructions: [
        'অন্যান্য পেমেন্ট গেটওয়ের মাধ্যমে অর্থ প্রদান করুন।',
        'প্রাপক নম্বর: {accountNumber}',
        'রেফারেন্স / ট্রানজেকশন নম্বর প্রবেশ করান।',
      ],
    },
  };

  const selectedGateway = gatewayConfigs[paymentMethod] || gatewayConfigs.BKASH;

  const verificationMessages = [
    'Matching transaction reference...',
    'Checking amount with billing system...',
    'Updating subscriber subscription...',
    'Finalizing payment record...',
  ];

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (verifying) {
      interval = setInterval(() => {
        setVerificationMessageIndex((prev) => (prev + 1) % verificationMessages.length);
      }, 1200);
    }
    return () => clearInterval(interval);
  }, [verifying]);

  const handleVerifySubmit = async () => {
    if (!selectedSubId) {
      showToast(t('selectSubscriber'), 'warning');
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      showToast(t('required'), 'warning');
      return;
    }

    if ((paymentMethod === 'BKASH' || paymentMethod === 'NAGAD' || paymentMethod === 'ROCKET') && !paymentId.trim()) {
      showToast('Please enter the Transaction ID / Ref before submitting.', 'warning');
      return;
    }

    setVerifying(true);
    setPaymentStep(3);

    try {
      // Simulate verification delay
      await new Promise((res) => setTimeout(res, 2200));

      await createPayment({
        subscriberId: selectedSubId,
        amount: parseFloat(amount),
        method: paymentMethod,
        month: targetMonth,
        year: targetYear,
        receiptNo: paymentId || undefined,
        note: note || undefined,
      });

      setVerifying(false);
      setPaymentStep(4);
      if (onPaymentSuccess) {
        onPaymentSuccess();
      }
    } catch {
      setVerifying(false);
      setPaymentStep(2);
      showToast(t('error'), 'error');
    }
  };

  if (!isOpen) return null;

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  return (
    <div className="modal-overlay" style={{ zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div
        className="modal-content payment-popup-container"
        style={{
          maxWidth: 440,
          width: '95%',
          padding: 0,
          borderRadius: 20,
          background: '#0d1322',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.7)',
          overflow: 'hidden',
          position: 'relative',
          color: '#e2e8f0',
        }}
      >
        {paymentStep === 4 && <ConfettiParticles />}

        {/* Top Header Bar */}
        <div
          style={{
            padding: '12px 16px',
            background: 'rgba(15, 23, 42, 0.95)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {paymentStep === 2 ? (
            <button
              type="button"
              onClick={() => setPaymentStep(1)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                fontSize: 13,
              }}
            >
              <ArrowLeft size={16} /> Back
            </button>
          ) : (
            <span style={{ fontSize: 13, fontWeight: 600, color: '#38bdf8', display: 'flex', alignItems: 'center', gap: 6 }}>
              <ShieldCheck size={16} /> WiFi Billing Center
            </span>
          )}

          <button
            type="button"
            onClick={onClose}
            disabled={verifying}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: 'none',
              borderRadius: 8,
              padding: 6,
              color: '#94a3b8',
              cursor: verifying ? 'not-allowed' : 'pointer',
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Body Content */}
        <div style={{ padding: '20px 20px 24px', maxHeight: '85vh', overflowY: 'auto' }}>
          {/* Brand & Subscriber Info Card */}
          <div style={{ textAlign: 'center', marginBottom: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #3b82f6, #06b6d4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: 18,
                  color: '#fff',
                  boxShadow: '0 0 15px rgba(59, 130, 246, 0.4)',
                }}
              >
                ⚡
              </div>
              <div style={{ textAlign: 'left' }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: '#f8fafc', margin: 0 }}>
                  {activeSubscriber?.name || 'WiFi Subscriber Billing'}
                </h3>
                <button
                  type="button"
                  onClick={() => setShowDetails(!showDetails)}
                  style={{
                    marginTop: 3,
                    padding: '2px 8px',
                    borderRadius: 12,
                    background: 'rgba(56, 189, 248, 0.12)',
                    border: '1px solid rgba(56, 189, 248, 0.25)',
                    color: '#38bdf8',
                    fontSize: 10,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {showDetails ? 'Hide Details ▲' : 'View Summary ▼'}
                </button>
              </div>
            </div>

            {/* Toggleable Details panel */}
            {showDetails && (
              <div
                style={{
                  marginTop: 12,
                  padding: 12,
                  borderRadius: 12,
                  background: 'rgba(15, 23, 42, 0.6)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  fontSize: 12,
                  textAlign: 'left',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94a3b8' }}>Subscriber:</span>
                  <span style={{ fontWeight: 600, color: '#f1f5f9' }}>{activeSubscriber?.name || 'N/A'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94a3b8' }}>Phone:</span>
                  <span style={{ fontWeight: 600, color: '#f1f5f9' }}>{activeSubscriber?.phone || 'N/A'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94a3b8' }}>Package:</span>
                  <span style={{ fontWeight: 600, color: '#38bdf8' }}>{activeSubscriber?.package?.name || 'Standard Package'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94a3b8' }}>Billing Month:</span>
                  <span style={{ fontWeight: 600, color: '#f1f5f9' }}>{monthNames[targetMonth - 1]} {targetYear}</span>
                </div>
              </div>
            )}
          </div>

          {/* STEP 1: Gateway Selection */}
          {paymentStep === 1 && (
            <div>
              {/* Subscriber Selector (if selecting subscriber in modal) */}
              {!subscriber && subscribersList.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#94a3b8', marginBottom: 6 }}>
                    SELECT SUBSCRIBER *
                  </label>
                  <select
                    className="form-select"
                    value={selectedSubId}
                    onChange={(e) => handleSelectSubscriber(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 12,
                      background: 'rgba(30, 41, 59, 0.7)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: '#f8fafc',
                      fontSize: 13,
                    }}
                  >
                    {subscribersList.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} — {s.phone} (৳{s.package?.priceBDT || 0})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Amount Input */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#94a3b8', marginBottom: 6 }}>
                  PAYMENT AMOUNT (BDT) *
                </label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 12, top: 10, color: '#38bdf8', fontWeight: 700 }}>৳</span>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="500"
                    style={{
                      width: '100%',
                      padding: '10px 12px 10px 32px',
                      borderRadius: 12,
                      background: 'rgba(30, 41, 59, 0.7)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: '#f8fafc',
                      fontSize: 15,
                      fontWeight: 700,
                    }}
                  />
                </div>
              </div>

              {/* Support Channels Banner */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginBottom: 16 }}>
                <button
                  type="button"
                  onClick={() => window.open('https://t.me', '_blank')}
                  title="Telegram Support"
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 12,
                    background: 'rgba(30, 41, 59, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    color: '#0081c9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                  }}
                >
                  <Headphones size={18} />
                </button>
                <button
                  type="button"
                  onClick={() => window.open('https://wa.me', '_blank')}
                  title="WhatsApp Support"
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 12,
                    background: 'rgba(30, 41, 59, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    color: '#25D366',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                  }}
                >
                  <WhatsAppIcon size={18} />
                </button>
                <button
                  type="button"
                  onClick={() => window.open('tel:+8801700000000')}
                  title="Phone Hotline"
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 12,
                    background: 'rgba(30, 41, 59, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    color: '#38bdf8',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                  }}
                >
                  <Phone size={18} />
                </button>
              </div>

              {/* Title Banner */}
              <div
                style={{
                  background: 'linear-gradient(90deg, #0284c7, #06b6d4)',
                  color: '#fff',
                  textAlign: 'center',
                  padding: '8px 12px',
                  borderRadius: 10,
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: 0.5,
                  textTransform: 'uppercase',
                  marginBottom: 14,
                }}
              >
                SELECT PAYMENT METHOD
              </div>

              {/* Gateway Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 18 }}>
                {(Object.keys(gatewayConfigs) as Array<keyof typeof gatewayConfigs>).map((key) => {
                  const gw = gatewayConfigs[key];
                  const isSelected = paymentMethod === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setPaymentMethod(key)}
                      style={{
                        padding: '14px 10px',
                        borderRadius: 14,
                        border: isSelected ? `2px solid ${gw.color}` : '1px solid rgba(255, 255, 255, 0.08)',
                        background: isSelected ? 'rgba(15, 23, 42, 0.9)' : 'rgba(30, 41, 59, 0.5)',
                        boxShadow: isSelected ? `0 0 12px ${gw.color}40` : 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <span style={{ fontSize: 13, fontWeight: 700, color: isSelected ? gw.color : '#f1f5f9' }}>
                        {gw.nameBengali} ({gw.name})
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Continue Button */}
              <button
                type="button"
                onClick={() => setPaymentStep(2)}
                disabled={!selectedSubId || !amount}
                style={{
                  width: '100%',
                  background: 'linear-gradient(135deg, #8600FF, #DA00FF)',
                  color: '#fff',
                  fontWeight: 700,
                  padding: '13px',
                  borderRadius: 14,
                  border: 'none',
                  fontSize: 13,
                  cursor: !selectedSubId || !amount ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 15px rgba(218, 0, 255, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                }}
              >
                <Wallet size={16} /> Proceed to Pay ৳{amount || '0'} BDT
              </button>
            </div>
          )}

          {/* STEP 2: Instructions and TXID Input */}
          {paymentStep === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Selected Gateway Summary Header */}
              <div
                style={{
                  background: 'rgba(15, 23, 42, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: 14,
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <span style={{ fontSize: 11, color: '#94a3b8' }}>GATEWAY</span>
                  <div style={{ fontSize: 15, fontWeight: 800, color: selectedGateway.color }}>
                    {selectedGateway.nameBengali} ({selectedGateway.name})
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: 11, color: '#94a3b8' }}>AMOUNT</span>
                  <div style={{ fontSize: 16, fontWeight: 800, color: '#f8fafc' }}>
                    ৳ {parseFloat(amount || '0').toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Warning Banner */}
              <div
                style={{
                  background: 'rgba(245, 158, 11, 0.1)',
                  border: '1px solid rgba(245, 158, 11, 0.25)',
                  color: '#fbbf24',
                  padding: '8px 12px',
                  borderRadius: 10,
                  fontSize: 11,
                  textAlign: 'center',
                  fontWeight: 600,
                }}
              >
                নোটঃ টাকা পাঠানোর ৫-১০ সেকেন্ড পর ভেরিফাই করবেন।
              </div>

              {/* Colored Gateway Instructions Card */}
              <div
                style={{
                  backgroundColor: selectedGateway.color,
                  borderRadius: 16,
                  padding: 16,
                  color: '#fff',
                  boxShadow: '0 8px 25px rgba(0, 0, 0, 0.3)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                }}
              >
                <h4 style={{ textAlign: 'center', fontSize: 12, fontWeight: 800, letterSpacing: 0.5, margin: 0, textTransform: 'uppercase' }}>
                  ট্রানজেকশন আইডি / রসিদ দিন
                </h4>

                {/* TXID Input */}
                <input
                  type="text"
                  value={paymentId}
                  onChange={(e) => setPaymentId(e.target.value)}
                  placeholder="ট্রানজেকশন আইডি দিন (e.g. TXN98765432)"
                  style={{
                    width: '100%',
                    background: '#ffffff',
                    color: '#0f172a',
                    textAlign: 'center',
                    fontWeight: 700,
                    padding: '11px 14px',
                    borderRadius: 12,
                    border: 'none',
                    fontSize: 13,
                    outline: 'none',
                  }}
                />

                {/* Account Details Box */}
                <div
                  style={{
                    background: 'rgba(255, 255, 255, 0.12)',
                    borderRadius: 12,
                    padding: 12,
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12 }}>
                    <span style={{ opacity: 0.9 }}>Account Number:</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: 14 }}>
                        {selectedGateway.accountNumber}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopy(selectedGateway.accountNumber, 'acc_num')}
                        style={{
                          background: '#0f172a',
                          color: '#fff',
                          border: 'none',
                          padding: '3px 8px',
                          borderRadius: 6,
                          fontSize: 10,
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        {copiedField === 'acc_num' ? <span style={{ color: '#fde047' }}>Copied!</span> : 'Copy'}
                      </button>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12, borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: 6 }}>
                    <span style={{ opacity: 0.9 }}>Holder Name:</span>
                    <span style={{ fontWeight: 700 }}>{selectedGateway.holderName}</span>
                  </div>
                </div>

                {/* Optional Note Field */}
                <div>
                  <input
                    type="text"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="ঐচ্ছিক নোট / মন্তব্য (Optional Note)"
                    style={{
                      width: '100%',
                      background: 'rgba(255, 255, 255, 0.15)',
                      color: '#ffffff',
                      padding: '8px 12px',
                      borderRadius: 10,
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      fontSize: 11,
                      outline: 'none',
                    }}
                  />
                </div>

                {/* Step-by-step Bengali instructions */}
                <div style={{ fontSize: 11, display: 'flex', flexDirection: 'column', gap: 6, opacity: 0.95 }}>
                  {selectedGateway.instructions.map((stepText, idx) => {
                    let formatted = stepText
                      .replace('{accountNumber}', selectedGateway.accountNumber)
                      .replace('{amount}', amount || '0');

                    return (
                      <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 6, lineHeight: '1.4' }}>
                        <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#fff', marginTop: 5, flexShrink: 0 }} />
                        <span>{formatted}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Submit Verification Button */}
              <button
                type="button"
                onClick={handleVerifySubmit}
                style={{
                  width: '100%',
                  backgroundColor: selectedGateway.color,
                  color: '#fff',
                  fontWeight: 800,
                  padding: '13px',
                  borderRadius: 14,
                  border: 'none',
                  fontSize: 13,
                  letterSpacing: 0.5,
                  cursor: 'pointer',
                  boxShadow: `0 4px 15px ${selectedGateway.color}50`,
                }}
              >
                VERIFY TRANSACTION
              </button>
            </div>
          )}

          {/* STEP 3: Radar Verification Loading */}
          {paymentStep === 3 && (
            <div style={{ textAlign: 'center', padding: '30px 10px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ position: 'relative', width: 80, height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                {/* Concentric radar pulses */}
                <div
                  className="animate-ping"
                  style={{
                    position: 'absolute',
                    inset: 0,
                    borderRadius: '50%',
                    background: 'rgba(59, 130, 246, 0.2)',
                    border: '1px solid rgba(59, 130, 246, 0.4)',
                  }}
                />
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    border: '4px solid rgba(255, 255, 255, 0.1)',
                    borderTopColor: '#38bdf8',
                    animation: 'spin 1s linear infinite',
                  }}
                />
              </div>

              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#f8fafc', marginBottom: 8 }}>
                Verifying Payment...
              </h3>
              <p style={{ fontSize: 12, color: '#38bdf8', height: 20, margin: 0, fontWeight: 600 }}>
                {verificationMessages[verificationMessageIndex]}
              </p>
              <p style={{ fontSize: 10, color: '#64748b', marginTop: 12 }}>
                Please do not close this modal while processing.
              </p>
            </div>
          )}

          {/* STEP 4: Success & Confirmation */}
          {paymentStep === 4 && (
            <div style={{ textAlign: 'center', padding: '16px 10px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
              {/* Checkmark SVG */}
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: '50%',
                  background: 'rgba(34, 197, 94, 0.15)',
                  border: '2px solid #22c55e',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#22c55e',
                }}
              >
                <Check size={36} strokeWidth={3} />
              </div>

              <div>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: '#f8fafc', margin: 0 }}>
                  Payment Confirmed!
                </h3>
                <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 6, lineHeight: '1.5' }}>
                  Thank you! The payment has been verified and recorded successfully for <strong>{activeSubscriber?.name}</strong>.
                </p>
              </div>

              {/* Receipt Card Summary */}
              <div
                style={{
                  width: '100%',
                  background: 'rgba(15, 23, 42, 0.8)',
                  border: '1px solid rgba(34, 197, 94, 0.25)',
                  borderRadius: 14,
                  padding: 14,
                  fontSize: 12,
                  textAlign: 'left',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94a3b8' }}>Amount Paid:</span>
                  <span style={{ fontWeight: 800, color: '#22c55e', fontSize: 14 }}>৳{parseFloat(amount || '0').toLocaleString()} BDT</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94a3b8' }}>Payment Method:</span>
                  <span style={{ fontWeight: 600, color: '#f1f5f9' }}>{selectedGateway.nameBengali} ({paymentMethod})</span>
                </div>
                {paymentId && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#94a3b8' }}>TXID / Ref:</span>
                    <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#38bdf8' }}>{paymentId}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94a3b8' }}>Billing Period:</span>
                  <span style={{ fontWeight: 600, color: '#f1f5f9' }}>{monthNames[targetMonth - 1]} {targetYear}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                style={{
                  width: '100%',
                  background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                  color: '#fff',
                  fontWeight: 700,
                  padding: '12px',
                  borderRadius: 14,
                  border: 'none',
                  fontSize: 13,
                  cursor: 'pointer',
                  boxShadow: '0 4px 15px rgba(34, 197, 94, 0.3)',
                }}
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
        @keyframes confetti-pop {
          0% {
            opacity: 1;
            transform: scale(0) translate(0, 0);
          }
          50% {
            opacity: 1;
            transform: scale(1.2) translate(var(--x, 0), var(--y, 0));
          }
          100% {
            opacity: 0;
            transform: scale(0.8) translate(var(--x, 0), calc(var(--y, 0) + 60px));
          }
        }
      `}</style>
    </div>
  );
}
