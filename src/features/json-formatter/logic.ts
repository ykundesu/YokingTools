export interface JsonFormatResult {
  ok: boolean;
  value?: string;
  error?: string;
}

export function formatJson(input: string, indent = 2): JsonFormatResult {
  if (input.length > 1_000_000) return { ok: false, error: "入力が大きすぎます（上限 1 MB）。" };
  try {
    const parsed: unknown = JSON.parse(input);
    return { ok: true, value: JSON.stringify(parsed, null, indent) };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "JSON を解析できません。" };
  }
}

export function compactJson(input: string): JsonFormatResult {
  return formatJson(input, 0);
}
