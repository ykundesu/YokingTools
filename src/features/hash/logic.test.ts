import { describe, expect, it } from "vitest";
import { hashText } from "./logic";

describe("hashText", () => {
  it("uses UTF-8 and returns a stable SHA-256 digest", async () => {
    await expect(hashText("abc", "SHA-256")).resolves.toBe("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
    await expect(hashText("日本語", "SHA-256")).resolves.toHaveLength(64);
  });
});
