export interface CsvParseOptions {
  delimiter?: string;
  maxCells?: number;
}

export function detectDelimiter(input: string): string {
  const candidates = [",", "\t", ";"];
  const counts = new Map(candidates.map((candidate) => [candidate, 0]));
  let inQuotes = false;
  for (const character of input) {
    if (character === '"') inQuotes = !inQuotes;
    if (!inQuotes && counts.has(character)) counts.set(character, (counts.get(character) ?? 0) + 1);
    if (!inQuotes && (character === "\n" || character === "\r")) break;
  }
  return candidates.sort((left, right) => (counts.get(right) ?? 0) - (counts.get(left) ?? 0))[0] ?? ",";
}

export function parseCsv(input: string, options: CsvParseOptions = {}): string[][] {
  if (input.length > 5_000_000) throw new Error("CSV は 5 MB までです。");
  if (!input) return [];
  const delimiter = options.delimiter ?? detectDelimiter(input);
  if (delimiter.length !== 1 || delimiter === "\n" || delimiter === "\r" || delimiter === '"') throw new Error("区切り文字が不正です。");
  const maxCells = options.maxCells ?? 100_000;
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  let fieldStarted = false;
  let cellCount = 0;
  const pushField = (): void => {
    row.push(field);
    field = "";
    fieldStarted = false;
    cellCount += 1;
    if (cellCount > maxCells) throw new Error("CSV のセル数が上限を超えました。");
  };
  const pushRow = (): void => {
    pushField();
    rows.push(row);
    row = [];
  };

  for (let index = 0; index < input.length; index += 1) {
    const character = input[index] ?? "";
    if (inQuotes) {
      if (character === '"' && input[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (character === '"') {
        inQuotes = false;
      } else {
        field += character;
      }
      continue;
    }
    if (character === '"' && !fieldStarted) {
      inQuotes = true;
      fieldStarted = true;
    } else if (character === delimiter) {
      pushField();
    } else if (character === "\n" || character === "\r") {
      if (character === "\r" && input[index + 1] === "\n") index += 1;
      pushRow();
    } else {
      field += character;
      fieldStarted = true;
    }
  }
  if (inQuotes) throw new Error("引用符が閉じられていません。");
  if (field.length || fieldStarted || row.length) pushRow();
  return rows;
}
