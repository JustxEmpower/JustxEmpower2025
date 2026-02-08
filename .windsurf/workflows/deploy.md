---
description: How to deploy JustxEmpower to production (git push + AWS SSM)
---

# JustxEmpower Deployment Workflow

## Step 1: Build locally to verify no errors
// turbo
```bash
cd /Users/aprilgambardella/CascadeProjects/JustxEmpower2025
export NVM_DIR="$HOME/.nvm" && [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh" && npx vite build 2>&1 | tail -5
```

## Step 2: Commit changes
```bash
cd /Users/aprilgambardella/CascadeProjects/JustxEmpower2025
git add -A && git commit -m "<descriptive message>"
```

## Step 3: Push to GitHub
Use HTTPS with token to avoid SSH timeout issues. Token is stored in env var $GH_TOKEN:
```bash
cd /Users/aprilgambardella/CascadeProjects/JustxEmpower2025
nohup git push https://$GH_TOKEN@github.com/JustxEmpower/JustxEmpower2025.git main > /tmp/git-push-output.log 2>&1 &
echo "PID: $!"
```
Then check result after ~15 seconds:
// turbo
```bash
sleep 15 && cat /tmp/git-push-output.log
```

## Step 4: Deploy to EC2 via AWS SSM
Production instance: `i-0d10632167d9188b7` (justxempower-prod)
AWS credentials must be set as env vars: AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_DEFAULT_REGION=us-east-1

Send deploy command:
```bash
export AWS_DEFAULT_REGION=us-east-1 && /usr/local/bin/aws ssm send-command --instance-ids "i-0d10632167d9188b7" --document-name "AWS-RunShellScript" --parameters '{"commands":["cd /var/www/justxempower && git pull origin main && pnpm install && pnpm build && pm2 restart justxempower && pm2 status"]}' --timeout-seconds 180 --query "Command.CommandId" --output text 2>&1
```

## Step 5: Check deploy result
Wait ~60 seconds, then check with the command ID from Step 4:
// turbo
```bash
export AWS_DEFAULT_REGION=us-east-1 && sleep 60 && /usr/local/bin/aws ssm get-command-invocation --command-id "<COMMAND_ID>" --instance-id "i-0d10632167d9188b7" --query "[Status,StandardOutputContent,StandardErrorContent]" --output text 2>&1
```

## Key Info
- **GitHub Repo**: https://github.com/JustxEmpower/JustxEmpower2025
- **EC2 Prod Instance**: i-0d10632167d9188b7 (justxempower-prod)
- **EC2 Web Instance**: i-0e796f9d91ede1bdc (justxempower-web) — NOT the deploy target
- **App Path on EC2**: /var/www/justxempower
- **PM2 Process Name**: justxempower
- **AWS Region**: us-east-1
- **AWS CLI Path**: /usr/local/bin/aws (not in PATH by default on macOS)
- **Git push note**: SSH-based `git push origin main` hangs/times out. Always use HTTPS with token.
