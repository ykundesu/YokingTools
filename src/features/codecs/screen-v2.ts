import type { FeatureModule } from "../../shared/types";
import { el } from "../../shared/ui/dom";
import { createWorkspace, setWorkspaceStats, setWorkspaceStatus, updateWorkspaceLines } from "../../shared/ui/workspace";
import { transformCodec, type Codec } from "./logic";

const SAMPLE = "こんにちは、Yoking Tools。";

export const codecsFeatureV2: FeatureModule = {
  id: "codecs",
  title: "Base64 変換",
  description: "",
  render: renderCodecs,
};

function renderCodecs(container: HTMLElement): () => void {
  const view = createWorkspace(codecsFeatureV2.title, "TEXT");
  const codec = el("select", { "aria-label": "変換方式" }, [
    ["base64-encode", "Base64 エンコード"],
    ["base64-decode", "Base64 デコード"],
    ["url-encode", "URL エンコード"],
    ["url-decode", "URL デコード"],
    ["html-encode", "HTML エンコード"],
    ["html-decode", "HTML デコード"],
  ].map(([value, label]) => el("option", { value }, [label]))) as HTMLSelectElement;
  const runButton = el("button", { type: "button", className: "btn primary" }, ["エンコード"]);
  const sampleButton = el("button", { type: "button", className: "btn ghost" }, ["サンプル"]);
  const clearButton = el("button", { type: "button", className: "btn ghost" }, ["クリア"]);
  view.toolbarLeft.append(runButton, codec);
  view.toolbarRight.append(sampleButton, clearButton);
  const updateButton = (): void => { runButton.textContent = codec.value.endsWith("decode") ? "デコード" : "エンコード"; };
  const run = (): void => {
    if (!view.input.value) { view.output.value = ""; view.stats.textContent = ""; setWorkspaceStatus(view, "入力待ち"); updateWorkspaceLines(view); return; }
    try {
      view.output.value = transformCodec(view.input.value, codec.value as Codec);
      setWorkspaceStatus(view, "● 変換完了", "success");
      setWorkspaceStats(view, view.input.value, view.output.value);
    } catch (error) {
      view.output.value = "";
      view.stats.textContent = "出力なし";
      setWorkspaceStatus(view, error instanceof Error ? error.message : "変換に失敗しました。", "error");
    }
    updateWorkspaceLines(view);
  };
  runButton.addEventListener("click", run);
  codec.addEventListener("change", () => { updateButton(); if (view.input.value) run(); });
  sampleButton.addEventListener("click", () => { view.input.value = codec.value.endsWith("decode") ? "44GT44KT44Gr44Gh44Gv44CBWW9raW5nIFRvb2xzLg==" : SAMPLE; run(); });
  clearButton.addEventListener("click", () => { view.input.value = ""; view.output.value = ""; view.stats.textContent = ""; setWorkspaceStatus(view, "入力待ち"); updateWorkspaceLines(view); view.input.focus(); });
  view.input.addEventListener("input", () => updateWorkspaceLines(view));
  view.input.addEventListener("keydown", (event) => { if ((event.ctrlKey || event.metaKey) && event.key === "Enter") { event.preventDefault(); run(); } });
  view.copy.addEventListener("click", async () => { if (!view.output.value) return; try { await navigator.clipboard.writeText(view.output.value); setWorkspaceStatus(view, "コピーしました", "success"); } catch { setWorkspaceStatus(view, "出力欄から選択してください。", "error"); } });
  container.replaceChildren(view.root);
  updateButton();
  updateWorkspaceLines(view);
  return () => undefined;
}
