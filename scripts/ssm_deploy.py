#!/usr/bin/env python3
"""Send SSM deploy command to EC2 and print command ID."""
import subprocess, json, sys

commands = sys.argv[1] if len(sys.argv) > 1 else 'cd /var/www/justxempower && git pull origin main 2>&1 | tail -5 && pnpm install --frozen-lockfile 2>&1 | tail -3'

r = subprocess.run(
    ['aws', 'ssm', 'send-command',
     '--instance-ids', 'i-0d10632167d9188b7',
     '--document-name', 'AWS-RunShellScript',
     '--parameters', json.dumps({'commands': [commands], 'executionTimeout': ['600']}),
     '--query', 'Command.CommandId', '--output', 'text'],
    capture_output=True, text=True, timeout=30
)
print(r.stdout.strip() or r.stderr.strip())
