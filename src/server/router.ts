import { isValidDnsType, normalizeDomain, normalizePublicIp } from "../shared/validation/input";
import { PROVIDERS } from "./providers";
import { allowRequest } from "./rate-limit";
import { failure, success } from "./response";
import { safeJson } from "./safe-fetch";

interface CertificateRecord {
  name_value?: unknown;
}

interface DnsAnswer {
  name?: unknown;
  type?: unknown;
  TTL?: unknown;
  data?: unknown;
}

interface DnsResponse {
  Status?: unknown;
  Answer?: DnsAnswer[];
}

interface RdapResponse {
  status?: unknown;
  events?: Array<{ eventAction?: unknown; eventDate?: unknown }>;
  nameservers?: Array<{ ldhName?: unknown }>;
  entities?: Array<{ roles?: unknown; handle?: unknown }>;
}

interface GeoIpResponse {
  success?: unknown;
  country?: unknown;
  region?: unknown;
  city?: unknown;
  latitude?: unknown;
  longitude?: unknown;
  timezone?: { id?: unknown };
  connection?: { isp?: unknown; org?: unknown };
}

export interface AssetBinding {
  fetch: (request: Request) => Promise<Response>;
}

export async function handleApiRequest(request: Request): Promise<Response> {
  const url = new URL(request.url);
  if (request.method !== "GET") return failure("method_not_allowed", "読み取り専用 API は GET のみ対応しています。", 405);
  const origin = request.headers.get("origin");
  if (origin && origin !== url.origin) return failure("origin_not_allowed", "この API は同一オリジンからのみ利用できます。", 403);

  const clientKey = request.headers.get("cf-connecting-ip") ?? request.headers.get("x-forwarded-for") ?? "anonymous";
  if (!allowRequest(clientKey)) return failure("rate_limited", "短時間の照会回数が上限に達しました。少し待ってから再試行してください。", 429);

  try {
    switch (url.pathname) {
      case "/api/recon":
        return await handleRecon(url);
      case "/api/rdap":
        return await handleRdap(url);
      case "/api/dns":
        return await handleDns(url);
      case "/api/geoip":
        return await handleGeoIp(url);
      default:
        return failure("not_found", "指定された API はありません。", 404);
    }
  } catch (error) {
    const reason = error instanceof Error ? error.message : "unknown";
    if (reason === "provider_response_too_large") return failure("provider_response_too_large", "外部応答が大きすぎるため中止しました。", 502);
    if (reason === "provider_redirect_blocked") return failure("provider_redirect_blocked", "許可していないリダイレクトを検出したため中止しました。", 502);
    if (reason === "provider_not_allowed") return failure("provider_not_allowed", "許可されていない外部先です。", 502);
    if (reason === "AbortError") return failure("provider_timeout", "外部照会が時間内に完了しませんでした。", 504);
    return failure("provider_unavailable", "外部照会に失敗しました。プロバイダの状態を確認してください。", 502);
  }
}

async function handleRecon(url: URL): Promise<Response> {
  const domain = normalizeDomain(url.searchParams.get("domain") ?? "");
  if (!domain) return failure("invalid_domain", "有効なドメイン名を入力してください。", 400);
  const endpoint = new URL(PROVIDERS.certificateTransparency);
  endpoint.searchParams.set("q", `%.${domain}`);
  endpoint.searchParams.set("output", "json");
  const records = await safeJson<CertificateRecord[]>(endpoint.toString());
  const names = new Set<string>();
  for (const record of Array.isArray(records) ? records : []) {
    if (typeof record.name_value !== "string") continue;
    for (const rawName of record.name_value.split(/\r?\n/)) {
      const candidate = rawName.trim().toLowerCase().replace(/^\*\./, "");
      if (candidate !== domain && candidate.endsWith(`.${domain}`) && normalizeDomain(candidate)) names.add(candidate);
    }
  }
  return success({ domain, subdomains: [...names].sort().slice(0, 100), source: "certificate-transparency" });
}

