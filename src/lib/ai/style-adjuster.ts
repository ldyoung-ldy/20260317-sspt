import { getAIConfig } from "./config";
import { extractHtmlDocument, findHtmlStart } from "./html-sanitize";
import {
  formatSSE,
  parseOpenAIChunk,
  parseAnthropicChunk,
  type ParsedAIChunk,
} from "./sse-stream";

const DESIGN_TYPOGRAPHY = `## 字体配对参考

| 风格 | 标题字体 | 正文字体 | 适用场景 | Google Fonts Import |
|------|---------|---------|---------|-------------------|
| 经典优雅 | Playfair Display | Inter | 奢华、编辑、杂志 | @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:wght@400;500;600;700&display=swap'); |
| 现代专业 | Poppins | Open Sans | SaaS、企业、商业 | @import url('https://fonts.googleapis.com/css2?family=Open+Sans:wght@300;400;500;600;700&family=Poppins:wght@400;500;600;700&display=swap'); |
| 科技创业 | Space Grotesk | DM Sans | 科技、AI、开发者工具 | @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=Space+Grotesk:wght@400;500;600;700&display=swap'); |
| 温暖人文 | Lora | Source Sans 3 | 教育、非营利、社区 | @import url('https://fonts.googleapis.com/css2?family=Lora:wght@400;500;600;700&family=Source+Sans+3:wght@300;400;500;600;700&display=swap'); |
| 极简几何 | Outfit | DM Sans | 创意、设计、作品集 | @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=Outfit:wght@300;400;500;600;700&display=swap'); |
| 力量感 | Bebas Neue | Roboto | 运动、健身、活动 | @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Roboto:wght@300;400;500;700&display=swap'); |
| 中文典雅 | Noto Serif SC | Noto Sans SC | 中文编辑、文化类 | @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@300;400;500;700&family=Noto+Serif+SC:wght@400;500;600;700&display=swap'); |`;

const DESIGN_COLOR_PALETTES = `## 配色方案参考

每组包含六色：主色、辅助色、CTA、背景、文字、边框。

| 场景 | 主色 | 辅助色 | CTA | 背景 | 文字 | 边框 |
|------|------|--------|-----|------|------|------|
| SaaS/通用 | #2563EB | #3B82F6 | #F97316 | #F8FAFC | #1E293B | #E2E8F0 |
| 奢华高端 | #1C1917 | #44403C | #CA8A04 | #FAFAF9 | #0C0A09 | #D6D3D1 |
| 医疗健康 | #0891B2 | #22D3EE | #059669 | #ECFEFF | #164E63 | #A5F3FC |
| 教育学习 | #4F46E5 | #818CF8 | #F97316 | #EEF2FF | #1E1B4B | #C7D2FE |
| 创意机构 | #EC4899 | #F472B6 | #06B6D4 | #FDF2F8 | #831843 | #FBCFE8 |
| 金融深色 | #F59E0B | #FBBF24 | #8B5CF6 | #0F172A | #F8FAFC | #334155 |
| 美容健康 | #10B981 | #34D399 | #8B5CF6 | #ECFDF5 | #064E3B | #A7F3D0 |
| 运动健身 | #DC2626 | #F87171 | #16A34A | #FEF2F2 | #1F2937 | #FECACA |
| 自然绿色 | #2E8B57 | #87CEEB | #FFD700 | #F0FFF4 | #1A3320 | #C6E6C6 |
| 深空科技 | #FFFFFF | #94A3B8 | #3B82F6 | #0B0B10 | #F8FAFC | #1E293B |`;

const DESIGN_UX_RULES = `## CSS 设计规范

### 动效
- 微交互时长 150-300ms，不要超过 500ms
- 使用 ease-out 进入、ease-in 退出，不要用 linear
- 用 transform 和 opacity 做动画，不要动 width/height/top/left（会触发重排）
- 检查 prefers-reduced-motion 媒体查询
- 每个视窗最多动效 1-2 个关键元素

### 对比度与可读性
- 正文文字与背景对比度至少 4.5:1
- 浅色模式正文用 #0F172A (slate-900)，辅助文字至少 #475569 (slate-600)
- 深色模式正文用 #F8FAFC，辅助文字至少 #94A3B8 (slate-400)

### 响应式
- 使用 dvh 代替 100vh（移动端浏览器地址栏问题）
- 文本内容限宽 65-75ch (max-w-prose)
- 触摸目标最小 44×44px，间距至少 8px
- 在 320px / 768px / 1024px / 1440px 四个断点测试

### 交互
- 所有可点击元素必须有 cursor-pointer 和 hover 反馈
- 过渡效果用 transition-colors duration-200
- 不要仅依赖 hover 作为交互方式（移动端无 hover）`;

export interface StyleAdjustOptions {
  html: string;
  styleDescription: string;
  timeoutMs?: number;
}

function normalizeParsedChunk(
  result: string | ParsedAIChunk
): ParsedAIChunk {
  return typeof result === "string" ? { content: result } : result;
}

