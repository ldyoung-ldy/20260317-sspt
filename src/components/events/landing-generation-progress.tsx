"use client";

import { useEffect, useRef } from "react";
import {
  Attachment,
  AttachmentInfo,
  AttachmentPreview,
  Attachments,
  type AttachmentData,
} from "@/components/ai-elements/attachments";
import {
  CodeBlock,
  CodeBlockActions,
  CodeBlockCopyButton,
  CodeBlockFilename,
  CodeBlockHeader,
  CodeBlockTitle,
} from "@/components/ai-elements/code-block";
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from "@/components/ai-elements/reasoning";
import {
  CODE_PANEL_CLASS_NAME,
  CODE_SCROLL_CLASS_NAME,
  CODE_VIEW_MASK_IMAGE,
  GENERATION_PROGRESS_GRID_CLASS_NAME,
  GENERATION_REASONING_SECTION_CLASS_NAME,
} from "@/components/events/generating-page-layout";

export type GenerationStatus =
  | "idle"
  | "connecting"
  | "thinking"
  | "code"
  | "completed"
  | "error";

export type GenerationAttachment = AttachmentData & {
  status: "ready" | "streaming" | "complete";
};

interface LandingGenerationProgressProps {
  status: GenerationStatus;
  attachments: GenerationAttachment[];
  thinkingText: string;
  codeContent: string;
  isReasoningOpen: boolean;
  onReasoningOpenChange: (open: boolean) => void;
}

function getAttachmentStatusText(status: GenerationAttachment["status"]) {
  switch (status) {
    case "complete":
      return "完成";
    case "streaming":
      return "生成中";
    case "ready":
      return "就绪";
  }
}

export function LandingGenerationProgress({
  status,
  attachments,
  thinkingText,
  codeContent,
  isReasoningOpen,
  onReasoningOpenChange,
}: LandingGenerationProgressProps) {
  const codeScrollRef = useRef<HTMLDivElement>(null);
  const reasoningScrollRef = useRef<HTMLDivElement>(null);
  const isStreaming = status === "thinking" || status === "code";

  useEffect(() => {
    if (status !== "code" && status !== "completed") return;

    const frame = requestAnimationFrame(() => {
      if (!codeScrollRef.current) return;
      codeScrollRef.current.scrollTop = codeScrollRef.current.scrollHeight;
    });

    return () => cancelAnimationFrame(frame);
  }, [codeContent, status]);

  useEffect(() => {
    if (!isStreaming || !isReasoningOpen) return;

    const frame = requestAnimationFrame(() => {
      if (!reasoningScrollRef.current) return;
      reasoningScrollRef.current.scrollTop =
        reasoningScrollRef.current.scrollHeight;
    });

    return () => cancelAnimationFrame(frame);
  }, [isReasoningOpen, isStreaming, thinkingText]);

  return (
    <div className={GENERATION_PROGRESS_GRID_CLASS_NAME}>
      <aside className="min-h-0 overflow-y-auto border-b border-border bg-card p-4 lg:border-b-0 lg:border-r">
        <div className="mb-3 font-mono text-xs uppercase tracking-[0.1em] text-muted-foreground">
          输入与产物
        </div>
        <Attachments variant="list" className="w-full">
          {attachments.map((attachment) => (
            <Attachment key={attachment.id} data={attachment}>
              <AttachmentPreview />
              <AttachmentInfo showMediaType />
              <span className="shrink-0 font-mono text-xs text-muted-foreground">
                {getAttachmentStatusText(attachment.status)}
              </span>
            </Attachment>
          ))}
        </Attachments>
      </aside>

      <section className="flex min-h-0 flex-col overflow-hidden">
        {thinkingText ? (
          <div className={GENERATION_REASONING_SECTION_CLASS_NAME}>
            <Reasoning
              className="m-0 p-4"
              isStreaming={isStreaming}
              open={isReasoningOpen}
              onOpenChange={onReasoningOpenChange}
            >
              <ReasoningTrigger
                getThinkingMessage={(streaming) =>
                  streaming ? "DeepSeek 正在推理" : "DeepSeek 推理过程"
                }
              />
              <ReasoningContent
                ref={reasoningScrollRef}
                className="max-h-48 overflow-y-auto"
              >
                {thinkingText}
              </ReasoningContent>
            </Reasoning>
          </div>
        ) : null}

        <div className={CODE_PANEL_CLASS_NAME}>
          <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-12 bg-gradient-to-b from-[#111111] to-transparent" />

          {status === "completed" && codeContent ? (
            <div className="min-h-0 flex-1 overflow-auto bg-[#111111] p-4">
              <CodeBlock code={codeContent} language="html" showLineNumbers>
                <CodeBlockHeader>
                  <CodeBlockTitle>
                    <CodeBlockFilename>landing-page.html</CodeBlockFilename>
                  </CodeBlockTitle>
                  <CodeBlockActions>
                    <CodeBlockCopyButton />
                  </CodeBlockActions>
                </CodeBlockHeader>
              </CodeBlock>
            </div>
          ) : (
            <div
              ref={codeScrollRef}
              className={CODE_SCROLL_CLASS_NAME}
              style={{
                maskImage: CODE_VIEW_MASK_IMAGE,
                WebkitMaskImage: CODE_VIEW_MASK_IMAGE,
              }}
            >
              {status === "thinking" && !thinkingText && (
                <div className="flex h-full items-center justify-center">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <span className="h-3 w-3 animate-pulse rounded-full bg-primary" />
                    <span>AI 正在思考...</span>
                  </div>
                </div>
              )}
              {status === "code" && codeContent && (
                <pre className="whitespace-pre-wrap break-all text-[#e6e6e6]">
                  {codeContent}
                </pre>
              )}
              {status === "code" && !codeContent && (
                <div className="flex h-full items-center justify-center">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <span className="h-3 w-3 animate-pulse rounded-full bg-primary" />
                    <span>开始生成代码...</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
