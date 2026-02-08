#!/bin/bash

# Vercel Ignored Build Step for Platform (leads.meetcursive.com)
# Only build if files in src/, supabase/, or root config changed
# Uses VERCEL_GIT_PREVIOUS_SHA to compare against last deployed commit

echo "🔍 Checking if platform files changed..."

# Use Vercel's last deployed SHA if available, otherwise fall back to HEAD^
if [ -n "$VERCEL_GIT_PREVIOUS_SHA" ]; then
  COMPARE_SHA="$VERCEL_GIT_PREVIOUS_SHA"
  echo "📌 Comparing against last deployed commit: $COMPARE_SHA"
elif git rev-parse HEAD^ >/dev/null 2>&1; then
  COMPARE_SHA="HEAD^"
  echo "📌 No VERCEL_GIT_PREVIOUS_SHA, comparing against HEAD^"
else
  # First deployment - always build
  echo "🎉 First deployment - proceeding with build"
  exit 1
fi

# Compare current commit with last deployed commit
if git diff --quiet "$COMPARE_SHA" HEAD -- src/ supabase/ package.json tsconfig.json next.config.ts next.config.js; then
  echo "✅ No changes in platform files since last deploy - skipping build"
  exit 0
else
  echo "🚀 Platform files changed - proceeding with build"
  exit 1
fi
