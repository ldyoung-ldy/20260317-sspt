import { loadTemplateHtml, loadModulesConfig, type ModulesConfig } from "./templates/registry";

export interface TemplateEventData {
  name: string;
  description: string;
  slug: string;
  eligibility?: string | null;
  requirements?: string | null;
  tracks: Array<{ name: string; description: string }>;
  challenges: Array<{ title: string; description: string }>;
  prizes: Array<{ title: string; amount: string; description: string }>;
  scoringCriteria: Array<{ name: string; maxScore: number; weight: number }>;
  organizers: Array<{ name: string; role: string }>;
  registrationStart: Date;
  registrationEnd: Date;
  submissionStart: Date;
  submissionEnd: Date;
  reviewStart: Date;
  reviewEnd: Date;
  startDate: Date;
  endDate: Date;
}

export function renderLandingPage(
  templateId: string,
  eventData: TemplateEventData,
  selectedModuleIds: string[]
): string {
  const html = loadTemplateHtml(templateId);
  const config = loadModulesConfig(templateId);

  return renderModules(html, config, eventData, selectedModuleIds);
}

function renderModules(
  html: string,
  config: ModulesConfig,
  eventData: TemplateEventData,
  selectedModuleIds: string[]
): string {
  const selectedSet = new Set(selectedModuleIds);
  let result = html;

  for (const [moduleId, marker] of Object.entries(config.modules)) {
    const { startMarker, endMarker } = marker;
    const startIndex = result.indexOf(startMarker);
    const endIndex = result.indexOf(endMarker);

    if (startIndex === -1 || endIndex === -1) continue;

    const sectionStart = startIndex;
    const sectionEnd = endIndex + endMarker.length;

    if (!selectedSet.has(moduleId)) {
      // Remove the entire module section
      result = result.slice(0, sectionStart) + result.slice(sectionEnd);
    } else {
      // Keep section, replace placeholders within it
      const sectionContent = result.slice(startIndex, sectionEnd);
      const rendered = renderModuleContent(moduleId, sectionContent, eventData);
      result =
        result.slice(0, sectionStart) +
        rendered +
        result.slice(sectionEnd);
    }
  }

  // Replace global placeholders (outside of module sections)
  result = replaceGlobalPlaceholders(result, eventData);

  return result;
}

function replaceGlobalPlaceholders(html: string, data: TemplateEventData): string {
  return html
    .replace(/\{\{eventName\}\}/g, escapeHtml(data.name))
    .replace(/\{\{eventDescription\}\}/g, escapeHtml(data.description))
    .replace(/\{\{eventSlug\}\}/g, escapeHtml(data.slug))
    .replace(/\{\{registerUrl\}\}/g, `/events/${data.slug}/register`)
    .replace(/\{\{submitUrl\}\}/g, `/events/${data.slug}/submit`)
    .replace(/\{\{detailUrl\}\}/g, `/events/${data.slug}`);
}

function renderModuleContent(
  moduleId: string,
  sectionHtml: string,
  data: TemplateEventData
): string {
  switch (moduleId) {
    case "intro":
      return renderIntro(sectionHtml, data);
    case "eligibility":
      return renderEligibility(sectionHtml, data);
    case "requirements":
      return renderRequirements(sectionHtml, data);
    case "tracks":
      return renderTracks(sectionHtml, data);
    case "challenges":
      return renderChallenges(sectionHtml, data);
    case "timeline":
      return renderTimeline(sectionHtml, data);
    case "prizes":
      return renderPrizes(sectionHtml, data);
    case "scoring":
      return renderScoring(sectionHtml, data);
    case "organizers":
      return renderOrganizers(sectionHtml, data);
    case "cta":
      return renderCta(sectionHtml, data);
    default:
      return sectionHtml;
  }
}

function renderIntro(html: string, data: TemplateEventData): string {
  return replaceGlobalPlaceholders(html, data);
}

function renderEligibility(html: string, data: TemplateEventData): string {
  return html.replace(
    /\{\{eligibilityContent\}\}/g,
    escapeHtml(data.eligibility ?? "")
  );
}

