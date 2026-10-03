import { describe, expect, it } from "vitest";
import { isPrivateIp, normalizeDomain, normalizePublicIp } from "./input";

describe("network input validation", () => {
  it("accepts normal domains but rejects IPs and URL-like input", () => {
    expect(normalizeDomain("Example.COM.")).toBe("example.com");
    expect(normalizeDomain("127.0.0.1")).toBeNull();
    expect(normalizeDomain("example.com:443")).toBeNull();
    expect(normalizeDomain("https://example.com/path")).toBeNull();
  });

  it("rejects private and mapped-private IPs", () => {
    expect(isPrivateIp("192.168.1.2")).toBe(true);
    expect(isPrivateIp("::ffff:192.168.1.2")).toBe(true);
    expect(normalizePublicIp("192.168.1.2")).toBeNull();
    expect(normalizePublicIp("[2001:4860:4860::8888]")).toBe("2001:4860:4860::8888");
  });
});
