import { Typography } from 'tdesign-react';
import { TodoList } from './TodoList.js';

const { Title } = Typography;

export default function Page() {
  return (
    <>
      <Title level="h2" style={{ marginBottom: '24px', color: '#0052D9' }}>
        我的待办事项
      </Title>
      <TodoList />
    </>
  );
}
