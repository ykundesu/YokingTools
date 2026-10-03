import "../shared/ui/styles.css";
import { renderApp } from "../shared/ui/app-shell";
import { codecsFeature } from "../features/codecs/screen";
import { csvViewerFeature } from "../features/csv-viewer/screen";
import { hashFeature } from "../features/hash/screen";
import { jsonFormatterFeature } from "../features/json-formatter/screen";
import { markdownPreviewFeature } from "../features/markdown-preview/screen";
import { staticPublishFeature } from "../features/static-publish/screen";
import { timeConverterFeature } from "../features/time-converter/screen";

const root = document.querySelector<HTMLElement>("#app");
if (!root) throw new Error("#app が見つかりません。");

renderApp(root, [
  jsonFormatterFeature,
  markdownPreviewFeature,
  hashFeature,
  codecsFeature,
  csvViewerFeature,
  timeConverterFeature,
  staticPublishFeature,
]);
