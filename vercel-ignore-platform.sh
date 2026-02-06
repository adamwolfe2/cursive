#!/bin/bash

# Vercel Ignored Build Step for Platform (leads.me)
# Only build if files in src/, supabase/, or root config changed

echo "🔍 Checking if platform files changed..."

# Check if this is the first deployment (no previous commit)
if git rev-parse HEAD^ >/dev/null 2>&1; then
  # Compare current commit with previous commit
  # Check src/, supabase/, package.json, tsconfig.json, next.config.ts
  if git diff --quiet HEAD^ HEAD -- src/ supabase/ package.json tsconfig.json next.config.ts next.config.js; then
    echo "✅ No changes in platform files - skipping build"
    exit 0
  else
    echo "🚀 Platform files changed - proceeding with build"
    exit 1
  fi
else
  # First deployment - always build
  echo "🎉 First deployment - proceeding with build"
  exit 1
fi
