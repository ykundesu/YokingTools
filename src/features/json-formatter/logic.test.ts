import { describe, expect, it } from "vitest";
import { compactJson, formatJson } from "./logic";

describe("JSON formatter", () => {
  it("formats and compacts JSON", () => {
    expect(formatJson('{"a":1}').value).toContain("\n");
    expect(compactJson('{"a": 1}').value).toBe('{"a":1}');
  });

  it("reports malformed and oversized input", () => {
    expect(formatJson("{").ok).toBe(false);
    expect(formatJson("x".repeat(1_000_001)).error).toContain("1 MB");
  });
});
