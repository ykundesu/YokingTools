export const PROVIDERS = {
  certificateTransparency: "https://crt.sh",
  rdap: "https://rdap.org",
  dns: "https://cloudflare-dns.com",
  geoip: "https://ipwho.is",
} as const;

const ALLOWED_HOSTS = new Set(Object.values(PROVIDERS).map((origin) => new URL(origin).hostname));

export function isAllowedProviderUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && ALLOWED_HOSTS.has(url.hostname) && !url.username && !url.password;
  } catch {
    return false;
  }
}
