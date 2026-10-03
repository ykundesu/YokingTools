# 静的サイト公開モジュール設計（未接続・モック段階）

## 最新仕様

- ZIP / HTML は Git 保存を要求せず、Workers Static Assets への直接公開を想定する。
- GitHub は単発 snapshot import ではなく、`repository / branch / subdirectory` に紐づく Workers Builds の継続デプロイとする。
- 本体サイトは Git 管理し、Workers Builds で `npm run build` → `npx wrangler deploy` を実行する。
- 管理一覧には source 方式、GitHub の repo/branch/path、公開方式、版、状態、ドメインを表示する。
- ZIP / HTML / GitHub すべて、対象、差分、影響、公開範囲、既存 DNS/TLS、ドメイン衝突をプレビューしてから本人確認する。
- 実行は idempotency key 付きの一回操作とし、成功／失敗不明時は一覧・バージョン・デプロイ状態を再読込してから再試行する。
- 「公開停止」は配信を止める状態変更であり、永久削除とは別操作。初版のモックでは永久削除を実装しない。

## ZIP / HTML 安全境界

`src/features/static-publish/logic.ts` と `zip.ts` で以下を事前検査する。

- ZIP 20 MB、500 エントリ、単一 5 MB、展開後総量 50 MB、圧縮率 200 倍を上限にする。
- 絶対パス、`..`、ドライブ文字、NUL、シンボリックリンク、暗号化エントリ、ZIP64 は拒否候補にする。
- `.git`、`.env`、秘密鍵・token・credential らしい名前は秘密候補として表示する。
- HTML はサンドボックス iframe の `srcdoc` で隔離プレビューする。`allow-scripts`、同一オリジン権限、フォーム送信は付与しない。
- アップロード内容をサーバーへ保存・送信せず、初版はブラウザメモリ内のモック解析だけを行う。

## GitHub / ドメイン

- GitHub は `https://github.com/{owner}/{repo}` のみ受け付け、任意 URL の fetch や clone はしない。
- branch と subdirectory は別入力。`..`、NUL、バックスラッシュを拒否する。
- 実接続時は Git プロバイダ権限、repo 可視性、branch、subdirectory、build/deploy command、preview branch の承認が必要。
- ドメイン変更時は既存 Worker、DNS レコード、TLS、Access／公開範囲を読み取り、衝突を明示する。DNS レコード削除・上書き、Worker route、証明書、Access は自動変更しない。

## 実接続前の承認事項

1. Cloudflare account / zone / Worker の対象。
2. ZIP / HTML の公開先 Worker、公開範囲、停止・復旧・永久削除の運用。
3. GitHub の repo / branch / subdirectory、継続 deploy の権限と build command。
4. カスタムドメイン、既存 DNS と TLS への影響、DNS 変更を許可するか。
5. 失敗時の回復担当、保持する履歴、ログ・監査データの保存期間。
6. Cloudflare API token は最小権限・サーバー側保管とし、ブラウザへ渡さないこと。

現時点では永続トークン生成、Git remote / push、Worker・DNS・Access の変更、本番公開を行っていない。
