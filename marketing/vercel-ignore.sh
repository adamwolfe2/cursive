#!/bin/bash

# Vercel Ignored Build Step for Marketing Site (cursive)
# Only build if files in the marketing/ directory have changed
# Uses VERCEL_GIT_PREVIOUS_SHA to compare against last deployed commit
# (not just HEAD^, which breaks when multiple commits are pushed at once)

echo "🔍 Checking if marketing site files changed..."

# Use Vercel's last deployed SHA if available, otherwise fall back to HEAD^
if [ -n "$VERCEL_GIT_PREVIOUS_SHA" ]; then
  # Verify the SHA still exists (can be invalid after force-push or rebase)
  if git cat-file -e "$VERCEL_GIT_PREVIOUS_SHA" 2>/dev/null; then
    COMPARE_SHA="$VERCEL_GIT_PREVIOUS_SHA"
    echo "📌 Comparing against last deployed commit: $COMPARE_SHA"
  else
    echo "⚠️ Last deployed SHA $VERCEL_GIT_PREVIOUS_SHA no longer exists (force-push?)"
    echo "🚀 Proceeding with build (cannot compare)"
    exit 1
  fi
else
  # First push of a branch: HEAD^ alone misses earlier commits on the branch, so build.
  echo "🚀 No previous deploy SHA - proceeding with build"
  exit 1
fi

# Compare current commit with last deployed commit
if git diff --quiet "$COMPARE_SHA" HEAD -- .; then
  echo "✅ No changes in marketing/ since last deploy - skipping build"
  exit 0
else
  echo "🚀 Marketing files changed - proceeding with build"
  exit 1
fi
