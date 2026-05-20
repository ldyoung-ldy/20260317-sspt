"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  COMPLETED_GENERATION_ACTIONS,
  GENERATION_ATTACHMENT_LABELS,
  GENERATING_PAGE_CLASS_NAME,
} from "@/components/events/generating-page-layout";
import {
  LandingGenerationProgress,
  type GenerationAttachment,
  type GenerationStatus,
} from "@/components/events/landing-generation-progress";

interface GeneratingPageContentProps {
  eventId: string;
  eventName: string;
  initialStyleHint?: string;
}

const STYLE_HINTS = [
  { id: "minimal", label: "简约", description: "简洁大方，大量留白，清晰层次" },
  { id: "tech", label: "科技感", description: "渐变色、几何图形、前沿科技氛围" },
  { id: "vibrant", label: "活力", description: "色彩丰富、充满动感、激发热情" },
  { id: "retro", label: "复古未来", description: "赛博朋克、霓虹灯、复古科技" },
  { id: "luxury", label: "奢华精致", description: "金色点缀、高端质感、优雅排版" },
  { id: "editorial", label: "杂志风", description: "大图排版、editorial 布局、视觉冲击" },
];

function formatTimer(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function getStyleHint(selectedHint: string, customHint: string) {
  return (
    customHint ||
    STYLE_HINTS.find((hint) => hint.id === selectedHint)?.label ||
    selectedHint
  );
}

function createGenerationAttachments(
  status: GenerationStatus
): GenerationAttachment[] {
  return [
    {
      id: "event-data",
      type: "file",
      filename: GENERATION_ATTACHMENT_LABELS[0],
      mediaType: "application/json",
      url: "",
      status: "ready",
    },
    {
      id: "style-hint",
      type: "file",
      filename: GENERATION_ATTACHMENT_LABELS[1],
      mediaType: "text/plain",
      url: "",
      status: "ready",
    },
    {
      id: "frontend-design-skill",
      type: "source-document",
      sourceId: "frontend-design-skill",
      title: GENERATION_ATTACHMENT_LABELS[2],
      filename: "SKILL.md",
      mediaType: "text/markdown",
      status: "ready",
    },
    {
      id: "landing-page-html",
      type: "file",
      filename: GENERATION_ATTACHMENT_LABELS[3],
      mediaType: "text/html",
      url: "",
      status:
        status === "completed"
          ? "complete"
          : status === "code"
            ? "streaming"
            : "ready",
    },
  ];
}

export function GeneratingPageContent({
  eventId,
  eventName,
  initialStyleHint,
}: GeneratingPageContentProps) {
  const router = useRouter();
  const [status, setStatus] = useState<GenerationStatus>(
    initialStyleHint ? "connecting" : "idle"
  );
  const [error, setError] = useState<string | null>(null);
  const [selectedHint, setSelectedHint] = useState(initialStyleHint || "minimal");
  const [customHint, setCustomHint] = useState("");
  const [thinkingChunks, setThinkingChunks] = useState<string[]>([]);
  const [codeContent, setCodeContent] = useState("");
  const [isThinkingCollapsed, setIsThinkingCollapsed] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [completedVersion, setCompletedVersion] = useState<number | null>(null);
  const codeRef = useRef("");
  const displayedCodeRef = useRef("");
  const pendingCodeRef = useRef("");
  const fullHtmlRef = useRef("");
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const typewriterFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  const cancelTypewriter = useCallback(() => {
    if (typewriterFrameRef.current !== null) {
      cancelAnimationFrame(typewriterFrameRef.current);
      typewriterFrameRef.current = null;
    }
  }, []);

  const flushPendingCode = useCallback(() => {
    if (typewriterFrameRef.current !== null) return;

    const tick = () => {
      const pending = pendingCodeRef.current;
      if (pending.length === 0) {
        typewriterFrameRef.current = null;
        return;
      }

      const nextChunkSize = Math.min(
        Math.max(8, Math.ceil(pending.length / 8)),
        96
      );
      const nextChunk = pending.slice(0, nextChunkSize);
      pendingCodeRef.current = pending.slice(nextChunkSize);
      displayedCodeRef.current += nextChunk;
      setCodeContent(displayedCodeRef.current);
      typewriterFrameRef.current = requestAnimationFrame(tick);
    };

    typewriterFrameRef.current = requestAnimationFrame(tick);
  }, []);

  const startTimer = useCallback(() => {
    startTimeRef.current = Date.now();
    setElapsedSeconds(0);
    timerRef.current = setInterval(() => {
      const elapsed = Math.floor(
        (Date.now() - (startTimeRef.current ?? Date.now())) / 1000
      );
      setElapsedSeconds(elapsed);
    }, 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const finalizeCodeDisplay = useCallback((finalHtml?: string) => {
    cancelTypewriter();
    pendingCodeRef.current = "";
    if (finalHtml !== undefined) {
      codeRef.current = finalHtml;
    }
    displayedCodeRef.current = codeRef.current;
    setCodeContent(codeRef.current);
  }, [cancelTypewriter]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      cancelTypewriter();
    };
  }, [cancelTypewriter]);

  const handleGenerate = useCallback(async () => {
    setStatus("connecting");
    setError(null);
    codeRef.current = "";
    displayedCodeRef.current = "";
    pendingCodeRef.current = "";
    fullHtmlRef.current = "";
    setThinkingChunks([]);
    setCodeContent("");
    setIsThinkingCollapsed(false);
    setCompletedVersion(null);

    try {
      const response = await fetch(
        `/api/admin/events/${eventId}/generate-landing`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            styleHint: getStyleHint(selectedHint, customHint),
          }),
        }
      );
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "生成失败");
      }

      if (!response.body) {
        throw new Error("未收到响应流");
      }

      setStatus("thinking");
      startTimer();

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop() ?? "";

        for (const part of parts) {
          if (!part.trim()) continue;

          const lines = part.split("\n");
          let eventType = "";
          let eventData = "";

          for (const line of lines) {
            if (line.startsWith("event: ")) {
              eventType = line.slice(7);
            } else if (line.startsWith("data: ")) {
              eventData = line.slice(6);
            }
          }

          if (eventType === "thinking" && eventData) {
            try {
              const parsed = JSON.parse(eventData);
              setThinkingChunks((prev) => [...prev, parsed.chunk]);
            } catch {
              // Ignore malformed stream chunks.
            }
          } else if (eventType === "phase" && eventData) {
            try {
              const parsed = JSON.parse(eventData);
              if (parsed.phase === "code") {
                setIsThinkingCollapsed(true);
                setStatus("code");
              }
            } catch {
              // Ignore malformed stream chunks.
            }
          } else if (eventType === "code" && eventData) {
            try {
              const parsed = JSON.parse(eventData);
              codeRef.current += parsed.chunk;
              pendingCodeRef.current += parsed.chunk;
              flushPendingCode();
            } catch {
              // Ignore malformed stream chunks.
            }
          } else if (eventType === "done" && eventData) {
            try {
              const parsed = JSON.parse(eventData);
              fullHtmlRef.current = parsed.html;
              finalizeCodeDisplay(parsed.html);
              setStatus("completed");
              stopTimer();
            } catch {
              setStatus("error");
              setError("解析完成事件失败");
            }
          } else if (eventType === "error" && eventData) {
            try {
              const parsed = JSON.parse(eventData);
              setStatus("error");
              setError(parsed.message);
              stopTimer();
            } catch {
              setStatus("error");
              setError("未知错误");
            }
          }
        }
      }

      if (status === "thinking" || status === "code") {
        if (!fullHtmlRef.current) {
          fullHtmlRef.current = codeRef.current;
        }
        finalizeCodeDisplay();
        setStatus("completed");
        stopTimer();
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setStatus("error");
      setError(err instanceof Error ? err.message : "生成失败，请重试");
      stopTimer();
    }
  }, [
    eventId,
    selectedHint,
    customHint,
    status,
    startTimer,
    stopTimer,
    flushPendingCode,
    finalizeCodeDisplay,
  ]);

  useEffect(() => {
    if (initialStyleHint && status === "connecting") {
      handleGenerate();
    }
  }, [initialStyleHint, status, handleGenerate]);

  const handleSave = async () => {
    try {
      const html = fullHtmlRef.current || codeRef.current;
      const response = await fetch(`/api/admin/events/${eventId}/save-landing`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          html,
          styleHint: getStyleHint(selectedHint, customHint),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "保存失败");
      }

      const data = await response.json();
      setCompletedVersion(data.landingPage?.version ?? null);
      router.push(
        `/admin/events/${eventId}/edit?landingVersion=${data.landingPage?.version}`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存失败");
    }
  };

  const handlePreview = () => {
    const html = fullHtmlRef.current || codeRef.current;
    if (!html) {
      setError("暂无可预览的落地页内容");
      return;
    }

    const previewUrl = URL.createObjectURL(
      new Blob([html], { type: "text/html;charset=utf-8" })
    );
    const openedWindow = window.open(previewUrl, "_blank", "noopener,noreferrer");

    if (!openedWindow) {
      URL.revokeObjectURL(previewUrl);
      setError("浏览器阻止了预览窗口，请允许弹出窗口后重试");
      return;
    }

    setTimeout(() => URL.revokeObjectURL(previewUrl), 60_000);
  };

  const handleDiscard = () => {
    setStatus("idle");
    codeRef.current = "";
    displayedCodeRef.current = "";
    pendingCodeRef.current = "";
    fullHtmlRef.current = "";
    setThinkingChunks([]);
    setCodeContent("");
    setError(null);
    cancelTypewriter();
    stopTimer();
  };

  const showTimer = status !== "idle" && status !== "error";
  const thinkingText = thinkingChunks.join("");
  const attachments = createGenerationAttachments(status);

  return (
    <div className={GENERATING_PAGE_CLASS_NAME}>
      <div className="flex items-center justify-between border-b border-border bg-muted px-4 py-2">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/events"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← 返回赛事列表
          </Link>
          <span className="text-muted-foreground">|</span>
          <span className="text-sm font-medium">{eventName}</span>
        </div>

        <div className="flex items-center gap-4">
          {showTimer && (
            <span className="font-mono text-sm text-muted-foreground">
              {formatTimer(elapsedSeconds)}
            </span>
          )}
          {status === "connecting" && (
            <span className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="h-2 w-2 animate-pulse rounded-full bg-yellow-500" />
              连接中...
            </span>
          )}
          {status === "thinking" && (
            <span className="flex items-center gap-2 text-sm text-primary">
              <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
              AI 思考中...
            </span>
          )}
          {status === "code" && (
            <span className="flex items-center gap-2 text-sm text-primary">
              <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
              生成代码中...
            </span>
          )}
          {status === "completed" && (
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handlePreview}>
                <ExternalLink aria-hidden="true" />
                {COMPLETED_GENERATION_ACTIONS[0]}
              </Button>
              <Button variant="outline" size="sm" onClick={handleDiscard}>
                {COMPLETED_GENERATION_ACTIONS[1]}
              </Button>
              <Button size="sm" onClick={handleSave}>
                {COMPLETED_GENERATION_ACTIONS[2]}
                {completedVersion ? ` v${completedVersion}` : ""}
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col overflow-hidden">
        {status === "idle" && (
          <div className="flex flex-1 items-center justify-center">
            <div className="w-full max-w-2xl space-y-8">
              <div className="text-center">
                <h1 className="text-2xl font-bold">
                  为「{eventName}」生成赛事页
                </h1>
                <p className="mt-2 text-muted-foreground">
                  选择风格方向，AI 将为你生成一个独特的赛事落地页
                </p>
              </div>

              <div className="space-y-4">
                <h2 className="text-lg font-semibold">选择风格</h2>
                <div className="grid gap-3 md:grid-cols-3">
                  {STYLE_HINTS.map((hint) => (
                    <button
                      key={hint.id}
                      onClick={() => {
                        setSelectedHint(hint.id);
                        setCustomHint("");
                      }}
                      className={`border p-4 text-left transition-all ${
                        selectedHint === hint.id && !customHint
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <div className="text-sm font-medium">{hint.label}</div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {hint.description}
                      </div>
                    </button>
                  ))}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">或自定义风格描述</label>
                  <textarea
                    value={customHint}
                    onChange={(e) => setCustomHint(e.target.value)}
                    placeholder="例如：暗黑风格，紫色霓虹灯效果，赛博朋克氛围..."
                    className="w-full border border-border bg-background p-3 text-sm focus:border-primary focus:outline-none"
                    rows={2}
                  />
                </div>
              </div>

              <div className="flex justify-center gap-4">
                <Button
                  variant="outline"
                  onClick={() => router.push("/admin/events")}
                >
                  跳过，稍后生成
                </Button>
                <Button onClick={handleGenerate}>开始生成</Button>
              </div>
            </div>
          </div>
        )}

        {(status === "thinking" || status === "code" || status === "completed") && (
          <LandingGenerationProgress
            status={status}
            attachments={attachments}
            thinkingText={thinkingText}
            codeContent={codeContent}
            isReasoningOpen={!isThinkingCollapsed}
            onReasoningOpenChange={(open) => setIsThinkingCollapsed(!open)}
          />
        )}
      </div>

      {status === "error" && (
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center border-4 border-destructive bg-destructive/10">
              <span className="text-4xl">×</span>
            </div>

            <h2 className="text-2xl font-bold text-destructive">生成失败</h2>
            <p className="mt-2 text-muted-foreground">{error}</p>

            <div className="mt-8 flex justify-center gap-4">
              <Button
                variant="outline"
                onClick={() => router.push("/admin/events")}
              >
                返回列表
              </Button>
              <Button onClick={handleGenerate}>重试</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
