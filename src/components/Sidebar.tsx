'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import {
  LayoutDashboard,
  Users,
  Package,
  CreditCard,
  Settings,
  Wifi,
} from 'lucide-react';

const navItems = [
  { key: 'dashboard' as const, href: '/dashboard', icon: LayoutDashboard },
  { key: 'subscribers' as const, href: '/subscribers', icon: Users },
  { key: 'packages' as const, href: '/packages', icon: Package },
  { key: 'billing' as const, href: '/billing', icon: CreditCard },
  { key: 'settings' as const, href: '/settings', icon: Settings },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { t } = useLanguage();

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard' || pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <>
      <div
        className={`sidebar-overlay ${isOpen ? 'visible' : ''}`}
        onClick={onClose}
      />
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon">
            <Wifi size={22} />
          </div>
          <div className="sidebar-brand-text">
            <h1>{t('appName')}</h1>
            <p>{t('appTagline')}</p>
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
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center' }}>
            NetManager v1.0
          </div>
        </div>
      </aside>
    </>
  );
}