async function handleRdap(url: URL): Promise<Response> {
  const domain = normalizeDomain(url.searchParams.get("domain") ?? "");
  if (!domain) return failure("invalid_domain", "有効なドメイン名を入力してください。", 400);
  const endpoint = `${PROVIDERS.rdap}/domain/${encodeURIComponent(domain)}`;
  const raw = await safeJson<RdapResponse>(endpoint);
  const events = Array.isArray(raw.events) ? raw.events.flatMap((event) => {
    if (typeof event.eventAction !== "string" || typeof event.eventDate !== "string") return [];
    return [{ action: event.eventAction, date: event.eventDate }];
  }).slice(0, 20) : [];
  const nameservers = Array.isArray(raw.nameservers) ? raw.nameservers.flatMap((item) => typeof item.ldhName === "string" ? [item.ldhName] : []).slice(0, 20) : [];
  const entities = Array.isArray(raw.entities) ? raw.entities.flatMap((item) => {
    const roles = Array.isArray(item.roles) ? item.roles.filter((role): role is string => typeof role === "string").slice(0, 8) : [];
    return roles.length || typeof item.handle === "string" ? [{ handle: typeof item.handle === "string" ? item.handle : null, roles }] : [];
  }).slice(0, 20) : [];
  const status = Array.isArray(raw.status) ? raw.status.filter((value): value is string => typeof value === "string").slice(0, 20) : [];
  return success({ domain, status, events, nameservers, entities, source: "rdap.org" });
}

async function handleDns(url: URL): Promise<Response> {
  const domain = normalizeDomain(url.searchParams.get("name") ?? "");
  const requestedType = (url.searchParams.get("type") ?? "A").toUpperCase();
  if (!domain || !isValidDnsType(requestedType)) return failure("invalid_dns_query", "ドメイン名と対応する DNS タイプを入力してください。", 400);
  const endpoint = new URL(`${PROVIDERS.dns}/dns-query`);
  endpoint.searchParams.set("name", domain);
  endpoint.searchParams.set("type", requestedType);
  const raw = await safeJson<DnsResponse>(endpoint.toString(), { headers: { accept: "application/dns-json" } });
  const answers = Array.isArray(raw.Answer) ? raw.Answer.flatMap((answer) => {
    if (typeof answer.data !== "string") return [];
    return [{ name: typeof answer.name === "string" ? answer.name : domain, type: typeof answer.type === "number" ? answer.type : requestedType, ttl: typeof answer.TTL === "number" ? answer.TTL : null, data: answer.data }];
  }).slice(0, 100) : [];
  return success({ domain, type: requestedType, status: typeof raw.Status === "number" ? raw.Status : null, answers, source: "cloudflare-dns.com" });
}

async function handleGeoIp(url: URL): Promise<Response> {
  const ip = normalizePublicIp(url.searchParams.get("ip") ?? "");
  if (!ip) return failure("invalid_public_ip", "公開 IPv4 / IPv6 アドレスを入力してください。", 400);
  const endpoint = `${PROVIDERS.geoip}/${encodeURIComponent(ip)}`;
  const raw = await safeJson<GeoIpResponse>(endpoint);
  if (raw.success === false) return failure("geoip_not_found", "GeoIP 情報を取得できませんでした。", 404);
  return success({
    ip,
    country: typeof raw.country === "string" ? raw.country : null,
    region: typeof raw.region === "string" ? raw.region : null,
    city: typeof raw.city === "string" ? raw.city : null,
    latitude: typeof raw.latitude === "number" ? raw.latitude : null,
    longitude: typeof raw.longitude === "number" ? raw.longitude : null,
    timezone: typeof raw.timezone?.id === "string" ? raw.timezone.id : null,
    isp: typeof raw.connection?.isp === "string" ? raw.connection.isp : null,
    organization: typeof raw.connection?.org === "string" ? raw.connection.org : null,
    note: "GeoIP は近似情報であり、正確な住所や本人の位置を示すものではありません。",
    source: "ipwho.is",
  });
}
