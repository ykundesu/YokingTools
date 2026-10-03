import { button, createActionRow, createResultBox, createTable, createTextarea, el, featurePanel, setStatus } from "../../shared/ui/dom";
import type { FeatureModule } from "../../shared/types";
import { parseCsv } from "./logic";

export const csvViewerFeature: FeatureModule = {
  id: "csv-viewer",
  title: "CSV ビューア",
  description: "引用符・改行・Unicode を含む CSV をブラウザ内だけで読み込みます。ファイルは送信しません。",
  render: renderCsvViewer,
};

function renderCsvViewer(container: HTMLElement): () => void {
  const panel = featurePanel(csvViewerFeature.title, csvViewerFeature.description);
  const input = createTextarea("name,description\n\"山田\",\"複数行\nメモ\"", 10);
  const file = el("input", { className: "file-input", type: "file", accept: ".csv,text/csv" });
  const output = createResultBox();
  const render = (): void => {
    try {
      const rows = parseCsv(input.value);
      output.replaceChildren(createTable(rows[0] ?? [], rows.slice(1).map((row) => (rows[0] ?? []).map((_header, index) => row[index] ?? ""))));
      setStatus(panel.status, `${rows.length} 行を表示しました。`, "success");
    } catch (error) {
      output.replaceChildren();
      setStatus(panel.status, error instanceof Error ? error.message : "CSV を解析できません。", "error");
    }
  };
  file.addEventListener("change", async () => {
    const selected = file.files?.[0];
    if (!selected) return;
    if (selected.size > 5_000_000) {
      setStatus(panel.status, "CSV は 5 MB までです。", "error");
      return;
    }
    input.value = await selected.text();
    render();
  });
  panel.body.append(el("label", { className: "field-label" }, ["ローカル CSV ファイル（任意）", file]), input, createActionRow([button("CSV を表示", render, "primary")]), output);
  container.replaceChildren(panel.root);
  render();
  return () => undefined;
}
