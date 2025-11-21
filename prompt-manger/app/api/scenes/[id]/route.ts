import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const DEFAULT_USER_ID = 'default-user';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const scene = await prisma.scene.findFirst({
      where: {
        id,
        userId: DEFAULT_USER_ID,
      },
      include: {
        prompts: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!scene) {
      return NextResponse.json({ error: '场景不存在' }, { status: 404 });
    }

    return NextResponse.json({ scene });
  } catch (error) {
    console.error('Get scene error:', error);
    return NextResponse.json(
      { error: '获取场景失败' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { name, description, color, icon } = await request.json();

    const scene = await prisma.scene.updateMany({
      where: {
        id,
        userId: DEFAULT_USER_ID,
      },
      data: {
        name,
        description,
        color,
        icon,
      },
    });

    if (scene.count === 0) {
      return NextResponse.json({ error: '场景不存在' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update scene error:', error);
    return NextResponse.json(
      { error: '更新场景失败' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await prisma.scene.deleteMany({
      where: {
        id,
        userId: DEFAULT_USER_ID,
      },
    });

    if (result.count === 0) {
      return NextResponse.json({ error: '场景不存在' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete scene error:', error);
    return NextResponse.json(
      { error: '删除场景失败' },
      { status: 500 }
    );
  }
}
