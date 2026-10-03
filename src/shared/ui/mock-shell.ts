import type { FeatureModule } from "../types";
import { el } from "./dom";

function appendNavGroup(
  nav: HTMLElement,
  label: string,
  features: FeatureModule[],
  activate: (feature: FeatureModule) => void,
  allFeatures: FeatureModule[],
): void {
  nav.append(el("div", { className: "group" }, [label]));
  const group = el("div", { className: "nav", role: "tablist" });
  for (const feature of features) {
    const index = allFeatures.indexOf(feature) + 1;
    const control = el("button", {
      type: "button",
      className: "nav-button",
      role: "tab",
      "data-tool": feature.id,
      "aria-selected": String(index === 1),
    }, [
      el("i", { "aria-hidden": "true" }, [feature.id === "json-formatter" ? "{ }" : feature.id === "markdown-preview" ? "↓" : feature.id === "hash" ? "#" : feature.id === "codecs" ? "⇄" : feature.id === "csv-viewer" ? "▦" : feature.id === "time-converter" ? "◷" : feature.id === "static-publish" ? "↗" : "◎"]),
      el("span", {}, [feature.title]),
      ...(feature.id === "csv-viewer" || feature.id === "time-converter" || feature.id === "static-publish" || feature.id === "dns" ? [el("small", {}, [feature.id === "static-publish" ? "管理" : "案"])] : []),
    ]);
    control.addEventListener("click", () => activate(feature));
    group.append(control);
  }
  nav.append(group);
}

export function renderMockApp(root: HTMLElement, features: FeatureModule[]): void {
  root.replaceChildren();
  const app = el("div", { className: "app", id: "app" });
  const sidebar = el("aside", { className: "sidebar", "aria-label": "ツール一覧" });
  const brand = el("div", { className: "brand" }, [
    el("div", { className: "mark", "aria-hidden": "true" }, ["y."]),
    el("div", {}, ["Yoking ", el("span", {}, ["Tools"])]),
  ]);
  const search = el("label", { className: "search" }, [
    el("span", { "aria-hidden": "true" }, ["⌕"]),
    el("input", { id: "tool-search", placeholder: "ツールを検索", "aria-label": "ツールを検索" }),
    el("kbd", {}, ["⌘ K"]),
  ]);
  const nav = el("nav", { id: "tool-nav", "aria-label": "ツール" });
  const primary = features.filter((feature) => feature.id !== "static-publish" && feature.id !== "dns");
  const infrastructure = features.filter((feature) => feature.id === "static-publish" || feature.id === "dns");
  const main = el("main", { className: "main" });
  const crumb = el("strong", { id: "crumb" }, [features[0]?.title ?? "Yoking Tools"]);
  const featureRoot = el("div", { id: "active-feature" });
  const content = el("div", { className: "content" }, [featureRoot]);
  let cleanup: () => void = () => undefined;
  let active = features[0];

  const setSelected = (): void => {
    for (const control of nav.querySelectorAll<HTMLButtonElement>("button[data-tool]")) {
      control.setAttribute("aria-selected", String(control.dataset.tool === active?.id));
    }
  };
  const activate = (feature: FeatureModule): void => {
    cleanup();
    active = feature;
    crumb.textContent = feature.title;
    featureRoot.replaceChildren();
    cleanup = feature.render(featureRoot);
    setSelected();
    app.classList.remove("menuopen");
  };

  appendNavGroup(nav, "WORKSPACE", primary, activate, features);
  appendNavGroup(nav, "INFRASTRUCTURE", infrastructure, activate, features);
  const footer = el("footer", {}, [el("span", {}, ["デザイン確認用"]), el("span", { className: "status-line" }, [el("span", { className: "status-dot", "aria-hidden": "true" }), "browser-only / local"])]);
  sidebar.append(brand, search, nav, footer);

  const mobileMenu = el("button", { type: "button", id: "menu", className: "mobilemenu", "aria-label": "メニュー" }, ["☰"]);
  const theme = el("button", { type: "button", id: "theme", className: "theme", "aria-label": "配色を切り替える" }, ["◐"]);
  const topbar = el("header", { className: "topbar" }, [
    el("div", { className: "crumb" }, [mobileMenu, el("span", {}, ["Workspace /"]), crumb]),
    el("div", { className: "topright" }, [el("span", { className: "pill" }, ["デザイン確認用"]), theme]),
  ]);
  main.append(topbar, content);
  app.append(sidebar, main);
  root.append(app);

  const searchInput = search.querySelector<HTMLInputElement>("input");
  searchInput?.addEventListener("input", () => {
    const query = searchInput.value.toLowerCase();
    for (const control of nav.querySelectorAll<HTMLButtonElement>("button[data-tool]")) control.hidden = !control.textContent?.toLowerCase().includes(query);
  });
  mobileMenu.addEventListener("click", () => app.classList.toggle("menuopen"));
  theme.addEventListener("click", () => document.body.classList.toggle("light"));
  document.addEventListener("keydown", (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
      event.preventDefault();
      app.classList.add("menuopen");
      searchInput?.focus();
    }
    if (event.key === "Escape") app.classList.remove("menuopen");
  });
  activate(active);
}
