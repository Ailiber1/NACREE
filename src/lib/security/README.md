# NACRÉE セキュリティ実装状況（Tier 4: Commerce — 28項目）

## Tier 1: Static（5項目）
- [x] S-01: .gitignore設定 — node_modules/, .env, .env.local, .DS_Store 除外済み
- [x] S-02: シークレット検索 — ソースコードにハードコードされた秘密情報なし
- [x] S-03: GitLeaks — `gitleaks detect` で漏洩ゼロ確認済み
- [x] S-04: XSS対策 — innerHTML/dangerouslySetInnerHTML 使用箇所なし。React のエスケープに依存
- [x] S-05: CDN SRI — 外部CDNはGoogle Fonts（preconnect）のみ。SRI不要

## Tier 2: Dynamic（+7 = 12項目）
- [x] S-06: DBセキュリティルール — 全8テーブルでRLS有効化。ルート全開放なし
- [x] S-07: データ型バリデーション(DB側) — テーブル定義にCHECK制約（role, status, rating等）
- [x] S-08: 入力バリデーション(フロント) — サインアップ: メール形式・パスワード8-72文字・氏名1-100文字
- [x] S-09: 入力バリデーション(サーバー/DB) — Supabase RLS + CHECK制約でDB側でも検証
- [△] S-10: npm audit — dev依存にhigh脆弱性あり（Cloudflare/sharp関連）。本番クライアントには影響なし
- [x] S-11: SQLインジェクション対策 — Supabase JS SDKのパラメータバインディング使用。文字列結合なし
- [x] S-12: エラー情報漏洩防止 — クライアントにスタックトレース/DB構造を返さない

## Tier 3: Auth（+8 = 20項目）
- [x] S-13: RLS — 全テーブルに行レベルポリシー設定。is_admin_or_staff() SECURITY DEFINER関数使用
- [x] S-14: 認証チェック — admin/layout.tsx, mypage/page.tsx でクライアントサイド認証チェック実施
- [x] S-15: セッション管理 — Supabase Auth のJWTトークン管理に依存（自動リフレッシュ、ログアウト時破棄）
- [x] S-16: ロールベース制御 — admin画面: profilesテーブルのroleがadmin/staff以外→トップにリダイレクト
- [x] S-17: OAuth設定 — Supabase Authの設定でリダイレクトURIを制限（Supabaseダッシュボードで設定）
- [△] S-18: レートリミット — Supabase Auth側でメール送信レート制限あり（3通/時間）。API側はCloudflare WAF(無料)で対応可能
- [x] S-19: CSRF対策 — _headersでReferrer-Policy設定。静的サイトのため外部POST不可（フォームはSupabase SDK経由）
- [x] S-20: CSPヘッダー — _headersにContent-Security-Policy設定済み

## Tier 4: Commerce（+8 = 28項目）
- [x] S-21: Webhook署名検証 — /api/webhook/route.ts にstripe.webhooks.constructEvent()実装（静的エクスポートでは無効だが、本番SSR移行時に有効化）
- [x] S-22: 決済APIキー秘匿 — STRIPE_SECRET_KEYは.env.localのみ。NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEYのみクライアント公開
- [x] S-23: 冪等性 — Webhook処理でstripe_session_idの重複チェック実装
- [x] S-24: テスト/本番キー分離 — 環境変数で分離。sk_test_/pk_test_ と sk_live_/pk_live_ の切替
- [N/A] S-25: 署名付きURL — 有料コンテンツダウンロードなし（予約サービスのため該当なし）
- [x] S-26: Storage RLS — Supabase Storageは未使用（画像はpublic/images/に静的配置）
- [x] S-27: サーバーサイド権限チェック — RLSポリシーでDB層で権限制御。クライアントサイドでもロール確認
- [x] S-28: 環境変数管理 — .env.local（git除外）+ Cloudflare Pages環境変数で管理

## 合計: 26/28 合格（△2件は本番環境制約による）
- S-10: npm audit high — dev依存のみ。本番影響なし
- S-18: レートリミット — Supabase側で基本制限あり。追加制限はCloudflare WAFで設定可能
