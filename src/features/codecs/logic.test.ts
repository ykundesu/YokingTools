import { describe, expect, it } from "vitest";
import { decodeBase64, decodeHtml, decodeUrl, encodeBase64, encodeHtml, encodeUrl } from "./logic";

describe("codecs", () => {
  it("round-trips Unicode Base64", () => {
    expect(decodeBase64(encodeBase64("こんにちは 🌏"))).toBe("こんにちは 🌏");
  });

  it("round-trips URL and HTML encodings", () => {
    expect(decodeUrl(encodeUrl("a b?c=日本語"))).toBe("a b?c=日本語");
    expect(decodeHtml(encodeHtml("<script>&\""))).toBe('<script>&"');
  });

  it("rejects malformed Base64", () => {
    expect(() => decodeBase64("not base64!" )).toThrow();
  });
});
