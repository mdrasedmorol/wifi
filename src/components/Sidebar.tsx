'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { logoutAction } from '@/app/actions/auth-actions';
import {
  LayoutDashboard,
  Users,
  Package,
  CreditCard,
  Calendar,
  Settings,
  Wifi,
  LogOut,
} from 'lucide-react';

const navItems = [
  { key: 'dashboard' as const, href: '/dashboard', icon: LayoutDashboard },
  { key: 'subscribers' as const, href: '/subscribers', icon: Users },
  { key: 'packages' as const, href: '/packages', icon: Package },
  { key: 'billing' as const, href: '/billing', icon: CreditCard },
  { key: 'billingCalendar' as const, href: '/billing/calendar', icon: Calendar },
  { key: 'settings' as const, href: '/settings', icon: Settings },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useLanguage();

  const [systemSettings, setSystemSettings] = useState<{
    panelName?: string;
    logoUrl?: string;
    notes?: string;
  }>({});

  useEffect(() => {
    async function loadSettings() {
      try {
        const { getSystemSettings } = await import('@/app/actions/settings-actions');
        const settings = await getSystemSettings();
        if (settings) {
          setSystemSettings(settings);
        }
      } catch {
        // ignore fallback
      }
    }
    loadSettings();
  }, []);

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard' || pathname === '/';
    return pathname.startsWith(href);
  };

  const handleLogout = async () => {
    await logoutAction();
    router.push('/login');
    router.refresh();
  };

  return (
    <>
      <div
        className={`sidebar-overlay ${isOpen ? 'visible' : ''}`}
        onClick={onClose}
      />
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon" style={systemSettings.logoUrl ? { overflow: 'hidden', padding: 0, background: 'transparent' } : {}}>
            {systemSettings.logoUrl ? (
              <img src={systemSettings.logoUrl} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            ) : (
              <Wifi size={22} />
            )}
          </div>
          <div className="sidebar-brand-text">
            <h1>{systemSettings.panelName || t('appName')}</h1>
            <p>{systemSettings.notes || t('appTagline')}</p>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              className={`sidebar-nav-item ${isActive(item.href) ? 'active' : ''}`}
              onClick={onClose}
            >
              <item.icon />
              <span>{t(item.key)}</span>
            </Link>
          ))}
        </nav>

        <div className="sidebar-footer" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Link
            href="/"
            className="btn btn-secondary btn-sm"
            style={{ width: '100%', justifyContent: 'center', fontSize: 12, padding: '8px 12px' }}
          >
            🌐 Customer Home Page
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="sidebar-logout-btn"
          >
            <LogOut size={16} />
            <span>Logout</span>
          </button>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center' }}>
            NetManager v1.0
          </div>
        </div>
      </aside>
    </>
  );
}
