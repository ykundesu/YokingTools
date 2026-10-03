interface Bucket {
  startedAt: number;
  count: number;
}

const buckets = new Map<string, Bucket>();
const WINDOW_MS = 60_000;
const MAX_REQUESTS = 12;
const MAX_BUCKETS = 5_000;

export function allowRequest(key: string, now = Date.now()): boolean {
  const current = buckets.get(key);
  if (!current || now - current.startedAt >= WINDOW_MS) {
    if (buckets.size >= MAX_BUCKETS) {
      const oldest = buckets.keys().next().value;
      if (oldest) buckets.delete(oldest);
    }
    buckets.set(key, { startedAt: now, count: 1 });
    return true;
  }
  if (current.count >= MAX_REQUESTS) return false;
  current.count += 1;
  return true;
}

export function resetRateLimitForTests(): void {
  buckets.clear();
}
