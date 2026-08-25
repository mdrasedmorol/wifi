'use client';

import { useLanguage } from '@/lib/i18n/LanguageContext';

type StatusType = 'ACTIVE' | 'INACTIVE' | 'EXPIRED' | 'SUSPENDED';

const statusMap: Record<StatusType, { class: string; key: 'active' | 'inactive' | 'expired' | 'suspended' }> = {
  ACTIVE: { class: 'active', key: 'active' },
  INACTIVE: { class: 'inactive', key: 'inactive' },
  EXPIRED: { class: 'expired', key: 'expired' },
  SUSPENDED: { class: 'suspended', key: 'suspended' },
};

interface StatusBadgeProps {
  status: StatusType;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const { t } = useLanguage();
  const config = statusMap[status] || statusMap.INACTIVE;

  return (
    <span className={`status-badge ${config.class}`}>
      <span className="status-dot" />
      {t(config.key)}
    </span>
  );
}
