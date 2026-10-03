import { button, createActionRow, createTextarea, el, featurePanel, setStatus } from "../../shared/ui/dom";
import type { FeatureModule } from "../../shared/types";
import { renderMarkdown } from "./logic";

export const markdownPreviewFeature: FeatureModule = {
  id: "markdown-preview",
  title: "Markdown プレビュー",
  description: "生 HTML は許可せず、安全なサブセットだけを表示します。リンクも http(s) と相対リンクに限定します。",
  render: renderMarkdownPreview,
};

function renderMarkdownPreview(container: HTMLElement): () => void {
  const panel = featurePanel(markdownPreviewFeature.title, markdownPreviewFeature.description);
  const input = createTextarea("# 見出し\n\n**太字** と [Cloudflare](https://developers.cloudflare.com/)", 12);
  const preview = el("article", { className: "markdown-preview" });
  const render = (): void => {
    preview.innerHTML = renderMarkdown(input.value);
    setStatus(panel.status, "プレビューを更新しました。", "success");
  };
  panel.body.append(input, createActionRow([button("プレビューを更新", render, "primary")]), preview);
  container.replaceChildren(panel.root);
  render();
  return () => undefined;
}
