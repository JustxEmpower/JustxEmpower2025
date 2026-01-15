#!/bin/bash
# Production Setup Script
# This script sets up the production database with all tables and initial data

set -e

echo "🚀 JustxEmpower Production Setup"
echo "================================"
echo ""

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL environment variable is required"
    echo "Usage: DATABASE_URL='mysql://...' ./scripts/setup-production.sh"
    exit 1
fi

echo "📦 Step 1: Installing dependencies..."
npm install --legacy-peer-deps

echo ""
echo "🏗️ Step 2: Building application..."
npm run build

echo ""
echo "🗄️ Step 3: Pushing database schema (creating/updating tables)..."
npx drizzle-kit push

echo ""
echo "🌱 Step 4: Seeding initial data..."
node scripts/seed-production.mjs

echo ""
echo "✅ Production setup complete!"
echo ""
echo "Next steps:"
echo "  1. Start the server: pm2 start ecosystem.config.cjs"
echo "  2. Check logs: pm2 logs"
echo ""
