import { usePageContext } from 'vike-react/usePageContext';
import { Result, Button } from 'tdesign-react';
import { ErrorCircleIcon, HomeIcon } from 'tdesign-icons-react';
import 'tdesign-react/dist/tdesign.css';

export default function Page() {
  const { is404 } = usePageContext();

  if (is404) {
    return (
      <Result
        icon={<ErrorCircleIcon size="80px" style={{ color: '#E34D59' }} />}
        title="404 - 页面未找到"
        description="抱歉,您访问的页面不存在"
        extra={
          <Button theme="primary" onClick={() => (window.location.href = '/')}>
            <HomeIcon style={{ marginRight: '8px' }} />
            返回首页
          </Button>
        }
      />
    );
  }

  return (
    <Result
      icon={<ErrorCircleIcon size="80px" style={{ color: '#E34D59' }} />}
      title="系统错误"
      description="抱歉,服务器出现了一些问题,请稍后再试"
      extra={
        <Button theme="primary" onClick={() => (window.location.href = '/')}>
          <HomeIcon style={{ marginRight: '8px' }} />
          返回首页
        </Button>
      }
    />
  );
}
