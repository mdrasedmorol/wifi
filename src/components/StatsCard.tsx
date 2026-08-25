import { ReactNode } from 'react';

interface StatsCardProps {
  icon: ReactNode;
  label: string;
  value: string | number;
  trend?: { value: string; direction: 'up' | 'down' };
  color: 'blue' | 'green' | 'red' | 'cyan';
}

export default function StatsCard({ icon, label, value, trend, color }: StatsCardProps) {
  return (
    <div className="stat-card">
      <div className="stat-card-header">
        <span className="stat-card-label">{label}</span>
        <div className={`stat-card-icon ${color}`}>{icon}</div>
      </div>
      <div className="stat-card-value">{value}</div>
      {trend && (
        <span className={`stat-card-trend ${trend.direction}`}>
          {trend.direction === 'up' ? '↑' : '↓'} {trend.value}
        </span>
      )}
    </div>
  );
}
