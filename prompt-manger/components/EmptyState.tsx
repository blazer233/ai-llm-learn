import { Card } from 'tdesign-react';
import { ReactNode } from 'react';

interface EmptyStateProps {
  icon: ReactNode;
  message: string;
}

/**
 * 空状态组件
 */
export default function EmptyState({ icon, message }: EmptyStateProps) {
  return (
    <Card>
      <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>{icon}</div>
        <p>{message}</p>
      </div>
    </Card>
  );
}
