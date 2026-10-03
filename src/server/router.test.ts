import { describe, expect, it } from "vitest";
import { handleApiRequest } from "./router";

describe("management API boundary", () => {
  it("fails closed when server-side authentication is not configured", async () => {
    const response = await handleApiRequest(new Request("https://tool.local/api/admin/publications"));
    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      error: { code: "management_auth_unconfigured" },
    });
  });
});
