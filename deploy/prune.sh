#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"
cd ..

echo "🧹 Step 2: Prune non-runtime files"
echo "→ Clearing npm cache..."
npm cache clean --force || true

echo "→ Backing up runtime folders..."
mkdir -p .runtime-tmp
mv dist .runtime-tmp/ 2>/dev/null || true
mv prisma .runtime-tmp/ 2>/dev/null || true
mv public .runtime-tmp/ 2>/dev/null || true
mv swagger-docs.json .runtime-tmp/ 2>/dev/null || true
mv deploy .runtime-tmp/ 2>/dev/null || true

echo "→ Removing all files and folders (except runtime)..."
find . -mindepth 1 -maxdepth 1 \
  ! -name '.' \
  ! -name '.runtime-tmp' \
  ! -name 'deploy' \
  ! -name 'node_modules' \
  -exec rm -rf -- {} + || true
  
echo "🗑 Deleting node_modules..."

npx rimraf node_modules || {
  echo "⚠️ Failed to delete node_modules with rimraf, trying find fallback..."
  find node_modules -type f -delete 2>/dev/null || true
  find node_modules -type d -empty -delete 2>/dev/null || true
  rmdir node_modules 2>/dev/null || true
}


echo "→ Restoring runtime folders..."
mv .runtime-tmp/dist ./ 2>/dev/null || true
mv .runtime-tmp/prisma ./ 2>/dev/null || true
mv .runtime-tmp/public ./ 2>/dev/null || true
mv .runtime-tmp/swagger-docs.json ./ 2>/dev/null || true
mv .runtime-tmp/deploy ./ 2>/dev/null || true
rm -rf .runtime-tmp

echo "✅ Pruning complete. Only runtime files remain."
