"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, ExternalLink, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GENERATING_PAGE_CLASS_NAME } from "@/components/events/generating-page-layout";

interface TemplateInfo {
  id: string;
  name: string;
  description: string;
  previewHtml?: string;
}

interface ModuleInfo {
  id: string;
  name: string;
  description: string;
  locked: boolean;
  available: boolean;
}

interface GeneratingPageContentProps {
  eventId: string;
  eventName: string;
  templates: TemplateInfo[];
  modules: ModuleInfo[];
  defaultEnabledModuleIds: string[];
}

type PageStatus = "selecting" | "generating" | "completed" | "adjusting" | "saving" | "error";

function formatTimer(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function GeneratingPageContent({
  eventId,
  eventName,
  templates,
  modules,
  defaultEnabledModuleIds,
}: GeneratingPageContentProps) {
  const router = useRouter();
  const [status, setStatus] = useState<PageStatus>("selecting");
  const [error, setError] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [enabledModules, setEnabledModules] = useState<Set<string>>(
    () => new Set(defaultEnabledModuleIds)
  );
  const [styleDescription, setStyleDescription] = useState("");
  const [generatedHtml, setGeneratedHtml] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [adjustThinking, setAdjustThinking] = useState("");
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startTimer = useCallback(() => {
    startTimeRef.current = Date.now();
    setElapsedSeconds(0);
    timerRef.current = setInterval(() => {
      setElapsedSeconds(
        Math.floor((Date.now() - startTimeRef.current) / 1000)
      );
    }, 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const toggleModule = useCallback((moduleId: string) => {
    setEnabledModules((prev) => {
      const mod = modules.find((m) => m.id === moduleId);
      if (mod?.locked) return prev;

      const next = new Set(prev);
      if (next.has(moduleId)) {
        next.delete(moduleId);
      } else {
        next.add(moduleId);
      }
      return next;
    });
  }, [modules]);

  const handleStyleAdjustStream = useCallback(async (response: Response) => {
    setStatus("adjusting");
    setAdjustThinking("");

    if (!response.body) {
      setStatus("error");
      setError("未收到响应流");
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let fullHtml = "";

    try {
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
            if (line.startsWith("event: ")) eventType = line.slice(7);
            else if (line.startsWith("data: ")) eventData = line.slice(6);
          }

          if (eventType === "thinking" && eventData) {
            try {
              const parsed = JSON.parse(eventData);
              setAdjustThinking((prev) => prev + parsed.chunk);
            } catch {}
          } else if (eventType === "code" && eventData) {
            try {
              const parsed = JSON.parse(eventData);
              fullHtml += parsed.chunk;
            } catch {}
          } else if (eventType === "done" && eventData) {
            try {
              const parsed = JSON.parse(eventData);
              setGeneratedHtml(parsed.html || fullHtml);
              setStatus("completed");
            } catch {
              setGeneratedHtml(fullHtml);
              setStatus("completed");
            }
          } else if (eventType === "error" && eventData) {
            try {
              const parsed = JSON.parse(eventData);
              setStatus("error");
              setError(parsed.message);
            } catch {
              setStatus("error");
              setError("未知错误");
            }
          }
        }
      }

      if (status === "adjusting" && fullHtml) {
        setGeneratedHtml(fullHtml);
        setStatus("completed");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "流读取错误";
      setStatus("error");
      setError(msg);
    }
  }, [status]);

  const handleGenerate = useCallback(async () => {
    if (!selectedTemplate) return;

    setStatus("generating");
    setError(null);
    setGeneratedHtml(null);
    startTimer();

    try {
      const selectedModules = modules
        .filter((m) => enabledModules.has(m.id))
        .map((m) => m.id);

      const response = await fetch(
        `/api/admin/events/${eventId}/generate-landing`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            templateId: selectedTemplate,
            selectedModules,
            styleDescription: styleDescription.trim() || undefined,
          }),
        }
      );

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "生成失败");
      }

      if (styleDescription.trim()) {
        await handleStyleAdjustStream(response);
      } else {
        const data = await response.json();
        setGeneratedHtml(data.html);
        setStatus("completed");
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setStatus("error");
      setError(err instanceof Error ? err.message : "生成失败，请重试");
    } finally {
      stopTimer();
    }
  }, [selectedTemplate, modules, enabledModules, eventId, styleDescription, startTimer, stopTimer, handleStyleAdjustStream]);

  const handlePreview = () => {
    if (!generatedHtml) return;
    const previewUrl = URL.createObjectURL(
      new Blob([generatedHtml], { type: "text/html;charset=utf-8" })
    );
    const openedWindow = window.open(previewUrl, "_blank", "noopener,noreferrer");
    if (!openedWindow) {
      URL.revokeObjectURL(previewUrl);
      setError("浏览器阻止了预览窗口，请允许弹出窗口后重试");
    } else {
      setTimeout(() => URL.revokeObjectURL(previewUrl), 60_000);
    }
  };

  const handleSave = async () => {
    if (!generatedHtml) return;
    setStatus("saving");
    setError(null);
    try {
      const response = await fetch(`/api/admin/events/${eventId}/save-landing`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          html: generatedHtml,
          templateId: selectedTemplate,
          modules: modules.filter((m) => enabledModules.has(m.id)).map((m) => m.id),
          styleHint: styleDescription.trim() || "",
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "保存失败");
      }

      const data = await response.json();
      router.push(
        `/admin/events/${eventId}/edit?landingVersion=${data.landingPage?.version}`
      );
    } catch (err) {
      setStatus("completed");
      setError(err instanceof Error ? err.message : "保存失败");
    }
  };

  const handleDiscard = () => {
    setStatus("selecting");
    setGeneratedHtml(null);
    setError(null);
    setAdjustThinking("");
    stopTimer();
  };

  const showTimer = status === "generating" || status === "adjusting";

  return (
    <div className={GENERATING_PAGE_CLASS_NAME}>
      {/* Top bar */}
      <div className="flex items-center justify-between border-b border-border bg-muted px-4 py-2">
        <div className="flex items-center gap-3">
          <Link
            href={`/admin/events/${eventId}/edit`}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← 返回编辑
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
          {status === "selecting" && (
            <Button
              onClick={handleGenerate}
              disabled={!selectedTemplate}
            >
              生成落地页
            </Button>
          )}
          {status === "generating" && (
            <span className="flex items-center gap-2 text-sm text-primary">
              <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
              填充模板中...
            </span>
          )}
          {status === "adjusting" && (
            <span className="flex items-center gap-2 text-sm text-primary">
              <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
              AI 调整风格中...
            </span>
          )}
          {status === "completed" && (
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handlePreview}>
                <ExternalLink aria-hidden="true" />
                预览
              </Button>
              <Button variant="outline" size="sm" onClick={handleDiscard}>
                重新选择
              </Button>
              <Button size="sm" onClick={handleSave}>
                保存
              </Button>
            </div>
          )}
          {status === "saving" && (
            <span className="flex items-center gap-2 text-sm text-primary">
              <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
              保存中...
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col overflow-auto">
        {status === "selecting" && (
          <div className="mx-auto w-full max-w-4xl space-y-8 p-6">
            {/* Step 1: Template selection */}
            <div>
              <h2 className="mb-1 text-lg font-semibold">第一步：选择模板</h2>
              <p className="mb-4 text-sm text-muted-foreground">
                选择一个你喜欢的页面风格作为基础
              </p>
              <div className="grid gap-4 md:grid-cols-3">
                {templates.map((tpl) => (
                  <button
                    key={tpl.id}
                    onClick={() => setSelectedTemplate(tpl.id)}
                    className={`border p-5 text-left transition-all ${
                      selectedTemplate === tpl.id
                        ? "border-primary bg-primary/5 shadow-sm"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <div className="relative mb-3 h-40 overflow-hidden border border-border bg-background">
                      {tpl.previewHtml ? (
                        <div className="pointer-events-none absolute inset-0 origin-top-left scale-[0.25]">
                          <iframe
                            srcDoc={tpl.previewHtml}
                            className="h-225 w-360 border-0"
                            sandbox=""
                            title={`${tpl.name} 预览`}
                          />
                        </div>
                      ) : (
                        <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                          {tpl.name}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium">{tpl.name}</div>
                      {selectedTemplate === tpl.id && (
                        <Check className="h-4 w-4 text-primary" />
                      )}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {tpl.description}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Step 2: Module selection */}
            <div>
              <h2 className="mb-1 text-lg font-semibold">第二步：选择模块</h2>
              <p className="mb-4 text-sm text-muted-foreground">
                勾选需要展示在落地页中的内容模块
              </p>
              <div className="grid gap-3 md:grid-cols-2">
                {modules.map((mod) => {
                  const isEnabled = enabledModules.has(mod.id);
                  return (
                    <button
                      key={mod.id}
                      onClick={() => toggleModule(mod.id)}
                      disabled={mod.locked}
                      className={`flex items-start gap-3 border p-4 text-left transition-all ${
                        isEnabled
                          ? "border-primary bg-primary/5"
                          : "border-border"
                      } ${mod.locked ? "opacity-75 cursor-not-allowed" : "hover:border-primary/50"}`}
                    >
                      <div
                        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center border ${
                          isEnabled
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border"
                        }`}
                      >
                        {isEnabled && <Check className="h-3 w-3" />}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{mod.name}</span>
                          {mod.locked && (
                            <span className="text-xs text-muted-foreground">
                              (固定)
                            </span>
                          )}
                          {!mod.available && (
                            <span className="flex items-center gap-1 text-xs text-amber-600">
                              <AlertTriangle className="h-3 w-3" />
                              暂无数据
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {mod.description}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 3: Optional style adjustment */}
            <div>
              <h2 className="mb-1 text-lg font-semibold">
                第三步：风格调整（可选）
              </h2>
              <p className="mb-4 text-sm text-muted-foreground">
                不满意模板的默认风格？描述你想要的调整方向，AI 会帮你调整
              </p>
              <Input
                value={styleDescription}
                onChange={(e) => setStyleDescription(e.target.value)}
                placeholder="例如：把主色调换成深蓝色，字体更粗犷一些，增加一些动效"
              />
            </div>
          </div>
        )}

        {status === "generating" && (
          <div className="flex flex-1 items-center justify-center">
            <div className="text-center">
              <div className="mx-auto mb-6 h-16 w-16 animate-spin border-4 border-primary border-t-transparent" />
              <h2 className="text-xl font-semibold">正在生成落地页</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                将赛事数据填充到模板中...
              </p>
              <p className="mt-1 font-mono text-sm text-muted-foreground">
                {formatTimer(elapsedSeconds)}
              </p>
            </div>
          </div>
        )}

        {status === "adjusting" && (
          <div className="flex flex-1 items-center justify-center">
            <div className="w-full max-w-lg text-center">
              <div className="mx-auto mb-6 h-16 w-16 animate-spin border-4 border-primary border-t-transparent" />
              <h2 className="text-xl font-semibold">AI 正在调整风格</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {styleDescription}
              </p>
              <p className="mt-1 font-mono text-sm text-muted-foreground">
                {formatTimer(elapsedSeconds)}
              </p>
              {adjustThinking && (
                <div className="mx-auto mt-4 max-w-md border border-border bg-muted/50 p-4 text-left text-xs text-muted-foreground">
                  {adjustThinking}
                </div>
              )}
            </div>
          </div>
        )}

        {(status === "completed" || status === "saving") && generatedHtml && (
          <div className="flex flex-1 flex-col p-4">
            <div className="mb-3 text-center">
              <h2 className="text-lg font-semibold">落地页已生成</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                点击「预览」查看效果，满意后点击「保存」
              </p>
            </div>
            <div className="flex-1 border border-border">
              <iframe
                srcDoc={generatedHtml}
                className="h-full w-full"
                sandbox="allow-scripts allow-same-origin"
                title="落地页预览"
              />
            </div>
          </div>
        )}

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
                  onClick={() => router.push(`/admin/events/${eventId}/edit`)}
                >
                  返回编辑
                </Button>
                <Button onClick={handleDiscard}>重新选择</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
