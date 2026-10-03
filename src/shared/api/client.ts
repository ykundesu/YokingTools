import type { ApiErrorBody, ApiSuccessBody } from "../types";

export async function callApi<T>(path: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(path, {
    method: "GET",
    headers: { Accept: "application/json" },
    signal,
  });
  const body = await response.json() as ApiSuccessBody<T> | ApiErrorBody;
  if (!response.ok || !body.ok) {
    const message = body.ok ? `HTTP ${response.status}` : body.error.message;
    throw new Error(message);
  }
  return body.data;
}
