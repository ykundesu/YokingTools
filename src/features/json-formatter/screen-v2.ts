import type { FeatureModule } from "../../shared/types";
import { el } from "../../shared/ui/dom";
import { createWorkspace, setWorkspaceStats, setWorkspaceStatus, updateWorkspaceLines } from "../../shared/ui/workspace";
import { compactJson, formatJson } from "./logic";

const SAMPLE = '{"project":"YokingTools","version":"1.0.0","tools":["JSON","Markdown","Hash"],"privacy":{"localOnly":true,"uploads":false},"theme":"midnight"}';

export const jsonFormatterFeatureV2: FeatureModule = {
  id: "json-formatter",
  title: "JSON フォーマッター",
  description: "",
  render: renderJsonFormatter,
};

function renderJsonFormatter(container: HTMLElement): () => void {
  const view = createWorkspace(jsonFormatterFeatureV2.title, "JSON");
  const indent = el("select", { "aria-label": "インデント" }, [el("option", { value: "2" }, ["2 spaces"]), el("option", { value: "4" }, ["4 spaces"])]) as HTMLSelectElement;
  const indentLabel = el("label", {}, ["インデント", indent]);
  const runButton = el("button", { type: "button", className: "btn primary" }, ["整形する ↵"]);
  const compactButton = el("button", { type: "button", className: "btn" }, ["圧縮"]);
  const sampleButton = el("button", { type: "button", className: "btn ghost" }, ["サンプル"]);
  const clearButton = el("button", { type: "button", className: "btn ghost" }, ["クリア"]);
  view.toolbarLeft.append(runButton, compactButton, indentLabel);
  view.toolbarRight.append(sampleButton, clearButton);

  const run = (compact = false): void => {
    const result = compact ? compactJson(view.input.value) : formatJson(view.input.value, Number(indent.value));
    if (!result.ok) {
      view.output.value = "";
      setWorkspaceStatus(view, result.error ?? "入力を確認してください。", "error");
      view.stats.textContent = "出力なし";
    } else {
      view.output.value = result.value ?? "";
      setWorkspaceStatus(view, "● Valid JSON", "success");
      setWorkspaceStats(view, view.input.value, view.output.value);
    }
    updateWorkspaceLines(view);
  };
  runButton.addEventListener("click", () => run());
  compactButton.addEventListener("click", () => run(true));
  indent.addEventListener("change", () => { if (view.input.value) run(); });
  sampleButton.addEventListener("click", () => { view.input.value = SAMPLE; run(); });
  clearButton.addEventListener("click", () => { view.input.value = ""; view.output.value = ""; view.stats.textContent = ""; setWorkspaceStatus(view, "入力待ち"); updateWorkspaceLines(view); view.input.focus(); });
  view.input.addEventListener("input", () => updateWorkspaceLines(view));
  view.input.addEventListener("keydown", (event) => { if ((event.ctrlKey || event.metaKey) && event.key === "Enter") { event.preventDefault(); run(); } });
  view.copy.addEventListener("click", async () => { if (!view.output.value) return; try { await navigator.clipboard.writeText(view.output.value); setWorkspaceStatus(view, "コピーしました", "success"); } catch { setWorkspaceStatus(view, "出力欄から選択してください。", "error"); } });
  container.replaceChildren(view.root);
  updateWorkspaceLines(view);
  return () => undefined;
}