function buildStyleAdjustPrompt(html: string, styleDescription: string): string {
  return `你是一个顶级前端设计师。我有一个已经完成的 HTML 落地页，我需要你对它的视觉风格进行调整。

## 重要规则

1. **只能修改 CSS 样式**（<style> 标签内的内容和内联 style 属性）
2. **不能修改 HTML 结构** — 不能添加、删除或重排任何 HTML 元素
3. **不能修改文本内容** — 所有文案必须保持原样
4. **不能修改链接** — 所有 href 属性必须保持原样
5. **不能修改 class 名称** — 除非是内联 style 中的引用
6. **保持响应式** — 确保在移动端和桌面端都能正常显示

## 风格调整要求

${styleDescription}

${DESIGN_TYPOGRAPHY}

${DESIGN_COLOR_PALETTES}

${DESIGN_UX_RULES}

## 当前页面代码

\`\`\`html
${html}
\`\`\`

## 输出要求

请直接输出调整后的完整 HTML 代码。可以使用 \`\`\`html 代码块，但代码块标记不是 HTML 内容的一部分。
确保 HTML 语法正确，可以在现代浏览器中直接渲染。
从上面的设计参考中选择最匹配用户需求的字体配对和配色方案。`;
}

export function adjustLandingPageStyle(
  options: StyleAdjustOptions
): ReadableStream<Uint8Array> {
  const config = getAIConfig();
  const { html, styleDescription, timeoutMs = 120000 } = options;
  const prompt = buildStyleAdjustPrompt(html, styleDescription);

  const encoder = new TextEncoder();

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      const abortController = new AbortController();
      const timeoutId = setTimeout(() => abortController.abort(), timeoutMs);

      const write = (event: Parameters<typeof formatSSE>[0]) => {
        controller.enqueue(encoder.encode(formatSSE(event)));
      };

      try {
        const isAnthropicFormat = config.provider === "anthropic";

        const fetchOptions: RequestInit = isAnthropicFormat
          ? {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "x-api-key": config.apiKey,
                "anthropic-version": "2023-06-01",
                "anthropic-dangerous-direct-browser-access": "true",
              },
              body: JSON.stringify({
                model: config.modelName,
                messages: [{ role: "user", content: prompt }],
                temperature: 0.4,
                max_tokens: 32000,
                stream: true,
              }),
              signal: abortController.signal,
            }
          : {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${config.apiKey}`,
              },
              body: JSON.stringify({
                model: config.modelName,
                messages: [
                  {
                    role: "system",
                    content: "你是一个顶级前端设计师，专注于 CSS 样式调整。保持 HTML 结构和文案不变，只修改视觉样式。",
                  },
                  { role: "user", content: prompt },
                ],
                temperature: 0.4,
                max_tokens: 32000,
                stream: true,
              }),
              signal: abortController.signal,
            };

        const endpoint = isAnthropicFormat
          ? `${config.baseUrl}/v1/messages`
          : `${config.baseUrl}/chat/completions`;

        const response = await fetch(endpoint, fetchOptions);

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorText = await response.text();
          write({
            type: "error",
            message: `AI API 调用失败：${response.status} ${errorText}`,
          });
          controller.close();
          return;
        }

        if (!response.body) {
          write({ type: "error", message: "AI API 未返回响应流" });
          controller.close();
          return;
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullHtml = "";
        let buffer = "";
        let inCodePhase = false;
        let thinkingBuffer = "";

        const flushThinking = () => {
          if (thinkingBuffer.length > 0) {
            write({ type: "thinking", chunk: thinkingBuffer });
            thinkingBuffer = "";
          }
        };

        const handleContent = (content: string) => {
          if (!inCodePhase) {
            const textToCheck = thinkingBuffer + content;
            const htmlStart = findHtmlStart(textToCheck);
            if (htmlStart) {
              const thinkingPart = textToCheck.slice(0, htmlStart.index);
              if (thinkingPart.length > 0) {
                write({ type: "thinking", chunk: thinkingPart });
              }
              inCodePhase = true;
              write({ type: "phase", phase: "code" });
              const codePart = textToCheck.slice(htmlStart.contentStart);
              if (codePart.length > 0) {
                fullHtml += codePart;
                write({ type: "code", chunk: codePart });
              }
              thinkingBuffer = "";
            } else {
              thinkingBuffer += content;
            }
            return;
          }

          fullHtml += content;
          write({ type: "code", chunk: content });
        };

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() ?? "";

            const parseChunk = isAnthropicFormat
              ? parseAnthropicChunk
              : parseOpenAIChunk;

            for (const line of lines) {
              const result = parseChunk(line);
              if (result === "done") {
                if (!inCodePhase && thinkingBuffer.length > 0) {
                  flushThinking();
                }
                write({ type: "done", html: extractHtmlDocument(fullHtml) });
                controller.close();
                return;
              }
              if (result === null) continue;

              const parsedChunk = normalizeParsedChunk(result);
              if (parsedChunk.reasoningContent) {
                write({ type: "thinking", chunk: parsedChunk.reasoningContent });
              }
              if (parsedChunk.content) {
                handleContent(parsedChunk.content);
              }
            }
          }

          if (!inCodePhase && thinkingBuffer.length > 0) {
            flushThinking();
          }
          write({ type: "done", html: extractHtmlDocument(fullHtml) });
          controller.close();
        } catch (readError) {
          const msg =
            readError instanceof Error ? readError.message : "流读取错误";
          write({ type: "error", message: msg });
          controller.close();
        }
      } catch (error) {
        clearTimeout(timeoutId);

        let message: string;
        if (error instanceof DOMException && error.name === "AbortError") {
          message = `AI API 请求超时（${timeoutMs / 1000}秒）`;
        } else {
          message = error instanceof Error ? error.message : "未知错误";
        }

        write({ type: "error", message });
        controller.close();
      }
    },
  });
}
