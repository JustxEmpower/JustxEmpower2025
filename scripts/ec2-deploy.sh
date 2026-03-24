#!/bin/bash
set -e
export HOME=/home/ubuntu
export PATH=/usr/local/bin:/usr/bin:/bin:/home/ubuntu/.local/share/pnpm:$PATH
git config --global --add safe.directory /home/ubuntu/justxempower-2025
cd /home/ubuntu/justxempower-2025
echo "=== git pull ==="
git pull origin main 2>&1 || echo "git pull failed but continuing"
echo "=== pnpm install ==="
pnpm install --frozen-lockfile 2>&1 || pnpm install 2>&1
echo "=== pnpm build ==="
pnpm build 2>&1
echo "=== pm2 restart ==="
pm2 restart justxempower 2>&1 || pm2 start dist/index.js --name justxempower 2>&1
pm2 status 2>&1
echo "=== DEPLOY DONE ==="
