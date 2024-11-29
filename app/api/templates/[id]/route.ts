import { NextRequest } from 'next/server';
import { prisma } from '@/config';
import { APIUtils } from '@/utils';
import { User } from '@prisma/client';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    const { id } = await params;
    const templateId = parseInt(id, 10);

    try {
        const template = await prisma.codeTemplate.findUnique({
            where: { id: templateId },
            include: { tags: true },
        });

        if (!template) {
            return APIUtils.createNextResponse({
                success: false,
                status: 404,
                message: 'Template not found',
            });
        }

        return APIUtils.createNextResponse({
            success: true,
            status: 200,
            payload: template,
        });
    } catch (error: any) {
        APIUtils.logError(error);
        return APIUtils.createNextResponse({
            success: false,
            status: 500,
            message: error.toString(),
        });
    }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
    const { id } = await params;
    const userHeader = req.headers.get('x-user');
    const user: User = JSON.parse(userHeader as string);

    if (!user) {
        return APIUtils.createNextResponse({
            success: false,
            status: 401,
            message: 'Unauthorized: User not authenticated',
        });
    }

    const templateId = parseInt(id, 10);

    const template = await prisma.codeTemplate.findUnique({
        where: { id: templateId },
        select: { authorId: true },
    });

    if (!template) {
        return APIUtils.createNextResponse({
            success: false,
            status: 404,
            message: 'Template not found',
        });
    }

    if (template.authorId !== user.id && !user.isAdmin) {
        return APIUtils.createNextResponse({
            success: false,
            status: 403,
            message: 'Forbidden: You do not own this template',
        });
    }

    const body = await req.json();
    const { title, explanation, tags, code } = body;

    try {
        const updatedTemplate = await prisma.codeTemplate.update({
            where: { id: templateId },
            data: {
                title,
                explanation,
                code,
                tags: {
                    set: [],
                    connectOrCreate: tags.map((tag: string) => ({
                        where: { name: tag },
                        create: { name: tag },
                    })),
                },
            },
            include: { tags: true },
        });

        return APIUtils.createNextResponse({
            success: true,
            status: 200,
            payload: updatedTemplate,
        });
    } catch (error: any) {
        APIUtils.logError(error);
        return APIUtils.createNextResponse({
            success: false,
            status: 500,
            message: error.toString(),
        });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
    const { id } = await params;
    const userHeader = req.headers.get('x-user');
    const user: User = JSON.parse(userHeader as string);
    const templateId = parseInt(id, 10);

    const template = await prisma.codeTemplate.findUnique({
        where: { id: templateId },
        select: { authorId: true },
    });

    if (!template) {
        return APIUtils.createNextResponse({
            success: false,
            status: 404,
            message: 'Template not found',
        });
    }

    if (template.authorId !== user.id && !user.isAdmin) {
        return APIUtils.createNextResponse({
            success: false,
            status: 403,
            message: 'Forbidden: You do not own this template',
        });
    }

    try {
        await prisma.codeTemplate.delete({ where: { id: templateId } });

        return APIUtils.createNextResponse({
            success: true,
            status: 200,
            message: 'Template deleted successfully',
        });
    } catch (error: any) {
        APIUtils.logError(error);
        return APIUtils.createNextResponse({
            success: false,
            status: 500,
            message: error.toString(),
        });
    }
}