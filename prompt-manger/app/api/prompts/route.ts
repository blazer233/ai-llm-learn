import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const DEFAULT_USER_ID = 'default-user';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sceneId = searchParams.get('sceneId');

    const prompts = await prisma.prompt.findMany({
      where: {
        userId: DEFAULT_USER_ID,
        ...(sceneId ? { sceneId } : {}),
      },
      orderBy: { createdAt: 'desc' },
      include: {
        scene: true,
        _count: {
          select: {
            testRecords: true,
          },
        },
      },
    });

    return NextResponse.json({ prompts });
  } catch (error) {
    console.error('Get prompts error:', error);
    return NextResponse.json(
      { error: '获取提示词列表失败' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
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
    } = await request.json();

    if (!title || !content) {
      return NextResponse.json(
        { error: '标题和内容不能为空' },
        { status: 400 }
      );
    }

    const prompt = await prisma.prompt.create({
      data: {
        title,
        content,
        description,
        tags: tags ? JSON.stringify(tags) : null,
        model,
        temperature,
        maxTokens,
        sceneId,
        isPublic: isPublic || false,
        userId: DEFAULT_USER_ID,
      },
    });

    return NextResponse.json({ prompt }, { status: 201 });
  } catch (error) {
    console.error('Create prompt error:', error);
    return NextResponse.json(
      { error: '创建提示词失败' },
      { status: 500 }
    );
  }
}
