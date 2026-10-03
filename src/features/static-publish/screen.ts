import { button, createActionRow, createResultBox, createTable, createTextInput, createTextarea, el, featurePanel, setStatus } from "../../shared/ui/dom";
import type { FeatureModule } from "../../shared/types";
import { analyzeHtml, createPreview, MockPublicationRegistry, normalizeGithubSource, type FileManifest, type PublicationPreview, type SourceKind } from "./logic";
import { unzipSafe } from "./zip";

export const staticPublishFeature: FeatureModule = {
  id: "static-publish",
  title: "静的サイト公開準備",
  description: "ZIP / HTML は直接 Static Assets 公開、GitHub は repo/branch/subdir に継続接続する設計です。ここでは安全解析とモックだけを行います。",
  render: renderStaticPublish,
};

const registry = new MockPublicationRegistry();

function hashBytes(bytes: Uint8Array): string {
  let hash = 2166136261;
  for (const byte of bytes) hash = Math.imul(hash ^ byte, 16777619);
  return (hash >>> 0).toString(16).padStart(8, "0");
}

function manifestFromFiles(files: Record<string, Uint8Array>): FileManifest[] {
  return Object.entries(files).filter(([path]) => !path.endsWith("/")).map(([path, bytes]) => ({ path, size: bytes.byteLength, sha256: `local-${hashBytes(bytes)}` })).sort((left, right) => left.path.localeCompare(right.path));
}

