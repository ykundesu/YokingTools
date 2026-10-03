import { describe, expect, it, afterEach } from "vitest";
import { allowRequest, resetRateLimitForTests } from "./rate-limit";

afterEach(() => resetRateLimitForTests());

describe("best-effort rate limit", () => {
  it("allows twelve calls and rejects the thirteenth in a window", () => {
    for (let index = 0; index < 12; index += 1) expect(allowRequest("test-client", 1000)).toBe(true);
    expect(allowRequest("test-client", 1000)).toBe(false);
    expect(allowRequest("test-client", 61_001)).toBe(true);
  });
});
