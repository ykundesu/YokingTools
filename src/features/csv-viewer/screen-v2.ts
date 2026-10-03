import type { FeatureModule } from "../../shared/types";
import { createTable, el } from "../../shared/ui/dom";
import { createWorkspace, setWorkspaceStats, setWorkspaceStatus, updateWorkspaceLines } from "../../shared/ui/workspace";
import { parseCsv } from "./logic";

const SAMPLE = "name,description\n\"コト\",\"小さな作業\n毎日\"";

export const csvViewerFeatureV2: FeatureModule = {
  id: "csv-viewer",
  title: "CSV ビューア",
  description: "",
  render: renderCsvViewer,
};

function renderCsvViewer(container: HTMLElement): () => void {
  const view = createWorkspace(csvViewerFeatureV2.title, "CSV");
  const file = el("input", { className: "file-input", type: "file", accept: ".csv,text/csv", "aria-label": "CSV ファイル" });
  const runButton = el("button", { type: "button", className: "btn primary" }, ["CSVを表示"]);
  const sampleButton = el("button", { type: "button", className: "btn ghost" }, ["サンプル"]);
  const clearButton = el("button", { type: "button", className: "btn ghost" }, ["クリア"]);
  view.toolbarLeft.append(runButton, file);
  view.toolbarRight.append(sampleButton, clearButton);
  const render = (): void => {
    if (!view.input.value) { view.outputArea.replaceChildren(); view.output.value = ""; view.stats.textContent = ""; setWorkspaceStatus(view, "入力待ち"); return; }
    try {
      const rows = parseCsv(view.input.value);
      const headers = rows[0] ?? [];
      const table = createTable(headers, rows.slice(1).map((row) => headers.map((_header, index) => row[index] ?? "")));
      view.outputArea.replaceChildren(table);
      view.outputLabel.textContent = "TABLE";
      setWorkspaceStatus(view, `${rows.length} 行を読み込みました。`, "success");
      setWorkspaceStats(view, view.input.value, `${rows.length} rows`);
    } catch (error) {
      view.outputArea.replaceChildren();
      setWorkspaceStatus(view, error instanceof Error ? error.message : "CSV を解析できません。", "error");
    }
  };
  file.addEventListener("change", async () => {
    const selected = file.files?.[0];
    if (!selected) return;
    if (selected.size > 5_000_000) { setWorkspaceStatus(view, "CSV は 5 MB までです。", "error"); return; }
    view.input.value = await selected.text();
    updateWorkspaceLines(view);
    render();
  });
  runButton.addEventListener("click", render);
  sampleButton.addEventListener("click", () => { view.input.value = SAMPLE; updateWorkspaceLines(view); render(); });
  clearButton.addEventListener("click", () => { view.input.value = ""; view.outputArea.replaceChildren(view.outputLines, view.output); view.outputLabel.textContent = "OUTPUT"; view.stats.textContent = ""; setWorkspaceStatus(view, "入力待ち"); updateWorkspaceLines(view); view.input.focus(); });
  view.input.addEventListener("input", () => updateWorkspaceLines(view));
  container.replaceChildren(view.root);
  updateWorkspaceLines(view);
  return () => undefined;
}
