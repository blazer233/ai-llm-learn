'use client';

import { ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Layout, Menu } from 'tdesign-react';
import {
  FolderIcon,
  FileIcon,
} from 'tdesign-icons-react';

const { Header, Aside, Content } = Layout;

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();

  const menuItems = [
    {
      value: '/dashboard/scenes',
      label: '场景管理',
      icon: <FolderIcon />,
    },
    {
      value: '/dashboard/prompts',
      label: '提示词库',
      icon: <FileIcon />,
    },
  ];

  return (
    <Layout style={{ height: '100vh' }}>
      <Header style={{ 
        background: '#fff', 
        borderBottom: '1px solid #e7e7e7',
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#0052D9' }}>
          提示词管理平台
        </div>
      </Header>
      <Layout>
        <Aside style={{ background: '#fff', borderRight: '1px solid #e7e7e7' }}>
          <Menu
            value={pathname}
            onChange={(value) => router.push(value as string)}
            style={{ height: '100%' }}
          >
            {menuItems.map((item) => (
              <Menu.MenuItem key={item.value} value={item.value} icon={item.icon}>
                {item.label}
              </Menu.MenuItem>
            ))}
          </Menu>
        </Aside>
        <Content style={{ padding: '24px', overflowY: 'auto' }}>
          {children}
        </Content>
      </Layout>
    </Layout>
  );
}
