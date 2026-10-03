import { describe, expect, it } from "vitest";
import { formatCoordinates } from "./logic";

describe("formatCoordinates", () => {
  it("formats approximate coordinates", () => {
    expect(formatCoordinates({ ip: "1.1.1.1", country: null, region: null, city: null, latitude: 35.68123, longitude: 139.76712, timezone: null, isp: null, organization: null, note: "近似", source: "test" })).toBe("35.6812, 139.7671");
    expect(formatCoordinates({ ip: "1.1.1.1", country: null, region: null, city: null, latitude: null, longitude: null, timezone: null, isp: null, organization: null, note: "近似", source: "test" })).toBe("座標情報なし");
  });
});
