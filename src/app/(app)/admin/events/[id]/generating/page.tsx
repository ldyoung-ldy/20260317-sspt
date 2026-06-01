import { notFound } from "next/navigation";
import { getAdminEventById } from "@/lib/events/queries";
import { GeneratingPageContent } from "@/components/events/generating-page-content";
import { LANDING_TEMPLATES, loadTemplateHtml } from "@/lib/ai/templates/registry";
import { LANDING_MODULES, getModuleAvailability, getDefaultEnabledModules } from "@/lib/ai/modules";

export default async function AdminEventGeneratingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const event = await getAdminEventById(id);

  if (!event) {
    notFound();
  }

  const templates = LANDING_TEMPLATES.map((t) => ({
    id: t.id,
    name: t.name,
    description: t.description,
    previewHtml: loadTemplateHtml(t.id),
  }));

  const availability = getModuleAvailability(event);

  const modules = LANDING_MODULES.map((mod) => ({
    id: mod.id,
    name: mod.name,
    description: mod.description,
    locked: mod.locked,
    available: availability.get(mod.id) ?? false,
  }));

  const defaultEnabledModuleIds = getDefaultEnabledModules(event);

  return (
    <GeneratingPageContent
      eventId={event.id}
      eventName={event.name}
      templates={templates}
      modules={modules}
      defaultEnabledModuleIds={defaultEnabledModuleIds}
    />
  );
}
