import { button, createActionRow, createResultBox, createTextarea, el, featurePanel, setStatus } from "../../shared/ui/dom";
import type { FeatureModule } from "../../shared/types";
import { hashText, type HashAlgorithm } from "./logic";

export const hashFeature: FeatureModule = {
  id: "hash",
  title: "ハッシュ計算",
  description: "テキストをブラウザ内の Web Crypto API でハッシュ化します。入力は送信しません。",
  render: renderHash,
};

function renderHash(container: HTMLElement): () => void {
  const panel = featurePanel(hashFeature.title, hashFeature.description);
  const input = createTextarea("ハッシュ化するテキスト", 10);
  const algorithm = el("select", { className: "text-input" }, ["SHA-256", "SHA-1", "SHA-384", "SHA-512"].map((value) => el("option", { value }, [value])));
  const output = createResultBox();
  const run = async (): Promise<void> => {
    setStatus(panel.status, "計算しています…");
    try {
      output.textContent = await hashText(input.value, algorithm.value as HashAlgorithm);
      setStatus(panel.status, "計算が完了しました。", "success");
    } catch {
      setStatus(panel.status, "ハッシュ計算に失敗しました。", "error");
    }
  };
  panel.body.append(el("label", { className: "field-label" }, ["アルゴリズム", algorithm]), input, createActionRow([button("ハッシュ計算", () => void run(), "primary")]), output);
  container.replaceChildren(panel.root);
  return () => undefined;
}
