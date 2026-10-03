import { describe, expect, it } from "vitest";
import { renderMarkdown } from "./logic";

describe("safe Markdown renderer", () => {
  it("escapes raw HTML and rejects javascript links", () => {
    const html = renderMarkdown('<script>alert("x")</script>\n\n[危険](javascript:alert(1))');
    expect(html).toContain("&lt;script&gt;");
    expect(html).not.toContain("<script");
    expect(html).not.toContain("javascript:");
  });

  it("keeps fenced code escaped", () => {
    expect(renderMarkdown("```html\n<div>safe</div>\n```")).toContain("&lt;div&gt;safe&lt;/div&gt;");
  });

  it("rejects protocol-relative links", () => {
    const html = renderMarkdown("[external](//evil.example/collect)");
    expect(html).not.toContain("evil.example");
  });
});
