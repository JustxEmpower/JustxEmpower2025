#!/bin/bash
# Run atlas generation in background with logging
cd "$(dirname "$0")/.."
LOG="atlas-generation.log"
echo "Starting atlas generation at $(date)" > "$LOG"
echo "Args: $@" >> "$LOG"
node scripts/generate-kling-atlas.mjs "$@" >> "$LOG" 2>&1
echo "" >> "$LOG"
echo "Finished at $(date)" >> "$LOG"
echo "Done! Check $LOG for results."
