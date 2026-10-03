export interface RdapResult {
  domain: string;
  status: string[];
  events: Array<{ action: string; date: string }>;
  nameservers: string[];
  entities: Array<{ handle: string | null; roles: string[] }>;
  source: string;
}

export function formatRdapDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? value : new Intl.DateTimeFormat("ja-JP", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" }).format(date);
}

export function summarizeRdap(result: RdapResult): string[][] {
  return result.events.map((event) => [event.action, formatRdapDate(event.date)]);
}
