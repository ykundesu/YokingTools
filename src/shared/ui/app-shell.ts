import type { FeatureModule } from "../types";
import { el } from "./dom";

export function renderApp(root: HTMLElement, features: FeatureModule[]): void {
  root.replaceChildren();
  const shell = el("div", { className: "app-shell" });
  const header = el("header", { className: "app-header" }, [
    el("div", { className: "brand" }, [
      el("span", { className: "brand-mark", "aria-hidden": "true" }, ["✦"]),
      el("div", {}, [
        el("p", { className: "eyebrow" }, ["PERSONAL WORKERS TOOLBOX"]),
        el("h1", {}, ["手元で完結する Web ツール集"]),
      ]),
    ]),
    el("p", { className: "privacy-note" }, ["入力は保存せず、変換系はブラウザ内で処理"]),
  ]);

  const layout = el("div", { className: "app-layout" });
  const sidebar = el("aside", { className: "tool-nav", "aria-label": "ツール一覧" });
  const mobileLabel = el("label", { className: "mobile-tool-select" }, ["ツールを選択"]);
  const mobileSelect = el("select", { className: "tool-select", "aria-label": "ツールを選択" });
  mobileLabel.append(mobileSelect);
  sidebar.append(mobileLabel);
  const navList = el("div", { className: "tool-nav-list", role: "tablist", "aria-label": "ツール" });
  const content = el("main", { className: "tool-content" });
  const intro = el("div", { className: "content-intro" }, [
    el("p", { className: "eyebrow" }, ["LOCAL-FIRST WORKSPACE"]),
    el("p", {}, ["外部照会は必要なときだけ固定プロバイダへ接続します。結果はこの画面にのみ表示します。"]),
  ]);
  content.append(intro);

  let cleanup = (): void => undefined;
  const activate = (index: number): void => {
    const feature = features[index];
    if (!feature) return;
    cleanup();
    cleanup = feature.render(content);
    for (const [buttonIndex, control] of Array.from(navList.children).entries()) {
      control.setAttribute("aria-selected", String(buttonIndex === index));
    }
    mobileSelect.value = feature.id;
  };

  features.forEach((feature, index) => {
    const control = el("button", {
      type: "button",
      className: "tool-nav-button",
      role: "tab",
      "aria-selected": String(index === 0),
      "aria-controls": "active-feature",
    }, [el("span", { className: "tool-nav-index" }, [String(index + 1).padStart(2, "0")]), el("span", {}, [feature.title])]);
    control.addEventListener("click", () => activate(index));
    navList.append(control);
    mobileSelect.append(el("option", { value: feature.id }, [feature.title]));
  });
  mobileSelect.addEventListener("change", () => {
    const index = features.findIndex((feature) => feature.id === mobileSelect.value);
    if (index >= 0) activate(index);
  });

  sidebar.append(navList, el("div", { className: "sidebar-footnote" }, [
    el("strong", {}, ["安全境界"]),
    el("span", {}, ["公開情報のみ・任意 URL の直接取得なし"]),
  ]));
  layout.append(sidebar, content);
  shell.append(header, layout);
  root.append(shell);
  activate(0);
}
