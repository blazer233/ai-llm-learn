import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const DEFAULT_USER_ID = 'default-user';

  // 检查默认用户是否存在
  const existingUser = await prisma.user.findUnique({
    where: { id: DEFAULT_USER_ID },
  });

  if (!existingUser) {
    // 创建默认用户
    await prisma.user.create({
      data: {
        id: DEFAULT_USER_ID,
        email: 'default@example.com',
        username: '默认用户',
        password: 'not-used', // 不需要真实密码，因为没有认证
      },
    });
    console.log('✅ 默认用户创建成功');
  } else {
    console.log('ℹ️  默认用户已存在');
  }
}

main()
  .catch((e) => {
    console.error('❌ 初始化失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
