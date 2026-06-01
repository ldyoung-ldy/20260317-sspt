import { notFound } from "next/navigation";
import {
  getEventLandingPageByEventId,
  getEventLandingPageById,
} from "@/lib/ai/queries";
import { extractHtmlDocument } from "@/lib/ai/html-sanitize";

export default async function AdminLandingPreviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ landingPageId?: string }>;
}) {
  const { id } = await params;
  const { landingPageId } = await searchParams;

  const landingPage = landingPageId
    ? await getEventLandingPageById(landingPageId)
    : await getEventLandingPageByEventId(id);

  if (!landingPage || landingPage.event.id !== id) {
    notFound();
  }

  const html = extractHtmlDocument(landingPage.content);

  return (
    <iframe
      srcDoc={html}
      className="h-screen w-full border-0"
      title={`${landingPage.event.name} - 赛事落地页预览`}
      sandbox="allow-scripts allow-same-origin"
    />
  );
}
