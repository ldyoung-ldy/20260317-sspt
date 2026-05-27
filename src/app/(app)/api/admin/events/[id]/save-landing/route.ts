import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-guards";
import { getPrismaClient } from "@/lib/prisma";
import { createEventLandingPage } from "@/lib/ai/queries";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();

    const { id } = await params;
    const body = await request.json();
    const { html, templateId, modules, styleHint } = body;

    if (!html) {
      return NextResponse.json(
        { error: "请提供 HTML 内容" },
        { status: 400 }
      );
    }

    if (!templateId) {
      return NextResponse.json(
        { error: "请提供模板 ID" },
        { status: 400 }
      );
    }

    const prisma = getPrismaClient();
    const event = await prisma.event.findUnique({
      where: { id },
    });

    if (!event) {
      return NextResponse.json(
        { error: "赛事不存在" },
        { status: 404 }
      );
    }

    const landingPage = await createEventLandingPage(id, {
      templateId,
      modules: modules ?? [],
      styleHint: styleHint ?? "",
      content: html,
    });

    return NextResponse.json({
      success: true,
      version: landingPage.version,
      landingPage: {
        id: landingPage.id,
        version: landingPage.version,
        isActive: landingPage.isActive,
        templateId: landingPage.templateId,
        createdAt: landingPage.createdAt,
      },
    });
  } catch (error) {
    console.error("保存赛事页失败:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "保存赛事页失败" },
      { status: 500 }
    );
  }
}
