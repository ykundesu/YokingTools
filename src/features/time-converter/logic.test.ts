import { describe, expect, it } from "vitest";
import { epochToLocalDateTime, localDateTimeToEpoch } from "./logic";

describe("time conversion", () => {
  it("converts a known UTC instant", () => {
    expect(epochToLocalDateTime(0, "UTC")).toBe("1970-01-01T00:00:00");
  });

  it("detects spring-forward nonexistent time and fall-back ambiguity", () => {
    expect(localDateTimeToEpoch("2026-03-08T02:30", "America/New_York").status).toBe("nonexistent");
    const fall = localDateTimeToEpoch("2026-11-01T01:30", "America/New_York");
    expect(fall.status).toBe("ambiguous");
    expect(fall.candidates).toHaveLength(2);
  });
});
