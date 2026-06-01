const HTML_CODE_FENCE_START = /^\s*```(?:html)?\s*/i;
const HTML_CODE_FENCE_END = /\s*```\s*$/;
const HTML_DOCUMENT_END = /<\/html\s*>/gi;

export function stripHtmlCodeFence(html: string): string {
  return html.replace(HTML_CODE_FENCE_START, "").replace(HTML_CODE_FENCE_END, "");
}

export function extractHtmlDocument(html: string): string {
  const unfencedHtml = stripHtmlCodeFence(html);
  const endMatches = [...unfencedHtml.matchAll(HTML_DOCUMENT_END)];
  const lastEndMatch = endMatches.at(-1);

  if (!lastEndMatch?.index) {
    return unfencedHtml;
  }

  return unfencedHtml.slice(
    0,
    lastEndMatch.index + lastEndMatch[0].length
  );
}

export function findHtmlStart(text: string):
  | { index: number; contentStart: number }
  | null {
  const codeFenceMatch = text.match(/```html\s*/i);
  if (codeFenceMatch?.index !== undefined) {
    return {
      index: codeFenceMatch.index,
      contentStart: codeFenceMatch.index + codeFenceMatch[0].length,
    };
  }

  const doctypeMatch = text.match(/<!DOCTYPE/i);
  if (doctypeMatch?.index !== undefined) {
    return {
      index: doctypeMatch.index,
      contentStart: doctypeMatch.index,
    };
  }

  const htmlMatch = text.match(/<html/i);
  if (htmlMatch?.index !== undefined) {
    return {
      index: htmlMatch.index,
      contentStart: htmlMatch.index,
    };
  }

  return null;
}
