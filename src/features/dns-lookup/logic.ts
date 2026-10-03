export interface DnsAnswer {
  name: string;
  type: string | number;
  ttl: number | null;
  data: string;
}

export interface DnsResult {
  domain: string;
  type: string;
  status: number | null;
  answers: DnsAnswer[];
  source: string;
}

export function sortDnsAnswers(answers: DnsAnswer[]): DnsAnswer[] {
  return [...answers].sort((left, right) => left.data.localeCompare(right.data, "en"));
}
