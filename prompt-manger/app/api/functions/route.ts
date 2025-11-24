import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const DEFAULT_USER_ID = 'default-user';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sceneId = searchParams.get('sceneId');
    const language = searchParams.get('language');
    const category = searchParams.get('category');

    const where: any = {
      userId: DEFAULT_USER_ID,
    };

    if (sceneId) {
      where.sceneId = sceneId;
    }

    if (language) {
      where.language = language;
    }

    if (category) {
      where.category = category;
    }

    const functions = await prisma.functionTemplate.findMany({
      where,
      include: {
        scene: {
          select: {
            name: true,
            color: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    return NextResponse.json({ functions });
  } catch (error) {
    console.error('Get functions error:', error);
    return NextResponse.json(
      { error: '获取函数模板列表失败' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      name,
      code,
      description,
      language = 'typescript',
      category,
      tags,
      params,
      returnType,
      examples,
      sceneId,
      isPublic = false,
    } = body;

    if (!name || !code) {
      return NextResponse.json(
        { error: '函数名称和代码不能为空' },
        { status: 400 }
      );
    }

    const functionTemplate = await prisma.functionTemplate.create({
      data: {
        name,
        code,
        description,
        language,
        category,
        tags: tags ? JSON.stringify(tags) : null,
        params: params ? JSON.stringify(params) : null,
        returnType,
        examples: examples ? JSON.stringify(examples) : null,
        sceneId,
        userId: DEFAULT_USER_ID,
        isPublic,
      },
    });

    return NextResponse.json({ function: functionTemplate });
  } catch (error) {
    console.error('Create function error:', error);
    return NextResponse.json(
      { error: '创建函数模板失败' },
      { status: 500 }
    );
  }
}
