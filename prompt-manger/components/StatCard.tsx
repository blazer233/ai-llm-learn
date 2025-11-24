import { Card } from 'tdesign-react';
import { ReactNode } from 'react';

interface StatCardProps {
  icon: ReactNode;
  value: number | string;
  label: string;
  iconColor?: string;
}

/**
 * 统计卡片组件
 */
export default function StatCard({ icon, value, label, iconColor = '#0052D9' }: StatCardProps) {
  return (
    <Card bordered style={{ textAlign: 'center', padding: '16px 12px' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
        }}
      >
        <div
          style={{
            color: iconColor,
            fontSize: '28px',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          {icon}
        </div>
        <div style={{ textAlign: 'left' }}>
          <div style={{ fontSize: '20px', fontWeight: 'bold', lineHeight: '1.2' }}>
            {value}
          </div>
          <div style={{ color: '#666', fontSize: '12px', marginTop: '2px' }}>
            {label}
          </div>
        </div>
      </div>
    </Card>
  );
}
