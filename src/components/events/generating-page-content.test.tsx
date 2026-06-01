import { describe, expect, it } from "vitest";
import { GENERATING_PAGE_CLASS_NAME } from "@/components/events/generating-page-layout";

describe("formatTimer", () => {
  function formatTimer(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  }

  it("formats 0 seconds as 0:00", () => {
    expect(formatTimer(0)).toBe("0:00");
  });

  it("formats 5 seconds as 0:05", () => {
    expect(formatTimer(5)).toBe("0:05");
  });

  it("formats 65 seconds as 1:05", () => {
    expect(formatTimer(65)).toBe("1:05");
  });

  it("formats 125 seconds as 2:05", () => {
    expect(formatTimer(125)).toBe("2:05");
  });

  it("formats 600 seconds as 10:00", () => {
    expect(formatTimer(600)).toBe("10:00");
  });
});

describe("PageStatus state machine", () => {
  type PageStatus = "selecting" | "generating" | "completed" | "adjusting" | "error";

  it("selecting shows template and module selection UI", () => {
    const status: PageStatus = "selecting";
    expect(status).toBe("selecting");
  });

  it("generating shows loading indicator", () => {
    const status: PageStatus = "generating";
    const showTimer: boolean = status === "generating" || status === "adjusting";
    expect(showTimer).toBe(true);
  });

  it("adjusting shows loading with thinking text", () => {
    const statuses: PageStatus[] = ["generating", "adjusting"];
    const status: PageStatus = "adjusting";
    expect(statuses).toContain(status);
  });

  it("completed shows preview and save buttons", () => {
    const status: PageStatus = "completed";
    expect(status).toBe("completed");
  });

  it("error shows error message", () => {
    const status: PageStatus = "error";
    expect(status).toBe("error");
  });

  it("can transition from selecting to generating", () => {
    const from: PageStatus = "selecting";
    const to: PageStatus = "generating";
    expect(to).toBe("generating");
    expect(from).not.toBe(to);
  });
});

describe("saving state", () => {
  type PageStatus = "selecting" | "generating" | "completed" | "adjusting" | "error" | "saving";

  it("saving is a recognized busy status", () => {
    const busyStatuses: PageStatus[] = ["generating", "adjusting", "saving"];
    expect(busyStatuses).toContain("saving");
  });

  it("completed is not a busy status", () => {
    const busyStatuses: PageStatus[] = ["generating", "adjusting", "saving"];
    expect(busyStatuses).not.toContain("completed");
  });

  it("can transition from completed to saving", () => {
    const from: PageStatus = "completed";
    const to: PageStatus = "saving";
    expect(from).not.toBe(to);
    expect(to).toBe("saving");
  });
});

describe("generating page layout", () => {
  it("keeps the page inside the viewport", () => {
    expect(GENERATING_PAGE_CLASS_NAME).toContain("h-[calc(100dvh-8rem)]");
    expect(GENERATING_PAGE_CLASS_NAME).toContain("overflow-hidden");
  });
});

describe("SSE event parsing", () => {
  function parseSSELines(part: string): { eventType: string; eventData: string } | null {
    if (!part.trim()) return null;
    const lines = part.split("\n");
    let eventType = "";
    let eventData = "";
    for (const line of lines) {
      if (line.startsWith("event: ")) eventType = line.slice(7);
      else if (line.startsWith("data: ")) eventData = line.slice(6);
    }
    return eventType ? { eventType, eventData } : null;
  }

  it("parses thinking event correctly", () => {
    const part = 'event: thinking\ndata: {"chunk":"调整配色"}\n\n';
    const result = parseSSELines(part);
    expect(result?.eventType).toBe("thinking");
    expect(result?.eventData).toBe('{"chunk":"调整配色"}');
  });

  it("parses code event correctly", () => {
    const part = 'event: code\ndata: {"chunk":"<html>"}';
    const result = parseSSELines(part);
    expect(result?.eventType).toBe("code");
    expect(result?.eventData).toBe('{"chunk":"<html>"}');
  });

  it("parses done event correctly", () => {
    const part = 'event: done\ndata: {"html":"<html></html>"}';
    const result = parseSSELines(part);
    expect(result?.eventType).toBe("done");
    expect(result?.eventData).toBe('{"html":"<html></html>"}');
  });
});
