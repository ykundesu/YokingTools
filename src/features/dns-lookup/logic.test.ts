import { describe, expect, it } from "vitest";
import { sortDnsAnswers } from "./logic";

describe("sortDnsAnswers", () => {
  it("sorts only the view copy", () => {
    const answers = [{ name: "example.com", type: "A", ttl: 60, data: "9.9.9.9" }, { name: "example.com", type: "A", ttl: 60, data: "1.1.1.1" }];
    expect(sortDnsAnswers(answers).map((answer) => answer.data)).toEqual(["1.1.1.1", "9.9.9.9"]);
    expect(answers[0]?.data).toBe("9.9.9.9");
  });
});
