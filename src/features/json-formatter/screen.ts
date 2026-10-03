import { button, createActionRow, createResultBox, createTextarea, featurePanel, setStatus } from "../../shared/ui/dom";
import type { FeatureModule } from "../../shared/types";
import { compactJson, formatJson } from "./logic";

export const jsonFormatterFeature: FeatureModule = {
  id: "json-formatter",
  title: "JSON 整形",
  description: "入力はブラウザ内で解析します。整形・圧縮の結果を必要な場所へコピーしてください。",
  render: renderJsonFormatter,
};

function renderJsonFormatter(container: HTMLElement): () => void {
  const panel = featurePanel(jsonFormatterFeature.title, jsonFormatterFeature.description);
  const input = createTextarea('{"hello":"world"}', 12);
  const output = createResultBox();
  output.classList.add("code-output");
  const run = (compact: boolean): void => {
    const result = compact ? compactJson(input.value) : formatJson(input.value);
    output.textContent = result.ok ? result.value ?? "" : result.error ?? "解析できません。";
    setStatus(panel.status, result.ok ? "変換が完了しました。" : result.error ?? "JSON を解析できません。", result.ok ? "success" : "error");
  };
  panel.body.append(input, createActionRow([button("整形", () => run(false), "primary"), button("圧縮", () => run(true)), button("入力を消去", () => { input.value = ""; output.textContent = ""; setStatus(panel.status, ""); }, "quiet")]), output);
  container.replaceChildren(panel.root);
  return () => undefined;
}
