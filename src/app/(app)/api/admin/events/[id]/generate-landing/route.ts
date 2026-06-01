import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-guards";
import { getPrismaClient } from "@/lib/prisma";
import { renderLandingPage, type TemplateEventData } from "@/lib/ai/template-engine";
import { adjustLandingPageStyle } from "@/lib/ai/style-adjuster";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();

    const { id } = await params;
    const body = await request.json();
    const { templateId, selectedModules, styleDescription } = body;

    if (!templateId || !Array.isArray(selectedModules)) {
      return NextResponse.json(
        { error: "请提供模板 ID 和模块列表" },
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

    const eventData: TemplateEventData = {
      name: event.name,
      description: event.description,
      slug: event.slug,
      eligibility: event.eligibility,
      requirements: event.requirements,
      tracks: (event.tracks as Array<{ name: string; description: string }>) ?? [],
      challenges: (event.challenges as Array<{ title: string; description: string }>) ?? [],
      prizes: (event.prizes as Array<{ title: string; amount: string; description: string }>) ?? [],
      scoringCriteria: (event.scoringCriteria as Array<{ name: string; maxScore: number; weight: number }>) ?? [],
      organizers: (event.organizers as Array<{ name: string; role: string }>) ?? [],
      registrationStart: event.registrationStart,
      registrationEnd: event.registrationEnd,
      submissionStart: event.submissionStart,
      submissionEnd: event.submissionEnd,
      reviewStart: event.reviewStart,
      reviewEnd: event.reviewEnd,
      startDate: event.startDate,
      endDate: event.endDate,
    };

    // Render template with selected modules
    const filledHtml = renderLandingPage(templateId, eventData, selectedModules);

    if (!styleDescription) {
      // Direct template fill - return JSON
      return NextResponse.json({ html: filledHtml });
    }

    // AI style adjustment - stream the response
    const stream = adjustLandingPageStyle({
      html: filledHtml,
      styleDescription,
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("生成赛事页失败:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "生成赛事页失败" },
      { status: 500 }
    );
  }
}
