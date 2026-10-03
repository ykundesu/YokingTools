import type { FeatureModule } from "../../shared/types";
import { el } from "../../shared/ui/dom";

export const staticPublishFeatureV2: FeatureModule = {
  id: "static-publish",
  title: "デプロイ管理",
  description: "",
  render: renderStaticPublish,
};

function renderStaticPublish(container: HTMLElement): () => void {
  const panel = el("section", { className: "design-panel" }, [
    el("div", { className: "demo-banner" }, ["デザイン案です。この画面ではファイル送信・API通信・デプロイは実行されません。"]),
    el("div", { className: "dropzone" }, [
      el("div", { className: "design-icon", "aria-hidden": "true" }, ["↗"]),
      el("h2", {}, ["ファイルをここにドロップ"]),
      el("p", {}, ["レイアウトと操作導線の確認用"]),
      el("button", { type: "button", className: "btn primary", disabled: true }, ["実装後に利用できます"]),
    ]),
    el("div", { className: "chiprow" }, [el("span", { className: "chip" }, ["ZIP / HTML"]), el("span", { className: "chip" }, ["GitHub 連携"]), el("span", { className: "chip" }, ["本人限定"])]),
  ]);
  container.replaceChildren(panel);
  return () => undefined;
}
