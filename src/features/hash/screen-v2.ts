import type { FeatureModule } from "../../shared/types";
import { el } from "../../shared/ui/dom";
import { createWorkspace, setWorkspaceStats, setWorkspaceStatus, updateWorkspaceLines } from "../../shared/ui/workspace";
import { hashText, type HashAlgorithm } from "./logic";

const SAMPLE = "Hello, Yoking Tools.";

export const hashFeatureV2: FeatureModule = {
  id: "hash",
  title: "ハッシュ計算",
  description: "",
  render: renderHash,
};

function renderHash(container: HTMLElement): () => void {
  const view = createWorkspace(hashFeatureV2.title, "TEXT");
  const algorithm = el("select", { "aria-label": "ハッシュアルゴリズム" }, ["SHA-256", "SHA-1", "SHA-384", "SHA-512"].map((value) => el("option", { value }, [value]))) as HTMLSelectElement;
  const runButton = el("button", { type: "button", className: "btn primary" }, ["SHA-256を計算"]);
  const sampleButton = el("button", { type: "button", className: "btn ghost" }, ["サンプル"]);
  const clearButton = el("button", { type: "button", className: "btn ghost" }, ["クリア"]);
  view.toolbarLeft.append(runButton, algorithm);
  view.toolbarRight.append(sampleButton, clearButton);
  let sequence = 0;
  const run = async (): Promise<void> => {
    const current = ++sequence;
    if (!view.input.value) { view.output.value = ""; view.stats.textContent = ""; setWorkspaceStatus(view, "入力待ち"); updateWorkspaceLines(view); return; }
    setWorkspaceStatus(view, "計算中…");
    try {
      const result = await hashText(view.input.value, algorithm.value as HashAlgorithm);
      if (current !== sequence) return;
      view.output.value = result;
      setWorkspaceStatus(view, `● ${algorithm.value}`, "success");
      setWorkspaceStats(view, view.input.value, result);
      updateWorkspaceLines(view);
    } catch {
      if (current !== sequence) return;
      view.output.value = "";
      setWorkspaceStatus(view, "ハッシュ計算に失敗しました。", "error");
    }
  };
  runButton.addEventListener("click", () => void run());
  algorithm.addEventListener("change", () => { runButton.textContent = `${algorithm.value}を計算`; if (view.input.value) void run(); });
  sampleButton.addEventListener("click", () => { view.input.value = SAMPLE; void run(); });
  clearButton.addEventListener("click", () => { sequence += 1; view.input.value = ""; view.output.value = ""; view.stats.textContent = ""; setWorkspaceStatus(view, "入力待ち"); updateWorkspaceLines(view); view.input.focus(); });
  view.input.addEventListener("input", updateWorkspaceLines.bind(null, view));
  view.input.addEventListener("keydown", (event) => { if ((event.ctrlKey || event.metaKey) && event.key === "Enter") { event.preventDefault(); void run(); } });
  view.copy.addEventListener("click", async () => { if (!view.output.value) return; try { await navigator.clipboard.writeText(view.output.value); setWorkspaceStatus(view, "コピーしました", "success"); } catch { setWorkspaceStatus(view, "出力欄から選択してください。", "error"); } });
  container.replaceChildren(view.root);
  updateWorkspaceLines(view);
  return () => undefined;
}
