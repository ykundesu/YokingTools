const DOMAIN_LABEL = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i;
const MAX_DOMAIN_LENGTH = 253;

export function normalizeDomain(value: string): string | null {
  const input = value.trim().toLowerCase().replace(/\.$/, "");
  if (!input || input.length > MAX_DOMAIN_LENGTH || /[@/?#\\]/.test(input) || !/^[a-z0-9.-]+$/i.test(input) || isIpv4(input) || isIpv6(input)) return null;

  let hostname: string;
  try {
    hostname = new URL(`https://${input}`).hostname.toLowerCase().replace(/\.$/, "");
  } catch {
    return null;
  }
  if (hostname.length > MAX_DOMAIN_LENGTH || hostname.includes(":")) return null;
  const labels = hostname.split(".");
  if (labels.length < 2 || labels.some((label) => !DOMAIN_LABEL.test(label))) return null;
  if (labels.at(-1)?.length === 0) return null;
  return hostname;
}

export function isIpv4(value: string): boolean {
  const parts = value.split(".");
  return parts.length === 4 && parts.every((part) => /^\d{1,3}$/.test(part) && Number(part) <= 255);
}

export function isIpv6(value: string): boolean {
  const input = value.trim().replace(/^\[/, "").replace(/\]$/, "");
  if (!input || !input.includes(":")) return false;
  const halves = input.split("::");
  if (halves.length > 2) return false;
  const countGroups = (part: string): number => {
    if (!part) return 0;
    return part.split(":").reduce((count, group) => {
      if (group.includes(".")) return count + (isIpv4(group) ? 2 : 99);
      return count + (/^[0-9a-f]{1,4}$/i.test(group) ? 1 : 99);
    }, 0);
  };
  const groups = countGroups(halves[0] ?? "") + countGroups(halves[1] ?? "");
  return groups <= 8 && (halves.length === 2 ? groups < 8 : groups === 8);
}

export function isPrivateIp(value: string): boolean {
  const input = value.trim().replace(/^\[/, "").replace(/\]$/, "").toLowerCase();
  if (isIpv4(input)) {
    const [a, b] = input.split(".").map(Number);
    return a === 0 || a === 10 || a === 127 || a === 169 && b === 254 || a === 172 && b >= 16 && b <= 31 || a === 192 && b === 168 || a === 100 && b >= 64 && b <= 127 || a >= 224;
  }
  if (!isIpv6(input)) return false;
  if (input.startsWith("::ffff:")) {
    const mapped = input.slice("::ffff:".length);
    if (isIpv4(mapped)) return isPrivateIp(mapped);
  }
  return input === "::" || input === "::1" || input.startsWith("fc") || input.startsWith("fd") || input.startsWith("fe8") || input.startsWith("fe9") || input.startsWith("fea") || input.startsWith("feb") || input.startsWith("ff");
}

export function normalizePublicIp(value: string): string | null {
  const input = value.trim().replace(/^\[/, "").replace(/\]$/, "");
  if ((!isIpv4(input) && !isIpv6(input)) || isPrivateIp(input)) return null;
  return input;
}

export function isValidDnsType(value: string): value is "A" | "AAAA" | "CNAME" | "MX" | "TXT" | "NS" | "CAA" | "SOA" {
  return ["A", "AAAA", "CNAME", "MX", "TXT", "NS", "CAA", "SOA"].includes(value.toUpperCase());
}
