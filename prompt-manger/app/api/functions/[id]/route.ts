import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const functionTemplate = await prisma.functionTemplate.findUnique({
      where: { id },
      include: {
        scene: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
      },
    });

    if (!functionTemplate) {
      return NextResponse.json(
        { error: '函数模板不存在' },
        { status: 404 }
      );
    }

    return NextResponse.json({ function: functionTemplate });
  } catch (error) {
    console.error('Get function error:', error);
    return NextResponse.json(
      { error: '获取函数模板失败' },
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
    const body = await request.json();
    const {
      name,
      code,
      description,
      language,
      category,
      tags,
      params: functionParams,
      returnType,
      examples,
      sceneId,
      isPublic,
    } = body;

    const existingFunction = await prisma.functionTemplate.findUnique({
      where: { id },
    });

    if (!existingFunction) {
      return NextResponse.json(
        { error: '函数模板不存在' },
        { status: 404 }
      );
    }

    const functionTemplate = await prisma.functionTemplate.update({
      where: { id },
      data: {
        name,
        code,
        description,
        language,
        category,
        tags: tags ? JSON.stringify(tags) : undefined,
        params: functionParams ? JSON.stringify(functionParams) : undefined,
        returnType,
        examples: examples ? JSON.stringify(examples) : undefined,
        sceneId,
        isPublic,
      },
    });

    return NextResponse.json({ function: functionTemplate });
  } catch (error) {
    console.error('Update function error:', error);
    return NextResponse.json(
      { error: '更新函数模板失败' },
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

    await prisma.functionTemplate.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete function error:', error);
    return NextResponse.json(
      { error: '删除函数模板失败' },
      { status: 500 }
    );
  }
}
