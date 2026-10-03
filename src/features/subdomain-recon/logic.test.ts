import { describe, expect, it } from "vitest";
import { extractSubdomains } from "./logic";

describe("extractSubdomains", () => {
  it("deduplicates wildcard and multiline certificate names", () => {
    expect(extractSubdomains([
      { name_value: "*.example.com\napp.example.com\nexample.com" },
      { name_value: "app.example.com\napi.example.com" },
    ], "example.com")).toEqual(["api.example.com", "app.example.com"]);
  });

  it("does not accept unrelated names", () => {
    expect(extractSubdomains([{ name_value: "example.net\nnotexample.com" }], "example.com")).toEqual([]);
  });
});
