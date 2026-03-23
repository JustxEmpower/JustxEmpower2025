#!/usr/bin/env python3
"""Send SSM command and poll for completion."""
import subprocess, json, sys, time

cmds = sys.argv[1] if len(sys.argv) > 1 else 'echo hello'
r = subprocess.run(
    ['aws', 'ssm', 'send-command',
     '--instance-ids', 'i-0d10632167d9188b7',
     '--document-name', 'AWS-RunShellScript',
     '--parameters', json.dumps({'commands': [cmds], 'executionTimeout': ['600']}),
     '--query', 'Command.CommandId', '--output', 'text'],
    capture_output=True, text=True, timeout=30
)
cid = r.stdout.strip()
if not cid:
    print(f"ERROR: {r.stderr.strip()}")
    sys.exit(1)
print(f"CommandId: {cid}")

for _ in range(30):
    time.sleep(10)
    r2 = subprocess.run(
        ['aws', 'ssm', 'list-command-invocations',
         '--command-id', cid,
         '--query', 'CommandInvocations[0].Status', '--output', 'text'],
        capture_output=True, text=True, timeout=15
    )
    st = r2.stdout.strip()
    print(f"Status: {st}")
    if st in ('Success', 'Failed', 'TimedOut', 'Cancelled'):
        break
