export type SourceKind = "zip" | "html" | "github";
export type DeploymentMode = "workers-static-assets-direct" | "workers-builds-git";
export type PublicationStatus = "preview" | "active" | "stopped";

export interface ZipEntryMeta {
  path: string;
  compressedSize: number;
  uncompressedSize: number;
  isDirectory?: boolean;
  isSymlink?: boolean;
  isEncrypted?: boolean;
}

export interface SafetyFinding {
  severity: "error" | "warning";
  code: string;
  message: string;
  path?: string;
}

export interface GithubSource {
  repository: string;
  branch: string;
  subdirectory: string;
}

export interface StaticSource {
  kind: SourceKind;
  label: string;
  github?: GithubSource;
}

export interface FileManifest {
  path: string;
  size: number;
  sha256: string;
}

export interface FileDiff {
  added: string[];
  changed: string[];
  removed: string[];
}

export interface PublicationPreview {
  source: StaticSource;
  deploymentMode: DeploymentMode;
  files: FileManifest[];
  findings: SafetyFinding[];
  diff: FileDiff;
  requestedDomain: string | null;
  domainCollision: string | null;
  idempotencyKey: string;
  confirmationText: "公開する";
  impact: string[];
}

export interface PublicationRecord {
  id: string;
  source: StaticSource;
  deploymentMode: DeploymentMode;
  status: PublicationStatus;
  version: number;
  files: FileManifest[];
  domain: string | null;
  history: Array<{ action: string; version: number; at: string; idempotencyKey: string }>;
}

export const ZIP_LIMITS = {
  maxArchiveBytes: 20 * 1024 * 1024,
  maxEntries: 500,
  maxFileBytes: 5 * 1024 * 1024,
  maxTotalBytes: 50 * 1024 * 1024,
  maxCompressionRatio: 200,
} as const;

export function scanZipEntries(entries: ZipEntryMeta[]): SafetyFinding[] {
  const findings: SafetyFinding[] = [];
  if (entries.length > ZIP_LIMITS.maxEntries) findings.push({ severity: "error", code: "zip_entry_limit", message: `ZIP のファイル数が上限（${ZIP_LIMITS.maxEntries}）を超えています。` });
  let total = 0;
  for (const entry of entries) {
    const normalized = entry.path.replace(/\\/g, "/");
    const parts = normalized.split("/");
    const secretCandidate = /(^|\/)(\.env(?:\.|$)|\.git(?:\/|$)|.*(?:secret|credential|token|private[_-]?key).*)/i.test(normalized);
    if (normalized.startsWith("/") || parts.includes("..") || /^[A-Za-z]:/.test(normalized) || normalized.includes("\0")) findings.push({ severity: "error", code: "zip_slip", message: "展開先を外へ出すパスを拒否しました。", path: entry.path });
    if (entry.isSymlink) findings.push({ severity: "error", code: "zip_symlink", message: "シンボリックリンクを拒否しました。", path: entry.path });
    if (entry.isEncrypted) findings.push({ severity: "error", code: "zip_encrypted", message: "暗号化 ZIP エントリは検査できないため拒否しました。", path: entry.path });
    if (entry.uncompressedSize > ZIP_LIMITS.maxFileBytes) findings.push({ severity: "error", code: "zip_file_limit", message: `単一ファイルが上限（${ZIP_LIMITS.maxFileBytes / 1024 / 1024} MB）を超えています。`, path: entry.path });
    total += entry.uncompressedSize;
    if (!entry.isDirectory && entry.compressedSize === 0 && entry.uncompressedSize > 0 || entry.compressedSize > 0 && entry.uncompressedSize / entry.compressedSize > ZIP_LIMITS.maxCompressionRatio) findings.push({ severity: "error", code: "zip_bomb_ratio", message: "圧縮率が高すぎるため ZIP bomb の疑いがあります。", path: entry.path });
    if (secretCandidate) findings.push({ severity: "warning", code: "secret_candidate", message: "秘密情報を含む可能性があるファイル名です。公開対象から除外してください。", path: entry.path });
  }
  if (total > ZIP_LIMITS.maxTotalBytes) findings.push({ severity: "error", code: "zip_total_limit", message: `展開後の総量が上限（${ZIP_LIMITS.maxTotalBytes / 1024 / 1024} MB）を超えています。` });
  return findings;
}

export function normalizeGithubSource(repository: string, branch: string, subdirectory: string): GithubSource | null {
  try {
    const url = new URL(repository.trim());
    if (url.protocol !== "https:" || url.hostname.toLowerCase() !== "github.com" || url.username || url.password || url.search || url.hash) return null;
    const parts = url.pathname.split("/").filter(Boolean);
    if (parts.length !== 2 || parts.some((part) => !/^[A-Za-z0-9_.-]+$/.test(part)) || parts[1]?.toLowerCase().endsWith(".git")) return null;
    const cleanBranch = branch.trim();
    const cleanSubdirectory = subdirectory.trim().replace(/^\/+|\/+$/g, "");
    if (!cleanBranch || cleanBranch.length > 255 || cleanBranch.includes("..") || /[\0\\]/.test(cleanBranch)) return null;
    if (cleanSubdirectory.split("/").some((part) => part === ".." || part === "." || part.includes("\0"))) return null;
    return { repository: `https://github.com/${parts[0]}/${parts[1]}`, branch: cleanBranch, subdirectory: cleanSubdirectory };
  } catch {
    return null;
  }
}

