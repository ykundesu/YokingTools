import { isAllowedProviderUrl } from "./providers";

const MAX_RESPONSE_BYTES = 256 * 1024;
const DEFAULT_TIMEOUT_MS = 7_000;

export async function safeFetch(
  url: string,
  init: RequestInit = {},
  timeoutMs = DEFAULT_TIMEOUT_MS,
): Promise<Response> {
  if (!isAllowedProviderUrl(url)) throw new Error("provider_not_allowed");
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      ...init,
      redirect: "manual",
      signal: controller.signal,
    });
    if (response.status >= 300 && response.status < 400) throw new Error("provider_redirect_blocked");
    const contentLength = Number(response.headers.get("content-length") ?? "0");
    if (contentLength > MAX_RESPONSE_BYTES) throw new Error("provider_response_too_large");
    if (!response.body) return response;

    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let total = 0;
    while (true) {
      const next = await reader.read();
      if (next.done) break;
      total += next.value.byteLength;
      if (total > MAX_RESPONSE_BYTES) {
        await reader.cancel();
        throw new Error("provider_response_too_large");
      }
      chunks.push(next.value);
    }
    const combined = new Uint8Array(total);
    let offset = 0;
    for (const chunk of chunks) {
      combined.set(chunk, offset);
      offset += chunk.byteLength;
    }
    return new Response(combined, {
      status: response.status,
      headers: response.headers,
    });
  } finally {
    clearTimeout(timer);
  }
}

export async function safeJson<T>(url: string, init: RequestInit = {}): Promise<T> {
  const response = await safeFetch(url, init);
  if (!response.ok) throw new Error(`provider_http_${response.status}`);
  return await response.json() as T;
}
