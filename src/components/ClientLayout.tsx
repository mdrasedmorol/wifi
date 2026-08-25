'use client';

import { ReactNode, useState } from 'react';
import { usePathname } from 'next/navigation';
import { LanguageProvider, useLanguage } from '@/lib/i18n/LanguageContext';
import { ToastProvider } from '@/components/ToastProvider';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';

function AppShell({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const { t } = useLanguage();

  const getTitle = () => {
    if (pathname === '/dashboard') return t('dashboard');
    if (pathname.startsWith('/subscribers')) return t('subscribers');
    if (pathname.startsWith('/packages')) return t('packages');
    if (pathname.startsWith('/billing')) return t('billing');
    if (pathname.startsWith('/settings')) return t('settings');
    return t('appName');
  };

  const isPublicRoute = pathname === '/';

  if (isPublicRoute) {
    return <div className="public-layout-container">{children}</div>;
  }

  return (
    <div className="app-layout">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="main-content">
        <Header
          title={getTitle()}
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
        />
        <div className="page-content">{children}</div>
      </main>
    </div>
  );
}

export default function ClientLayout({ children }: { children: ReactNode }) {
  return (
    <LanguageProvider>
      <ToastProvider>
        <AppShell>{children}</AppShell>
      </ToastProvider>
    </LanguageProvider>
  );
}
