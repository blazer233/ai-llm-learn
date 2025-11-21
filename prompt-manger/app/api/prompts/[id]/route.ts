import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const DEFAULT_USER_ID = 'default-user';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const prompt = await prisma.prompt.findFirst({
      where: {
        id,
        userId: DEFAULT_USER_ID,
      },
      include: {
        scene: true,
        testRecords: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!prompt) {
      return NextResponse.json({ error: '提示词不存在' }, { status: 404 });
    }

    // 解析 tags
    const promptWithTags = {
      ...prompt,
      tags: prompt.tags ? JSON.parse(prompt.tags) : [],
    };

    return NextResponse.json({ prompt: promptWithTags });
  } catch (error) {
    console.error('Get prompt error:', error);
    return NextResponse.json(
      { error: '获取提示词失败' },
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
    const {
      title,
      content,
      description,
      tags,
      model,
      temperature,
      maxTokens,
      sceneId,
      isPublic,
      changelog,
    } = await request.json();

    // 更新提示词
    const prompt = await prisma.prompt.update({
      where: {
        id,
        userId: DEFAULT_USER_ID,
      },
      data: {
        title,
        content,
        description,
        tags: tags ? JSON.stringify(tags) : null,
        model,
        temperature,
        maxTokens,
        sceneId,
        isPublic,
      },
    });

    return NextResponse.json({ prompt });
  } catch (error) {
    console.error('Update prompt error:', error);
    return NextResponse.json(
      { error: '更新提示词失败' },
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
    const result = await prisma.prompt.deleteMany({
      where: {
        id,
        userId: DEFAULT_USER_ID,
      },
    });

    if (result.count === 0) {
      return NextResponse.json({ error: '提示词不存在' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete prompt error:', error);
    return NextResponse.json(
      { error: '删除提示词失败' },
      { status: 500 }
    );
  }
}
