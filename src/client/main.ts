import "../shared/ui/mock-styles.css";
import { renderMockApp } from "../shared/ui/mock-shell";
import { codecsFeatureV2 } from "../features/codecs/screen-v2";
import { csvViewerFeatureV2 } from "../features/csv-viewer/screen-v2";
import { hashFeatureV2 } from "../features/hash/screen-v2";
import { jsonFormatterFeatureV2 } from "../features/json-formatter/screen-v2";
import { markdownPreviewFeatureV2 } from "../features/markdown-preview/screen-v2";
import { staticPublishFeatureV2 } from "../features/static-publish/screen-v2";
import { timeConverterFeatureV2 } from "../features/time-converter/screen-v2";
import { el } from "../shared/ui/dom";
import type { FeatureModule } from "../shared/types";

const root = document.querySelector<HTMLElement>("#app");
if (!root) throw new Error("#app が見つかりません。");

const dnsDesignFeature: FeatureModule = {
  id: "dns",
  title: "DNS・ドメイン",
  description: "公開版ではサーバー lookup と外部 API 通信を無効化しています。",
  render: (container) => {
    const panel = el("section", { className: "design-panel" }, [
      el("div", { className: "demo-banner" }, ["デザイン案です。この画面では API 通信・外部 lookup は実行されません。"]),
      el("div", { className: "dropzone" }, [
        el("div", { className: "design-icon", "aria-hidden": "true" }, ["◎"]),
        el("h2", {}, ["ドメインから、必要な情報へ"]),
        el("p", {}, ["レイアウトと操作導線の確認用"]),
        el("button", { type: "button", className: "btn primary", disabled: true }, ["実装後に利用できます"]),
      ]),
      el("div", { className: "chiprow" }, [el("span", { className: "chip" }, ["シンプルな入力"]), el("span", { className: "chip" }, ["読みやすい結果"]), el("span", { className: "chip" }, ["公開 lookup 無効"])]),
    ]);
    container.replaceChildren(panel);
    return () => undefined;
  },
};

renderMockApp(root, [
  jsonFormatterFeatureV2,
  markdownPreviewFeatureV2,
  hashFeatureV2,
  codecsFeatureV2,
  csvViewerFeatureV2,
  timeConverterFeatureV2,
  dnsDesignFeature,
  staticPublishFeatureV2,
]);
