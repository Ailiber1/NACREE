#!/bin/bash
# NACRÉE Supabase セットアップスクリプト
# 使い方: bash scripts/setup-supabase.sh

set -e

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
PROJECT_NAME="nacree"
REGION="ap-northeast-1"
ORG_ID=""

echo "=== NACRÉE Supabase セットアップ ==="
echo ""

# 1. Supabase CLIログイン確認
echo "[1/5] Supabase CLIの認証状態を確認中..."
if ! npx supabase projects list > /dev/null 2>&1; then
  echo "Supabaseにログインしていません。ブラウザが開きます..."
  npx supabase login
fi
echo "✓ ログイン済み"

# 2. 組織IDの取得
echo ""
echo "[2/5] 組織情報を取得中..."
ORG_ID=$(npx supabase orgs list --output json 2>/dev/null | node -e "
  const data = require('fs').readFileSync('/dev/stdin', 'utf8');
  const orgs = JSON.parse(data);
  if (orgs.length > 0) { console.log(orgs[0].id); }
")

if [ -z "$ORG_ID" ]; then
  echo "組織が見つかりません。新しい組織を作成します..."
  npx supabase orgs create "NACREE" --output json
  ORG_ID=$(npx supabase orgs list --output json 2>/dev/null | node -e "
    const data = require('fs').readFileSync('/dev/stdin', 'utf8');
    const orgs = JSON.parse(data);
    if (orgs.length > 0) { console.log(orgs[0].id); }
  ")
fi
echo "✓ 組織ID: $ORG_ID"

# 3. プロジェクト作成
echo ""
echo "[3/5] Supabaseプロジェクトを作成中..."
DB_PASS=$(openssl rand -base64 24 | tr -d '/+=' | head -c 20)

PROJECT_INFO=$(npx supabase projects create "$PROJECT_NAME" \
  --org-id "$ORG_ID" \
  --db-password "$DB_PASS" \
  --region "$REGION" \
  --output json 2>/dev/null)

PROJECT_ID=$(echo "$PROJECT_INFO" | node -e "
  const data = require('fs').readFileSync('/dev/stdin', 'utf8');
  const proj = JSON.parse(data);
  console.log(proj.id);
")

echo "✓ プロジェクトID: $PROJECT_ID"
echo "  プロジェクトが起動するまで待機中（約1-2分）..."
sleep 90

# 4. API キーの取得
echo ""
echo "[4/5] APIキーを取得中..."
API_KEYS=$(npx supabase projects api-keys --project-ref "$PROJECT_ID" --output json 2>/dev/null)

ANON_KEY=$(echo "$API_KEYS" | node -e "
  const data = require('fs').readFileSync('/dev/stdin', 'utf8');
  const keys = JSON.parse(data);
  const anon = keys.find(k => k.name === 'anon');
  if (anon) console.log(anon.api_key);
")

SUPABASE_URL="https://${PROJECT_ID}.supabase.co"

echo "✓ URL: $SUPABASE_URL"

# 5. .env.local 生成
echo ""
echo "[5/5] .env.local を生成中..."
cat > "$PROJECT_DIR/.env.local" << ENVEOF
NEXT_PUBLIC_SUPABASE_URL=$SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=$ANON_KEY
ENVEOF

echo "✓ .env.local を生成しました"

# 6. マイグレーション適用
echo ""
echo "[6/5] マイグレーションを適用中..."
npx supabase link --project-ref "$PROJECT_ID" --workdir "$PROJECT_DIR"
npx supabase db push --workdir "$PROJECT_DIR"

echo ""
echo "=== セットアップ完了 ==="
echo "URL: $SUPABASE_URL"
echo "Anon Key: ${ANON_KEY:0:20}..."
echo ""
echo "次のステップ: npm run dev"
