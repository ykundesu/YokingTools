import { el } from "./dom";

export interface WorkspaceView {
  root: HTMLElement;
  input: HTMLTextAreaElement;
  output: HTMLTextAreaElement;
  outputArea: HTMLElement;
  preview: HTMLElement;
  status: HTMLSpanElement;
  stats: HTMLSpanElement;
  inputLines: HTMLElement;
  outputLines: HTMLElement;
  inputMeta: HTMLSpanElement;
  outputLabel: HTMLSpanElement;
  toolbarLeft: HTMLElement;
  toolbarRight: HTMLElement;
  copy: HTMLButtonElement;
}

export function lineNumbers(value: string): string {
  return Array.from({ length: Math.max(1, value.split("\n").length) }, (_unused, index) => String(index + 1)).join("\n");
}

export function createWorkspace(title: string, subtitle = ""): WorkspaceView {
  const input = el("textarea", { spellcheck: "false", "aria-label": "入力" });
  const output = el("textarea", { readonly: true, spellcheck: "false", "aria-label": "出力" });
  const inputLines = el("div", { className: "linenos" }, ["1"]);
  const outputLines = el("div", { className: "linenos" }, ["1"]);
  const preview = el("div", { className: "markdown-preview" });
  const outputArea = el("div", { className: "codearea", id: "outcode" }, [outputLines, output]);
  const copy = el("button", { type: "button", "aria-label": "結果をコピー" }, ["コピー ↗"]);
  const status = el("span", { className: "status-neutral" }, ["入力待ち"]);
  const stats = el("span", {}, [""]);
  const toolbarLeft = el("div", { className: "actions" });
  const toolbarRight = el("div", { className: "actions" });
  const workspace = el("section", { className: "workspace" }, [
    el("div", { className: "toolbar" }, [toolbarLeft, toolbarRight]),
    el("div", { className: "editorgrid" }, [
      el("div", { className: "editor" }, [
        el("div", { className: "editorhead" }, [el("span", {}, ["INPUT"]), el("span", { className: "input-meta" }, [subtitle])]),
        el("div", { className: "codearea" }, [inputLines, input]),
      ]),
      el("div", { className: "editor" }, [
        el("div", { className: "editorhead" }, [el("span", { className: "output-label" }, ["OUTPUT"]), copy]),
        outputArea,
        preview,
      ]),
    ]),
    el("div", { className: "bottomline" }, [status, stats, el("span", {}, ["UTF-8 · ローカル処理"])]),
  ]);
  const root = el("div", { className: "feature-wrap" }, [
    el("div", { className: "heading" }, [el("div", {}, [el("h1", {}, [title])]), el("div", { className: "keyhelp" }, [el("kbd", {}, ["Ctrl"]), el("kbd", {}, ["Enter"]), el("span", {}, ["で実行"])] )]),
    workspace,
  ]);
  const inputMeta = workspace.querySelector<HTMLSpanElement>(".input-meta");
  const outputLabel = workspace.querySelector<HTMLSpanElement>(".output-label");
  if (!inputMeta || !outputLabel) throw new Error("workspace labels missing");
  preview.hidden = true;
  return { root, input, output, outputArea, preview, status, stats, inputLines, outputLines, inputMeta, outputLabel, toolbarLeft, toolbarRight, copy };
}

export function updateWorkspaceLines(view: WorkspaceView): void {
  view.inputLines.textContent = lineNumbers(view.input.value);
  view.outputLines.textContent = lineNumbers(view.output.value);
}

export function setWorkspaceStatus(view: WorkspaceView, message: string, tone: "neutral" | "success" | "error" = "neutral"): void {
  view.status.textContent = message;
  view.status.className = tone === "success" ? "valid" : tone === "error" ? "error" : "status-neutral";
}

export function setWorkspaceStats(view: WorkspaceView, input: string, output: string): void {
  view.stats.textContent = `${new TextEncoder().encode(input).length} bytes → ${new TextEncoder().encode(output).length} bytes`;
}
