import { usePageContext } from 'vike-react/usePageContext';
import { Button } from 'tdesign-react';
import { ErrorCircleIcon, HomeIcon } from 'tdesign-icons-react';
import 'tdesign-react/dist/tdesign.css';

export default function Page() {
  const { is404 } = usePageContext();

  if (is404) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          textAlign: 'center',
        }}
      >
        <ErrorCircleIcon size="80px" style={{ color: '#E34D59', marginBottom: '24px' }} />
        <h1 style={{ fontSize: '24px', marginBottom: '16px' }}>404 - 页面未找到</h1>
        <p style={{ color: '#666', marginBottom: '32px' }}>抱歉,您访问的页面不存在</p>
        <Button theme="primary" onClick={() => (window.location.href = '/')}>
          <HomeIcon style={{ marginRight: '8px' }} />
          返回首页
        </Button>
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        textAlign: 'center',
      }}
    >
      <ErrorCircleIcon size="80px" style={{ color: '#E34D59', marginBottom: '24px' }} />
      <h1 style={{ fontSize: '24px', marginBottom: '16px' }}>系统错误</h1>
      <p style={{ color: '#666', marginBottom: '32px' }}>抱歉,服务器出现了一些问题,请稍后再试</p>
      <Button theme="primary" onClick={() => (window.location.href = '/')}>
        <HomeIcon style={{ marginRight: '8px' }} />
        返回首页
      </Button>
    </div>
  );
}
