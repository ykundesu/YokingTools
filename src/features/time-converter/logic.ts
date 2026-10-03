export type LocalResolutionStatus = "ok" | "ambiguous" | "nonexistent" | "invalid";

export interface LocalResolution {
  status: LocalResolutionStatus;
  candidates: number[];
}

interface LocalParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
}

function parseLocal(value: string): LocalParts | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?$/.exec(value.trim());
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);
  const second = match[6] === undefined ? 0 : Number(match[6]);
  if (!year || month < 1 || month > 12 || day < 1 || day > 31 || hour > 23 || minute > 59 || second > 59) return null;
  return { year, month, day, hour, minute, second };
}

function formatter(timeZone: string): Intl.DateTimeFormat {
  return new Intl.DateTimeFormat("sv-SE", { timeZone, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function partsAt(epochMs: number, timeZone: string): LocalParts {
  const values: Record<string, number> = {};
  for (const part of formatter(timeZone).formatToParts(new Date(epochMs))) {
    if (["year", "month", "day", "hour", "minute", "second"].includes(part.type)) values[part.type] = Number(part.value);
  }
  return { year: values.year ?? 0, month: values.month ?? 0, day: values.day ?? 0, hour: values.hour ?? 0, minute: values.minute ?? 0, second: values.second ?? 0 };
}

function sameParts(left: LocalParts, right: LocalParts): boolean {
  return left.year === right.year && left.month === right.month && left.day === right.day && left.hour === right.hour && left.minute === right.minute && left.second === right.second;
}

function offsetAt(epochMs: number, timeZone: string): number {
  const wall = partsAt(epochMs, timeZone);
  return Date.UTC(wall.year, wall.month - 1, wall.day, wall.hour, wall.minute, wall.second) - epochMs;
}

export function localDateTimeToEpoch(value: string, timeZone: string): LocalResolution {
  const local = parseLocal(value);
  if (!local) return { status: "invalid", candidates: [] };
  let base: number;
  try {
    formatter(timeZone);
    base = Date.UTC(local.year, local.month - 1, local.day, local.hour, local.minute, local.second);
  } catch {
    return { status: "invalid", candidates: [] };
  }
  const offsets = new Set<number>();
  for (const hours of [-36, -24, -12, -6, -1, 0, 1, 6, 12, 24, 36]) offsets.add(offsetAt(base + hours * 60 * 60 * 1000, timeZone));
  const candidates = [...offsets].map((offset) => base - offset).filter((candidate) => sameParts(partsAt(candidate, timeZone), local)).sort((left, right) => left - right).map((value) => Math.round(value / 1000));
  return { status: candidates.length === 0 ? "nonexistent" : candidates.length === 1 ? "ok" : "ambiguous", candidates };
}

export function epochToLocalDateTime(epochSeconds: number, timeZone: string): string {
  if (!Number.isFinite(epochSeconds)) return "";
  const date = new Date(epochSeconds * 1000);
  if (Number.isNaN(date.valueOf())) return "";
  return formatter(timeZone).format(date).replace(" ", "T");
}
