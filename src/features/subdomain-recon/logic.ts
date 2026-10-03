import { normalizeDomain } from "../../shared/validation/input";

export interface ReconResult {
  domain: string;
  subdomains: string[];
  source: string;
}

export function extractSubdomains(records: Array<{ name_value?: unknown }>, domain: string): string[] {
  const normalized = normalizeDomain(domain);
  if (!normalized) return [];
  const found = new Set<string>();
  for (const record of records) {
    if (typeof record.name_value !== "string") continue;
    for (const raw of record.name_value.split(/\r?\n/)) {
      const candidate = raw.trim().toLowerCase().replace(/^\*\./, "");
      if (candidate !== normalized && candidate.endsWith(`.${normalized}`) && normalizeDomain(candidate)) found.add(candidate);
    }
  }
  return [...found].sort();
}
