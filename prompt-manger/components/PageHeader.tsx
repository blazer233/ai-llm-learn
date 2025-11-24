import { Button } from 'tdesign-react';
import { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  action?: {
    label: string;
    icon?: ReactNode;
    onClick: () => void;
  };
}

/**
 * 页面头部组件
 */
export default function PageHeader({ title, action }: PageHeaderProps) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px',
      }}
    >
      <h1 style={{ fontSize: '24px', fontWeight: 'bold' }}>{title}</h1>
      {action && (
        <Button theme="primary" icon={action.icon} onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}
