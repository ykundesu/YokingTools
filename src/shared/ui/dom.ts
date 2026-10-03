type AttributeValue = string | number | boolean | null | undefined;
type Child = Node | string | null | undefined;

export type ElementAttributes = Record<string, AttributeValue>;

export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attributes: ElementAttributes = {},
  children: Child[] = [],
): HTMLElementTagNameMap[K] {
  const element = document.createElement(tag);

  for (const [key, value] of Object.entries(attributes)) {
    if (value === null || value === undefined || value === false) {
      continue;
    }
    if (key === "className") {
      element.className = String(value);
    } else if (key === "textContent") {
      element.textContent = String(value);
    } else if (value === true) {
      element.setAttribute(key, "");
    } else {
      element.setAttribute(key, String(value));
    }
  }

  for (const child of children) {
    if (child instanceof Node) {
      element.append(child);
    } else if (child !== null && child !== undefined) {
      element.append(document.createTextNode(child));
    }
  }

  return element;
}

export function button(
  label: string,
  onClick: () => void,
  kind: "primary" | "secondary" | "quiet" = "secondary",
): HTMLButtonElement {
  const control = el("button", {
    type: "button",
    className: `button button-${kind}`,
  }, [label]);
  control.addEventListener("click", onClick);
  return control;
}

export function featurePanel(title: string, description: string): {
  root: HTMLElement;
  body: HTMLElement;
  status: HTMLParagraphElement;
} {
  const root = el("section", { className: "feature-panel", "aria-labelledby": "feature-title" });
  const heading = el("div", { className: "feature-heading" }, [
    el("div", {}, [
      el("p", { className: "eyebrow" }, ["TOOLBOX FEATURE"]),
      el("h2", { id: "feature-title" }, [title]),
      el("p", { className: "feature-description" }, [description]),
    ]),
  ]);
  const body = el("div", { className: "feature-body" });
  const status = el("p", { className: "status", role: "status", "aria-live": "polite" });
  root.append(heading, body, status);
  return { root, body, status };
}

export function setStatus(element: HTMLElement, message: string, tone: "neutral" | "success" | "error" = "neutral"): void {
  element.textContent = message;
  element.className = `status status-${tone}`;
}

export function createLabel(text: string, input: HTMLElement): HTMLLabelElement {
  const label = el("label", { className: "field-label" }, [text]);
  label.append(input);
  return label;
}

export function createTextInput(placeholder: string, value = ""): HTMLInputElement {
  return el("input", {
    className: "text-input",
    type: "text",
    placeholder,
    value,
    autocomplete: "off",
    spellcheck: "false",
  });
}

export function createTextarea(placeholder: string, rows = 10): HTMLTextAreaElement {
  return el("textarea", {
    className: "text-area",
    placeholder,
    rows,
    spellcheck: "false",
  });
}

export function createActionRow(children: Child[]): HTMLDivElement {
  return el("div", { className: "action-row" }, children);
}

export function createResultBox(): HTMLDivElement {
  return el("div", { className: "result-box" });
}

export function createTable(headers: string[], rows: string[][]): HTMLTableElement {
  const table = el("table", { className: "data-table" });
  const head = el("thead", {}, [el("tr", {}, headers.map((header) => el("th", { scope: "col" }, [header]))) ]);
  const body = el("tbody", {}, rows.map((row) => el("tr", {}, row.map((cell) => el("td", {}, [cell])))));
  table.append(head, body);
  return table;
}
