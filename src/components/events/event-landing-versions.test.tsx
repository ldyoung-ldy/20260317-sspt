import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { EventLandingVersions } from "@/components/events/event-landing-versions";

describe("EventLandingVersions", () => {
  it("shows saved landing page versions and an activation control for inactive versions", () => {
    const html = renderToStaticMarkup(
      <EventLandingVersions
        eventId="event-1"
        eventSlug="ai-hackathon"
        landingPages={[
          {
            id: "landing-2",
            version: 2,
            isActive: false,
            templateId: "tech",
            modules: ["intro", "tracks", "prizes", "cta"],
            styleHint: "",
            createdAt: new Date("2026-05-14T00:00:00Z"),
            updatedAt: new Date("2026-05-14T00:00:00Z"),
          },
          {
            id: "landing-1",
            version: 1,
            isActive: true,
            templateId: "minimal",
            modules: ["intro", "tracks", "timeline", "cta"],
            styleHint: "",
            createdAt: new Date("2026-05-13T00:00:00Z"),
            updatedAt: new Date("2026-05-13T00:00:00Z"),
          },
        ]}
        activateAction={vi.fn()}
      />
    );

    expect(html).toContain("落地页版本");
    expect(html).toContain("Version 2");
    expect(html).toContain("科技深色");
    expect(html).toContain("4 个模块");
    expect(html).toContain("当前激活");
    expect(html).toContain('name="landingPageId"');
    expect(html).toContain('value="landing-2"');
    expect(html).toContain("激活");
    expect(html).toContain(
      'href="/admin/events/event-1/landing-preview?landingPageId=landing-2"'
    );
    expect(html).toContain(
      'href="/admin/events/event-1/landing-preview?landingPageId=landing-1"'
    );
  });

  it("shows AI adjustment badge when styleHint is provided", () => {
    const html = renderToStaticMarkup(
      <EventLandingVersions
        eventId="event-1"
        eventSlug="ai-hackathon"
        landingPages={[
          {
            id: "landing-3",
            version: 1,
            isActive: true,
            templateId: "minimal",
            modules: ["intro", "cta"],
            styleHint: "换成深蓝色主题",
            createdAt: new Date("2026-05-15T00:00:00Z"),
            updatedAt: new Date("2026-05-15T00:00:00Z"),
          },
        ]}
        activateAction={vi.fn()}
      />
    );

    expect(html).toContain("AI 调整");
  });
});