function renderStaticPublish(container: HTMLElement): () => void {
  const panel = featurePanel(staticPublishFeature.title, staticPublishFeature.description);
  const sourceType = el("select", { className: "text-input" }, [["zip", "ZIP ファイル"], ["html", "HTML ファイル"], ["github", "GitHub リポジトリ"],].map(([value, label]) => el("option", { value }, [label])));
  const archive = el("input", { className: "file-input", type: "file", accept: ".zip,application/zip" });
  const html = createTextarea("<!doctype html>\n<html lang=\"ja\">…", 10);
  const htmlFile = el("input", { className: "file-input", type: "file", accept: ".html,text/html" });
  const repository = createTextInput("https://github.com/owner/repository");
  const branch = createTextInput("main", "main");
  const subdirectory = createTextInput("任意（例: site）");
  const domain = createTextInput("任意の公開ホスト名（変更時は DNS/TLS 確認）");
  const output = createResultBox();

  const toggleSource = (): void => {
    const kind = sourceType.value as SourceKind;
    archive.hidden = kind !== "zip";
    html.hidden = kind !== "html";
    htmlFile.hidden = kind !== "html";
    repository.hidden = kind !== "github";
    branch.hidden = kind !== "github";
    subdirectory.hidden = kind !== "github";
  };
  const renderRegistry = (): void => {
    const records = registry.list();
    const list = el("div", { className: "publication-list" });
    if (!records.length) list.append(el("p", { className: "muted" }, ["モック公開物はまだありません。実アカウントには接続していません。"]));
    for (const record of records) {
      const stop = button(record.status === "active" ? "公開停止（モック）" : "停止済み", () => {
        if (record.status === "active") {
          registry.stop(record.id, `stop-${record.id}-${record.version}`);
          renderRegistry();
          setStatus(panel.status, "公開停止をモック実行しました。永久削除とは別操作です。", "success");
        }
      }, record.status === "active" ? "secondary" : "quiet");
      stop.disabled = record.status !== "active";
      list.append(el("article", { className: "publication-item" }, [
        el("div", {}, [el("strong", {}, [record.id]), el("span", { className: "badge" }, [record.status]), el("p", {}, [`方式: ${record.deploymentMode}`]), el("p", {}, [`source: ${record.source.kind === "github" ? `${record.source.github?.repository} / ${record.source.github?.branch} / ${record.source.github?.subdirectory || "(root)"}` : record.source.label}`]), el("p", {}, [`version ${record.version} / ${record.files.length} files / domain ${record.domain ?? "未設定"}`])]), stop,
      ]));
    }
    output.append(el("h3", {}, ["公開物一覧（モック）"]), list);
  };
  const renderPreview = (next: PublicationPreview): void => {
    output.replaceChildren();
    const findings = next.findings.length ? createTable(["種別", "内容", "対象"], next.findings.map((finding) => [finding.severity, finding.message, finding.path ?? "—"])) : el("p", { className: "success-line" }, ["安全チェック上のエラーはありません。"]);
    const diffRows = [["追加", String(next.diff.added.length), next.diff.added.slice(0, 5).join(", ") || "—"], ["変更", String(next.diff.changed.length), next.diff.changed.slice(0, 5).join(", ") || "—"], ["削除", String(next.diff.removed.length), next.diff.removed.slice(0, 5).join(", ") || "—"]];
    const confirm = createTextInput("公開する");
    const publish = button("確認してモック公開", () => {
      try {
        const record = registry.publish(next, confirm.value);
        setStatus(panel.status, `モック公開しました（${record.id}）。実アカウントには反映していません。`, "success");
        renderRegistry();
      } catch (error) {
        setStatus(panel.status, error instanceof Error ? error.message : "公開できません。", "error");
      }
    }, "primary");
    output.append(el("h3", {}, ["公開前プレビュー"]), el("p", {}, [`方式: ${next.deploymentMode} / idempotency: ${next.idempotencyKey}`]), createTable(["差分", "件数", "例"], diffRows), el("ul", { className: "impact-list" }, next.impact.map((item) => el("li", {}, [item]))), findings, el("label", { className: "field-label" }, ["実行確認（モック）", confirm]), createActionRow([publish]));
    if (next.source.kind === "html") {
      const sourceText = html.value.slice(0, 2_000_000);
      const frame = el("iframe", { className: "isolated-preview", sandbox: "", title: "隔離 HTML プレビュー" });
      frame.setAttribute("referrerpolicy", "no-referrer");
      frame.srcdoc = `<!doctype html><html><head><meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data:; media-src data:; font-src data:; style-src 'unsafe-inline';"></head><body>${sourceText}</body></html>`;
      output.append(el("h3", {}, ["隔離プレビュー"]), frame);
    }
  };
  const analyze = async (): Promise<void> => {
    output.replaceChildren();
    setStatus(panel.status, "ソースをローカル解析しています…");
    const kind = sourceType.value as SourceKind;
    let source: { kind: SourceKind; label: string; github?: { repository: string; branch: string; subdirectory: string } };
    let files: FileManifest[];
    let findings = [] as ReturnType<typeof analyzeHtml>;
    if (kind === "github") {
      const github = normalizeGithubSource(repository.value, branch.value, subdirectory.value);
      if (!github) {
        setStatus(panel.status, "GitHub の URL / branch / subdir が不正です。GitHub へは接続していません。", "error");
        return;
      }
      source = { kind, label: "GitHub 継続連携（未接続）", github };
      files = [{ path: github.subdirectory ? `${github.subdirectory}/<Workers Builds で取得>` : "<Workers Builds で取得>", size: 0, sha256: "pending" }];
    } else if (kind === "html") {
      const selected = htmlFile.files?.[0];
      if (selected) {
        if (selected.size > 2_000_000) {
          setStatus(panel.status, "HTML は 2 MB までです。", "error");
          return;
        }
        html.value = await selected.text();
      }
      const bytes = new TextEncoder().encode(html.value);
      source = { kind, label: selected?.name ?? "入力 HTML" };
      files = [{ path: "index.html", size: bytes.byteLength, sha256: `local-${hashBytes(bytes)}` }];
      findings = analyzeHtml(html.value);
    } else {
      const selected = archive.files?.[0];
      if (!selected) {
        setStatus(panel.status, "ZIP ファイルを選択してください。", "error");
        return;
      }
      const bytes = new Uint8Array(await selected.arrayBuffer());
      const result = unzipSafe(bytes);
      findings = result.findings;
      files = manifestFromFiles(result.files);
      source = { kind, label: selected.name };
    }
    const next = createPreview(source, files, [], domain.value.trim() || null, registry.list().flatMap((record) => record.domain ? [record.domain] : []));
    next.findings.push(...findings);
    renderPreview(next);
    setStatus(panel.status, "公開前プレビューを作成しました。", "success");
  };
  archive.hidden = true;
  html.hidden = true;
  htmlFile.hidden = true;
  repository.hidden = true;
  branch.hidden = true;
  subdirectory.hidden = true;
  sourceType.addEventListener("change", toggleSource);
  panel.body.append(el("div", { className: "notice notice-warning" }, ["モック専用: ここでは実アカウントの upload / deploy / DNS 変更は行いません。ZIP/HTML は Static Assets 直接公開、GitHub は継続 Git 連携としてプレビューします。"]), el("label", { className: "field-label" }, ["ソース方式", sourceType]), archive, htmlFile, html, repository, branch, subdirectory, domain, createActionRow([button("安全解析と差分プレビュー", () => void analyze(), "primary")]), output);
  container.replaceChildren(panel.root);
  renderRegistry();
  return () => undefined;
}
