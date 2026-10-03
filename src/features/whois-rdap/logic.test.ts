import { describe, expect, it } from "vitest";
import { formatRdapDate, summarizeRdap } from "./logic";

describe("RDAP helpers", () => {
  it("formats valid dates without changing invalid values", () => {
    expect(formatRdapDate("2024-01-01T00:00:00Z")).toContain("2024");
    expect(formatRdapDate("not-a-date")).toBe("not-a-date");
  });

  it("builds an event table", () => {
    expect(summarizeRdap({ domain: "example.com", status: [], events: [{ action: "registration", date: "2024-01-01T00:00:00Z" }], nameservers: [], entities: [], source: "rdap.org" })).toHaveLength(1);
  });
});
