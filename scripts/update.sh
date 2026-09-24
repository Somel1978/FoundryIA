#!/usr/bin/env bash
# Pull the latest code, rebuild and restart under PM2.
# Usage: pnpm update-server        (from the project folder)
set -euo pipefail
cd "$(dirname "$0")/.."

echo "→ Backing up data/ to data-backups/"
if [ -d data ]; then
  mkdir -p data-backups
  tar -czf "data-backups/data-$(date +%Y%m%d-%H%M%S).tar.gz" data
  # keep the 10 most recent backups
  ls -1t data-backups/data-*.tar.gz | tail -n +11 | xargs -r rm --
fi

echo "→ Pulling latest code"
git pull --ff-only

echo "→ Installing dependencies"
pnpm install --frozen-lockfile

echo "→ Building"
pnpm build

echo "→ Restarting"
if pnpm exec pm2 describe foundryvttai >/dev/null 2>&1; then
  pnpm exec pm2 reload ecosystem.config.cjs --update-env
else
  pnpm exec pm2 start ecosystem.config.cjs
fi
pnpm exec pm2 save

PORT="${PORT:-3000}"
for i in $(seq 1 30); do
  if curl -fsS "http://127.0.0.1:${PORT}/api/health" >/dev/null 2>&1; then
    echo "✓ FoundryVTTAI is up on port ${PORT}"
    exit 0
  fi
  sleep 1
done
echo "✗ Server did not become healthy — check: pnpm pm2:logs" >&2
exit 1
