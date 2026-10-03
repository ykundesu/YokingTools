# YokingTools

## Public and private boundary

YokingTools separates browser-local utilities from owner-only management:

- Browser-local tools (JSON, Markdown, hashing, codecs, CSV, and time conversion) require no account and do not send input to a server.
- Network lookup routes are read-only and limited to fixed public providers. They do not expose deployment, DNS, Access, or repository mutation.
- `/api/admin/*` is the owner-only management API boundary. This checkout intentionally fails closed with `503 management_auth_unconfigured` until production authentication is configured.
- `tools.yoking.dev` is only a future domain candidate. It is not deployed and no DNS record was changed for this project.

## Install and verify

```text
npm install
npm run dev
npm run check
npm run build
npx wrangler deploy --dry-run
```

After the repository, authentication, and deployment decisions are reviewed, deploy from an authenticated Cloudflare environment with `npx wrangler deploy`. No deployment is performed by this source checkout.

## Deploy to Cloudflare button

Cloudflare Deploy buttons require a verified public GitHub or GitLab repository. The repository owner/name is not confirmed in this checkout, so the button below is an intentionally inactive template; do not replace the placeholder with a guessed URL.

```markdown
[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=<VERIFIED_PUBLIC_REPO_URL>)
```

When a public repository URL is verified, replace `<VERIFIED_PUBLIC_REPO_URL>` with that URL and publish the button in the repository README. See the [Cloudflare Deploy buttons documentation](https://developers.cloudflare.com/workers/platform/deploy-buttons/) for the supported format and behavior.

ブラウザ内処理を優先した、日本語・モバイル対応の個人用 Cloudflare Workers 便利ツール集です。

## 初期機能

- 公開証明書情報を使ったサブドメイン受動調査
- WHOIS/RDAP、DNS lookup、近似 GeoIP
- JSON 整形、Markdown プレビュー、ハッシュ計算
- Base64 / URL / HTML 変換
- CSV ビューア（引用・改行・Unicode 対応）
- タイムゾーン / UNIX 時刻変換

JSON・Markdown・ハッシュ・変換・CSV・時刻の処理はブラウザ内で完結し、入力を保存・送信しません。外部問い合わせ機能は `src/server/providers.ts` に定義した固定プロバイダだけに接続し、入力 URL の直接 fetch、private IP、リダイレクト、サイズ超過、タイムアウトを拒否します。

## 開発

```bash
npm install
npm run dev
npm run check
```

`npm run check` は lint、TypeScript 型チェック、Vitest、Vite build を実行します。

## Workers Git 連携

このリポジトリは `wrangler.jsonc` を設定の原本として Git 管理できます。公開のための remote 作成・push・Cloudflare Dashboard の Workers Builds 接続は、このローカル実装には含めていません。承認後に Cloudflare Dashboard の Worker → Settings → Builds → Git Repository から GitHub / GitLab / Cloudflare Artifacts のいずれかを接続し、build command を `npm run build`、deploy command を `npx wrangler deploy` として設定してください。

`wrangler.jsonc` は Static Assets の `dist` を配信し、`/api/*` だけ Worker を先行実行します。デプロイ前に必ず実データプロバイダの利用規約・レート制限、Workers Builds の secrets、認証／Access 方針を確認してください。

## 安全設計の境界

- サブドメイン調査は証明書透明性ログ由来の公開情報のみで、能動スキャンはしません。
- GeoIP は近似情報として表示します。プライベート／予約 IP は拒否します。
- API はベストエフォートのインメモリレート制限です。複数インスタンスで強制する場合は、公開前に Durable Object や適切なサービスを別途設計してください。
- 外部応答はサイズ上限・タイムアウト・リダイレクト拒否を適用し、API キーや有料アカウントは使用しません。
