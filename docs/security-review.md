# Security review notes

## Implemented boundaries

- Network proxy requests are limited to the four fixed HTTPS provider origins and their expected paths. User input is validated as a domain, DNS type, or public IP; private and mapped-private IPs are rejected.
- Provider fetches reject credentials, non-default ports, redirects, oversized bodies, and timeouts. The router exposes only read-only `GET` provider endpoints.
- Markdown output escapes raw HTML and rejects script-like/protocol-relative links. Uploaded HTML is shown in a sandboxed iframe with a restrictive `default-src 'none'` CSP and no referrer.
- ZIP inspection enforces archive/entry/file/total/ratio limits, rejects traversal, symlinks, encrypted and ZIP64 entries, checks central-directory bounds, and blocks publication when secret-like files are detected.
- `/api/admin` fails closed with HTTP 503 because no server-side authentication binding is configured. The static publication UI remains a local mock and has no upload, deploy, DNS, Access, or GitHub mutation path.

## Read-only verification

- `npm run check`: lint, typecheck, 35 unit tests, and Vite build passed.
- Playwright UI smoke passed for the shell, JSON, Markdown XSS escaping, CSV multiline handling, and static publication notice.
- Wrangler `deploy --dry-run` passed; no deployment was sent.
- Direct public provider smoke: RDAP, Cloudflare DNS-over-HTTPS, and ipwho.is returned HTTP 200 for safe samples. The crt.sh sample timed out, so the app must surface that provider timeout rather than retrying or broadening the allowlist.
- The Wrangler local integration runner was not used as evidence: the helper saw stale listeners on its default port, and an isolated port did not become ready within 30 seconds. No unrelated process was stopped.
