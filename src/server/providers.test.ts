import { describe, expect, it } from "vitest";
import { isAllowedProviderUrl, PROVIDERS } from "./providers";

describe("fixed provider allowlist", () => {
  it("allows only the pinned HTTPS origins", () => {
    expect(isAllowedProviderUrl(`${PROVIDERS.dns}/dns-query?name=example.com`)).toBe(true);
    expect(isAllowedProviderUrl("https://evil.example/dns-query?name=example.com")).toBe(false);
    expect(isAllowedProviderUrl("http://cloudflare-dns.com/dns-query")).toBe(false);
    expect(isAllowedProviderUrl("https://cloudflare-dns.com@evil.example/dns-query")).toBe(false);
  });
});
