const MAX_MARKDOWN_LENGTH = 100_000;

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character] ?? character);
}

function safeHref(value: string): string | null {
  const trimmed = value.trim();
  if (trimmed.startsWith("/") || trimmed.startsWith("#")) return trimmed;
  try {
    const url = new URL(trimmed);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null;
  } catch {
    return null;
  }
}

function inlineMarkdown(value: string): string {
  const tokens: string[] = [];
  let text = value.replace(/\[([^\]]{1,200})\]\(([^)\s]{1,2048})\)/g, (_match, label: string, href: string) => {
    const safe = safeHref(href);
    const renderedLabel = escapeHtml(label).replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    tokens.push(safe ? `<a href="${escapeHtml(safe)}" target="_blank" rel="noopener noreferrer">${renderedLabel}</a>` : renderedLabel);
    return `\u0001${tokens.length - 1}\u0001`;
  });
  text = text.replace(/`([^`\n]+)`/g, (_match, code: string) => {
    tokens.push(`<code>${escapeHtml(code)}</code>`);
    return `\u0001${tokens.length - 1}\u0001`;
  });
  let rendered = escapeHtml(text)
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/__([^_]+)__/g, "<strong>$1</strong>")
    .replace(/~~([^~]+)~~/g, "<del>$1</del>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(/_([^_]+)_/g, "<em>$1</em>");
  tokens.forEach((token, index) => {
    rendered = rendered.replace(`\u0001${index}\u0001`, token);
  });
  return rendered;
}

export function renderMarkdown(input: string): string {
  const source = input.slice(0, MAX_MARKDOWN_LENGTH).replace(/\r\n?/g, "\n");
  const lines = source.split("\n");
  const output: string[] = [];
  let paragraph: string[] = [];
  let list: string[] = [];
  let inCode = false;
  let codeLanguage = "";
  let codeLines: string[] = [];
  const flushParagraph = (): void => {
    if (paragraph.length) output.push(`<p>${inlineMarkdown(paragraph.join("\n").replace(/\n/g, "<br>"))}</p>`);
    paragraph = [];
  };
  const flushList = (): void => {
    if (list.length) output.push(`<ul>${list.map((item) => `<li>${inlineMarkdown(item)}</li>`).join("")}</ul>`);
    list = [];
  };
  const flushCode = (): void => {
    output.push(`<pre><code class="language-${escapeHtml(codeLanguage)}">${escapeHtml(codeLines.join("\n"))}</code></pre>`);
    codeLines = [];
    codeLanguage = "";
  };

  for (const line of lines) {
    if (line.startsWith("```")) {
      flushParagraph();
      flushList();
      if (inCode) flushCode();
      inCode = !inCode;
      codeLanguage = line.slice(3).trim().slice(0, 32);
      continue;
    }
    if (inCode) {
      codeLines.push(line);
      continue;
    }
    const heading = /^(#{1,3})\s+(.+)$/.exec(line);
    if (heading) {
      flushParagraph();
      flushList();
      const level = heading[1]?.length ?? 1;
      output.push(`<h${level}>${inlineMarkdown(heading[2] ?? "")}</h${level}>`);
      continue;
    }
    const unordered = /^[-*]\s+(.+)$/.exec(line);
    if (unordered) {
      flushParagraph();
      list.push(unordered[1] ?? "");
      continue;
    }
    if (!line.trim()) {
      flushParagraph();
      flushList();
      continue;
    }
    if (line.startsWith("> ")) {
      flushParagraph();
      flushList();
      output.push(`<blockquote>${inlineMarkdown(line.slice(2))}</blockquote>`);
      continue;
    }
    paragraph.push(line);
  }
  if (inCode) flushCode();
  flushParagraph();
  flushList();
  return output.join("");
}
