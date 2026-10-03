import { describe, expect, it } from "vitest";
import { detectDelimiter, parseCsv } from "./logic";

describe("CSV parser", () => {
  it("supports quoted commas, multiline fields, escaped quotes and Unicode", () => {
    expect(parseCsv('名前,メモ\n"山田,太郎","一行目\n二行目"\n"彼は ""OK"" と言った",終わり')).toEqual([
      ["名前", "メモ"],
      ["山田,太郎", "一行目\n二行目"],
      ['彼は "OK" と言った', "終わり"],
    ]);
  });

  it("detects tabs and rejects unclosed quotes", () => {
    expect(detectDelimiter("a\tb\n1\t2")).toBe("\t");
    expect(() => parseCsv('"open')).toThrow("閉じられていません");
  });
});
