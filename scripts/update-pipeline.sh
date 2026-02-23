#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
cd "$ROOT_DIR"

echo "=== SkillDB Update Pipeline ==="
echo "Started at $(date)"
echo ""

echo "[1/4] Crawling..."
# node scripts/crawl-skillsmp.js
# node scripts/crawl-skillsh.js
# git -C clawhub-skills-repo pull || git clone https://github.com/openclaw/skills.git clawhub-skills-repo
echo "  (uncomment crawl commands when ready)"

echo "[2/4] Merging sources..."
node scripts/merge-sources.js 2>&1 || echo "  merge-sources.js not found, skipping"

echo "[3/4] Enriching frontmatter..."
node scripts/enrich-frontmatter.js 2>&1 || echo "  enrich-frontmatter.js not found, skipping"

echo "[4/4] Seeding Turso..."
node scripts/seed-turso.js

echo ""
echo "=== Done at $(date) ==="
