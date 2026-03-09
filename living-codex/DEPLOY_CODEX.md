# Living Codex™ — EC2 Deployment Guide
## Deploys alongside JXE main app at justxempower.com

---

## Architecture
- **JXE main app**: port 8083 at `/var/www/justxempower` (Vite + Express + tRPC)
- **Living Codex**: port 3001 at `/var/www/living-codex` (Next.js)
- **Shared**: Same RDS MySQL database (`justxempower`), same S3 bucket, same Stripe keys
- **Codex tables**: All prefixed with `codex_` to avoid conflicts

---

## Quick Deploy (after initial setup)

```bash
cd /var/www/living-codex && git pull origin main && npm install && npx prisma generate && npm run build && pm2 restart living-codex && pm2 status
```

---

## Initial Setup (First Time Only)

### 1. Connect to EC2 via SSM
```bash
aws ssm start-session --target <instance-id>
```

### 2. Clone the repo
```bash
cd /var/www
git clone https://github.com/JustxEmpower/LivingCodex.git living-codex
cd living-codex/app
```

### 3. Create .env
Copy values from the main JXE `.env` file — same RDS, Stripe, and AWS credentials.
```bash
# Copy the template and fill in values from /var/www/justxempower/.env
cp .env.example /var/www/living-codex/.env
# Edit with: DATABASE_URL, NEXTAUTH_SECRET, NEXTAUTH_URL, STRIPE keys, AWS keys
# Set PORT=3001 and NODE_ENV=production
nano /var/www/living-codex/.env
```

### 4. Install & Build
```bash
npm install
npx prisma generate
npx prisma db push
npm run build
```

### 5. Start with PM2
```bash
pm2 start ecosystem.config.cjs
pm2 save
```

### 6. Add nginx proxy rules
```bash
sudo cp deploy/nginx-codex.conf /etc/nginx/conf.d/codex.conf
# OR add the location blocks from deploy/nginx-codex.conf into the existing server block
sudo nginx -t && sudo systemctl reload nginx
```

### 7. Verify
```bash
pm2 status
pm2 logs living-codex --lines 20
curl http://localhost:3001/codex/portal
```

---

## PM2 Commands
```bash
pm2 status                          # Check both apps
pm2 logs living-codex --lines 50    # View Codex logs
pm2 restart living-codex            # Restart Codex only
pm2 restart justxempower            # Restart main app only
```

---

## Database Tables (codex_ prefix)
| Table | Purpose |
|-------|---------|
| `codex_users` | Codex client accounts |
| `codex_assessments` | Assessment sessions |
| `codex_responses` | Individual question responses |
| `codex_scorings` | Scoring results JSON |
| `codex_mirror_reports` | Generated mirror reports |
| `codex_scroll_entries` | Codex Scroll journal entries |
| `codex_admin_notes` | Admin notes on clients |
| `codex_sections` | Assessment section definitions |
| `codex_questions` | Assessment questions |
| `codex_answers` | Answer options with scoring metadata |

---

## Rollback
```bash
cd /var/www/living-codex
git log --oneline -5
git checkout <commit-hash>
npm install && npm run build && pm2 restart living-codex
```
