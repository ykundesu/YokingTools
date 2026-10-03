import { describe, expect, it } from "vitest";
import { strToU8, zipSync } from "fflate";
import { inspectZipCentralDirectory, unzipSafe } from "./zip";

describe("ZIP processing boundaries", () => {
  it("extracts a small safe archive and reports its central directory", () => {
    const archive = zipSync({ "index.html": strToU8("<h1>ok</h1>") });
    const inspection = inspectZipCentralDirectory(archive);
    expect(inspection.findings.filter((finding) => finding.severity === "error")).toHaveLength(0);
    expect(inspection.entries.map((entry) => entry.path)).toEqual(["index.html"]);
    const result = unzipSafe(archive);
    expect(new TextDecoder().decode(result.files["index.html"])).toBe("<h1>ok</h1>");
  });

  it("rejects a central directory outside the archive bounds", () => {
    const malformed = new Uint8Array(22);
    const view = new DataView(malformed.buffer);
    view.setUint32(0, 0x06054b50, true);
    view.setUint16(10, 1, true);
    view.setUint32(12, 46, true);
    view.setUint32(16, 22, true);
    const result = inspectZipCentralDirectory(malformed);
    expect(result.findings.map((finding) => finding.code)).toContain("zip_directory_bounds");
  });
});
