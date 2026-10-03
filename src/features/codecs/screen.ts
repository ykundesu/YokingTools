import { button, createActionRow, createResultBox, createTextarea, el, featurePanel, setStatus } from "../../shared/ui/dom";
import type { FeatureModule } from "../../shared/types";
import { transformCodec, type Codec } from "./logic";

export const codecsFeature: FeatureModule = {
  id: "codecs",
  title: "Base64 / URL / HTML",
  description: "Unicode 対応のエンコード・デコードをブラウザ内で行います。",
  render: renderCodecs,
};

function renderCodecs(container: HTMLElement): () => void {
  const panel = featurePanel(codecsFeature.title, codecsFeature.description);
  const input = createTextarea("変換する文字列", 9);
  const codec = el("select", { className: "text-input" }, [
    ["base64-encode", "Base64 エンコード"], ["base64-decode", "Base64 デコード"], ["url-encode", "URL エンコード"], ["url-decode", "URL デコード"], ["html-encode", "HTML エンコード"], ["html-decode", "HTML デコード"],
  ].map(([value, label]) => el("option", { value }, [label])));
  const output = createResultBox();
  const run = (): void => {
    try {
      output.textContent = transformCodec(input.value, codec.value as Codec);
      setStatus(panel.status, "変換が完了しました。", "success");
    } catch (error) {
      output.textContent = "";
      setStatus(panel.status, error instanceof Error ? error.message : "変換に失敗しました。", "error");
    }
  };
  panel.body.append(el("label", { className: "field-label" }, ["変換種別", codec]), input, createActionRow([button("変換", run, "primary")]), output);
  container.replaceChildren(panel.root);
  return () => undefined;
}