function renderRequirements(html: string, data: TemplateEventData): string {
  return html.replace(
    /\{\{requirementsContent\}\}/g,
    escapeHtml(data.requirements ?? "")
  );
}

function renderTracks(html: string, data: TemplateEventData): string {
  return renderListSection(html, "track", data.tracks, (track, index) => ({
    "{{trackIndex}}": String(index + 1),
    "{{trackName}}": escapeHtml(track.name),
    "{{trackDescription}}": escapeHtml(track.description),
  }));
}

function renderChallenges(html: string, data: TemplateEventData): string {
  return renderListSection(html, "challenge", data.challenges, (ch, index) => ({
    "{{challengeIndex}}": String(index + 1),
    "{{challengeTitle}}": escapeHtml(ch.title),
    "{{challengeDescription}}": escapeHtml(ch.description),
  }));
}

function renderTimeline(html: string, data: TemplateEventData): string {
  return html
    .replace(/\{\{registrationStart\}\}/g, formatDate(data.registrationStart))
    .replace(/\{\{registrationEnd\}\}/g, formatDate(data.registrationEnd))
    .replace(/\{\{submissionStart\}\}/g, formatDate(data.submissionStart))
    .replace(/\{\{submissionEnd\}\}/g, formatDate(data.submissionEnd))
    .replace(/\{\{reviewStart\}\}/g, formatDate(data.reviewStart))
    .replace(/\{\{reviewEnd\}\}/g, formatDate(data.reviewEnd));
}

function renderPrizes(html: string, data: TemplateEventData): string {
  return renderListSection(html, "prize", data.prizes, (prize, index) => ({
    "{{prizeIndex}}": String(index + 1),
    "{{prizeTitle}}": escapeHtml(prize.title),
    "{{prizeAmount}}": escapeHtml(prize.amount),
    "{{prizeDescription}}": escapeHtml(prize.description),
  }));
}

function renderScoring(html: string, data: TemplateEventData): string {
  return renderListSection(html, "criterion", data.scoringCriteria, (c, index) => ({
    "{{criterionIndex}}": String(index + 1),
    "{{criterionName}}": escapeHtml(c.name),
    "{{criterionMaxScore}}": String(c.maxScore),
    "{{criterionWeight}}": String(c.weight),
  }));
}

function renderOrganizers(html: string, data: TemplateEventData): string {
  return renderListSection(html, "organizer", data.organizers, (org, index) => ({
    "{{organizerIndex}}": String(index + 1),
    "{{organizerName}}": escapeHtml(org.name),
    "{{organizerRole}}": escapeHtml(org.role),
  }));
}

function renderCta(html: string, data: TemplateEventData): string {
  return replaceGlobalPlaceholders(html, data);
}

function renderListSection<T>(
  html: string,
  itemPrefix: string,
  items: T[],
  placeholders: (item: T, index: number) => Record<string, string>
): string {
  // Look for the repeating item template: <!-- EACH:itemPrefix -->...<!-- /EACH:itemPrefix -->
  const eachStart = `<!-- EACH:${itemPrefix} -->`;
  const eachEnd = `<!-- /EACH:${itemPrefix} -->`;

  const startIndex = html.indexOf(eachStart);
  const endIndex = html.indexOf(eachEnd);

  if (startIndex === -1 || endIndex === -1) {
    // No repeating template found, just replace flat placeholders
    if (items.length > 0) {
      const first = placeholders(items[0]!, 0);
      let result = html;
      for (const [key, value] of Object.entries(first)) {
        result = result.replaceAll(key, value);
      }
      return result;
    }
    return html;
  }

  const templateContent = html.slice(
    startIndex + eachStart.length,
    endIndex
  );

  const renderedItems = items
    .map((item, index) => {
      let itemHtml = templateContent;
      const ph = placeholders(item, index);
      for (const [key, value] of Object.entries(ph)) {
        itemHtml = itemHtml.replaceAll(key, value);
      }
      return itemHtml;
    })
    .join("\n");

  return (
    html.slice(0, startIndex) +
    renderedItems +
    html.slice(endIndex + eachEnd.length)
  );
}

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
