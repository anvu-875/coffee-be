#!/usr/bin/env sh
set -euo pipefail

cd "$(dirname "$0")"
cd ..

echo "🔁 Step 0: Clean install"
npm cache clean --force >/dev/null 2>&1 || true
npm ci

echo "→ Setting NODE_ENV to production"
export NODE_ENV=production
echo "→ NODE_ENV=$NODE_ENV"

echo "🏗️ Step 1: Build project"
npm run build

cd "$(dirname "$0")"

echo "🧹 Step 2: Prune non-runtime files"
sh prune.sh

echo "📦 Step 3: Write runtime package.json + install runtime deps"
node setup-runtime.mjs

cd ..

echo "🔧 Step 4: Generate Prisma client"
npx prisma generate

echo "✅ Build complete. Final structure:"
ls -d dist prisma public swagger-docs.json package.json node_modules 2>/dev/null || true

rm -rf deploy
