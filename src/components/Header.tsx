'use client';

import { useLanguage } from '@/lib/i18n/LanguageContext';
import { Search, Globe, Menu } from 'lucide-react';

interface HeaderProps {
  title: string;
  onMenuToggle: () => void;
}

export default function Header({ title, onMenuToggle }: HeaderProps) {
  const { locale, toggleLocale, t } = useLanguage();

  return (
    <header className="header">
      <div className="header-left">
        <button className="mobile-menu-btn" onClick={onMenuToggle}>
          <Menu size={20} />
        </button>
        <h2 className="header-title">{title}</h2>
      </div>

      <div className="header-right">
        <div className="header-search">
          <Search />
          <input
            type="text"
            placeholder={t('searchSubscribers')}
            id="global-search"
          />
        </div>

        <button className="lang-toggle" onClick={toggleLocale} id="lang-toggle">
          <Globe size={16} />
          {locale === 'en' ? t('bangla') : t('english')}
        </button>
      </div>
    </header>
  );
}
