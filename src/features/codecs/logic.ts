function bytesToBinary(bytes: Uint8Array): string {
  let binary = "";
  const chunkSize = 0x8000;
  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
  }
  return binary;
}

export function encodeBase64(value: string): string {
  return btoa(bytesToBinary(new TextEncoder().encode(value)));
}

export function decodeBase64(value: string): string {
  const normalized = value.replace(/\s/g, "");
  if (!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(normalized)) throw new Error("Base64 の形式が不正です。");
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(Uint8Array.from(atob(normalized), (character) => character.charCodeAt(0)));
  } catch {
    throw new Error("Base64 を UTF-8 として解釈できません。");
  }
}

export function encodeUrl(value: string): string {
  return encodeURIComponent(value);
}

export function decodeUrl(value: string): string {
  return decodeURIComponent(value);
}

export function encodeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character] ?? character);
}

export function decodeHtml(value: string): string {
  return value.replace(/&(?:amp|lt|gt|quot|#39|#x[0-9a-f]+|#\d+);/gi, (entity) => {
    const named: Record<string, string> = { "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"', "&#39;": "'" };
    if (named[entity]) return named[entity];
    const hex = /^&#x([0-9a-f]+);$/i.exec(entity);
    const decimal = /^#(\d+);$/.exec(entity);
    const codePoint = hex ? Number.parseInt(hex[1] ?? "", 16) : decimal ? Number.parseInt(decimal[1] ?? "", 10) : NaN;
    return Number.isSafeInteger(codePoint) && codePoint <= 0x10ffff ? String.fromCodePoint(codePoint) : entity;
  });
}

export type Codec = "base64-encode" | "base64-decode" | "url-encode" | "url-decode" | "html-encode" | "html-decode";

export function transformCodec(value: string, codec: Codec): string {
  switch (codec) {
    case "base64-encode": return encodeBase64(value);
    case "base64-decode": return decodeBase64(value);
    case "url-encode": return encodeUrl(value);
    case "url-decode": return decodeUrl(value);
    case "html-encode": return encodeHtml(value);
    case "html-decode": return decodeHtml(value);
  }
}
