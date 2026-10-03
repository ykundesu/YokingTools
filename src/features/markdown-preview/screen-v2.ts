import type { FeatureModule } from "../../shared/types";
import { el } from "../../shared/ui/dom";
import { createWorkspace, setWorkspaceStats, setWorkspaceStatus, updateWorkspaceLines } from "../../shared/ui/workspace";
import { renderMarkdown } from "./logic";

const SAMPLE = "# Yoking Tools\n\n毎日の小さな作業を、ひとつの場所に。\n\n## ブラウザだけで完結\n\n- ファイルを送信しない\n- すぐに使える\n- コピーして次の作業へ";

export const markdownPreviewFeatureV2: FeatureModule = {
  id: "markdown-preview",
  title: "Markdown プレビュー",
  description: "",
  render: renderMarkdownPreview,
};

function renderMarkdownPreview(container: HTMLElement): () => void {
  const view = createWorkspace(markdownPreviewFeatureV2.title, "Markdown");
  const previewButton = el("button", { type: "button", className: "btn primary" }, ["プレビュー"]);
  const sampleButton = el("button", { type: "button", className: "btn ghost" }, ["サンプル"]);
  const clearButton = el("button", { type: "button", className: "btn ghost" }, ["クリア"]);
  view.toolbarLeft.append(previewButton);
  view.toolbarRight.append(sampleButton, clearButton);
  view.outputArea.hidden = true;

  const run = (): void => {
    if (!view.input.value) {
      view.preview.replaceChildren();
      setWorkspaceStatus(view, "入力待ち");
      view.stats.textContent = "";
      return;
    }
    view.preview.innerHTML = renderMarkdown(view.input.value);
    view.preview.hidden = false;
    setWorkspaceStatus(view, "● Preview ready", "success");
    setWorkspaceStats(view, view.input.value, view.preview.textContent ?? "");
    updateWorkspaceLines(view);
  };
  previewButton.addEventListener("click", run);
  sampleButton.addEventListener("click", () => { view.input.value = SAMPLE; run(); });
  clearButton.addEventListener("click", () => { view.input.value = ""; view.preview.replaceChildren(); view.stats.textContent = ""; setWorkspaceStatus(view, "入力待ち"); updateWorkspaceLines(view); view.input.focus(); });
  view.input.addEventListener("input", () => { updateWorkspaceLines(view); if (view.input.value) run(); });
  view.input.addEventListener("keydown", (event) => { if ((event.ctrlKey || event.metaKey) && event.key === "Enter") { event.preventDefault(); run(); } });
  view.copy.addEventListener("click", async () => { const value = view.preview.textContent ?? ""; if (!value) return; try { await navigator.clipboard.writeText(value); setWorkspaceStatus(view, "コピーしました", "success"); } catch { setWorkspaceStatus(view, "プレビューから選択してください。", "error"); } });
  container.replaceChildren(view.root);
  updateWorkspaceLines(view);
  return () => undefined;
}
