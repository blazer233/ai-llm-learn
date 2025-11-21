import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// 默认用户 ID（因为移除了认证系统）
const DEFAULT_USER_ID = 'default-user';

export async function GET() {
  try {
    const scenes = await prisma.scene.findMany({
      where: { userId: DEFAULT_USER_ID },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { prompts: true },
        },
      },
    });

    return NextResponse.json({ scenes });
  } catch (error) {
    console.error('Get scenes error:', error);
    return NextResponse.json(
      { error: '获取场景列表失败' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { name, description, color, icon } = await request.json();

    if (!name) {
      return NextResponse.json(
        { error: '场景名称不能为空' },
        { status: 400 }
      );
    }

    const scene = await prisma.scene.create({
      data: {
        name,
        description,
        color,
        icon,
        userId: DEFAULT_USER_ID,
      },
    });

    return NextResponse.json({ scene }, { status: 201 });
  } catch (error) {
    console.error('Create scene error:', error);
    return NextResponse.json(
      { error: '创建场景失败' },
      { status: 500 }
    );
  }
}