export function analyzeHtml(source: string): SafetyFinding[] {
  const findings: SafetyFinding[] = [];
  if (source.length > 2_000_000) findings.push({ severity: "error", code: "html_size", message: "HTML は 2 MB までです。" });
  if (/<script\b/i.test(source) || /\bon[a-z]+\s*=/i.test(source)) findings.push({ severity: "warning", code: "html_active_content", message: "スクリプトまたはイベント属性を検出しました。プレビューは sandbox iframe で隔離します。" });
  if (/<(?:iframe|object|embed|form)\b/i.test(source)) findings.push({ severity: "warning", code: "html_embed", message: "埋め込み・フォーム要素を検出しました。公開前に影響を確認してください。" });
  return findings;
}

export function candidateDomainCollision(requested: string | null, existing: string[]): string | null {
  if (!requested) return null;
  const normalized = requested.trim().toLowerCase().replace(/\.$/, "");
  if (!normalized) return null;
  return existing.find((domain) => domain.toLowerCase().replace(/\.$/, "") === normalized) ?? null;
}

export function diffManifests(previous: FileManifest[], next: FileManifest[]): FileDiff {
  const before = new Map(previous.map((file) => [file.path, file.sha256]));
  const after = new Map(next.map((file) => [file.path, file.sha256]));
  return {
    added: [...after.keys()].filter((path) => !before.has(path)).sort(),
    changed: [...after.keys()].filter((path) => before.has(path) && before.get(path) !== after.get(path)).sort(),
    removed: [...before.keys()].filter((path) => !after.has(path)).sort(),
  };
}

export function makeIdempotencyKey(source: StaticSource, files: FileManifest[], domain: string | null): string {
  const basis = JSON.stringify({ source, files: files.map((file) => [file.path, file.sha256]), domain });
  let hash = 2166136261;
  for (let index = 0; index < basis.length; index += 1) hash = Math.imul(hash ^ basis.charCodeAt(index), 16777619);
  return `mock-${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

export function createPreview(source: StaticSource, files: FileManifest[], previous: FileManifest[] = [], requestedDomain: string | null = null, existingDomains: string[] = []): PublicationPreview {
  const findings = source.kind === "html" ? [] : [];
  const collision = candidateDomainCollision(requestedDomain, existingDomains);
  const deploymentMode: DeploymentMode = source.kind === "github" ? "workers-builds-git" : "workers-static-assets-direct";
  const impact = source.kind === "github"
    ? ["GitHub の repo/branch/subdir に継続的に紐づく Workers Builds を想定します。", "接続には Git プロバイダ権限と公開範囲の承認が必要です。"]
    : ["Workers Static Assets への直接公開を想定します。", "公開先 Worker、公開範囲、既存 DNS/TLS への影響を実行前に確認します。"];
  if (collision) impact.push(`ドメイン衝突: ${collision} は既存公開物に使われています。`);
  return { source, deploymentMode, files, findings, diff: diffManifests(previous, files), requestedDomain, domainCollision: collision, idempotencyKey: makeIdempotencyKey(source, files, requestedDomain), confirmationText: "公開する", impact };
}

export class MockPublicationRegistry {
  private readonly records = new Map<string, PublicationRecord>();
  private readonly idempotent = new Map<string, PublicationRecord>();

  list(): PublicationRecord[] {
    return [...this.records.values()];
  }

  publish(preview: PublicationPreview, confirmation: string, now = new Date().toISOString()): PublicationRecord {
    if (confirmation !== preview.confirmationText) throw new Error("公開確認文が一致しません。");
    if (preview.findings.some((finding) => finding.severity === "error")) throw new Error("安全チェックに失敗しています。");
    if (preview.domainCollision) throw new Error("ドメイン衝突を解消してから実行してください。");
    const existing = this.idempotent.get(preview.idempotencyKey);
    if (existing) return existing;
    const id = `mock-publication-${this.records.size + 1}`;
    const record: PublicationRecord = { id, source: preview.source, deploymentMode: preview.deploymentMode, status: "active", version: 1, files: preview.files, domain: preview.requestedDomain, history: [{ action: "publish", version: 1, at: now, idempotencyKey: preview.idempotencyKey }] };
    this.records.set(id, record);
    this.idempotent.set(preview.idempotencyKey, record);
    return record;
  }

  stop(id: string, idempotencyKey: string, now = new Date().toISOString()): PublicationRecord {
    const record = this.records.get(id);
    if (!record) throw new Error("公開物が見つかりません。");
    if (record.history.some((entry) => entry.idempotencyKey === idempotencyKey)) return record;
    record.status = "stopped";
    record.history.push({ action: "stop", version: record.version, at: now, idempotencyKey });
    return record;
  }

  update(id: string, preview: PublicationPreview, confirmation: string, now = new Date().toISOString()): PublicationRecord {
    if (confirmation !== preview.confirmationText) throw new Error("更新確認文が一致しません。");
    const record = this.records.get(id);
    if (!record) throw new Error("公開物が見つかりません。");
    if (preview.findings.some((finding) => finding.severity === "error")) throw new Error("安全チェックに失敗しています。");
    if (preview.domainCollision && preview.domainCollision !== record.domain) throw new Error("ドメイン衝突を解消してから実行してください。");
    const known = record.history.find((entry) => entry.idempotencyKey === preview.idempotencyKey);
    if (known) return record;
    record.files = preview.files;
    record.source = preview.source;
    record.deploymentMode = preview.deploymentMode;
    record.domain = preview.requestedDomain;
    record.version += 1;
    record.status = "active";
    record.history.push({ action: "update", version: record.version, at: now, idempotencyKey: preview.idempotencyKey });
    return record;
  }
}
