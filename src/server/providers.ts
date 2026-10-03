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
    if (url.protocol !== "https:" || url.port || !ALLOWED_HOSTS.has(url.hostname) || url.username || url.password) return false;
    if (url.hostname === "crt.sh") return url.pathname === "/";
    if (url.hostname === "rdap.org") return url.pathname.startsWith("/domain/");
    if (url.hostname === "cloudflare-dns.com") return url.pathname === "/dns-query";
    if (url.hostname === "ipwho.is") return url.pathname.split("/").filter(Boolean).length === 1;
    return false;
  } catch {
    return false;
  }
}
