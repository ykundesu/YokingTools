import { describe, expect, it } from "vitest";
import { candidateDomainCollision, createPreview, diffManifests, MockPublicationRegistry, normalizeGithubSource, scanZipEntries } from "./logic";

describe("static publish safety and mock workflow", () => {
  it("detects ZIP Slip, symlink, secret candidates, and zip bomb ratio", () => {
    const findings = scanZipEntries([
      { path: "../escape.html", compressedSize: 10, uncompressedSize: 100 },
      { path: ".env", compressedSize: 1, uncompressedSize: 100 },
      { path: "link", compressedSize: 10, uncompressedSize: 10, isSymlink: true },
      { path: "huge.txt", compressedSize: 1, uncompressedSize: 10_000 },
    ]);
    expect(findings.map((finding) => finding.code)).toEqual(expect.arrayContaining(["zip_slip", "secret_candidate", "zip_symlink", "zip_bomb_ratio"]));
  });

  it("accepts only GitHub repo URLs and keeps branch/subdir explicit", () => {
    expect(normalizeGithubSource("https://github.com/acme/site", "main", "web")).toEqual({ repository: "https://github.com/acme/site", branch: "main", subdirectory: "web" });
    expect(normalizeGithubSource("https://evil.example/acme/site", "main", "")).toBeNull();
    expect(normalizeGithubSource("https://github.com/acme/site/tree/main/web", "main", "")).toBeNull();
  });

  it("shows diff and domain collision before one-shot mock execution", () => {
    const previous = [{ path: "index.html", size: 1, sha256: "a" }];
    const next = [{ path: "index.html", size: 1, sha256: "b" }, { path: "app.js", size: 2, sha256: "c" }];
    expect(diffManifests(previous, next)).toEqual({ added: ["app.js"], changed: ["index.html"], removed: [] });
    expect(candidateDomainCollision("WWW.Example.com", ["www.example.com"])).toBe("www.example.com");
  });

  it("is idempotent and distinguishes stop from permanent deletion", () => {
    const registry = new MockPublicationRegistry();
    const preview = createPreview({ kind: "html", label: "index.html" }, [{ path: "index.html", size: 1, sha256: "a" }]);
    const first = registry.publish(preview, "公開する");
    expect(registry.publish(preview, "公開する").id).toBe(first.id);
    expect(registry.stop(first.id, "stop-once").status).toBe("stopped");
    expect(registry.list()).toHaveLength(1);
  });
});
