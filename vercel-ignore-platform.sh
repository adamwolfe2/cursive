#!/bin/bash

# Vercel Ignored Build Step for Platform (leads.meetcursive.com)
# Only build if files in src/, supabase/, or root config changed
# Uses VERCEL_GIT_PREVIOUS_SHA to compare against last deployed commit

echo "🔍 Checking if platform files changed..."

# Compare against the last deployed commit. Without one (first push of a branch), build: HEAD^ alone
# misses earlier commits on the branch and skipped real app changes.
if [ -n "$VERCEL_GIT_PREVIOUS_SHA" ] && git cat-file -e "$VERCEL_GIT_PREVIOUS_SHA" 2>/dev/null; then
  COMPARE_SHA="$VERCEL_GIT_PREVIOUS_SHA"
  echo "📌 Comparing against last deployed commit: $COMPARE_SHA"
else
  echo "🚀 No usable previous deploy SHA - proceeding with build"
  exit 1
fi

# Compare current commit with last deployed commit
if git diff --quiet "$COMPARE_SHA" HEAD -- src/ supabase/ package.json tsconfig.json next.config.ts next.config.js vercel.json pnpm-lock.yaml vercel-ignore-platform.sh; then
  echo "✅ No changes in platform files since last deploy - skipping build"
  exit 0
else
  echo "🚀 Platform files changed - proceeding with build"
  exit 1
fi
