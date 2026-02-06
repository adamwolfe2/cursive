#!/bin/bash

# Vercel Ignored Build Step for Marketing Site (cursive)
# Only build if files in the marketing/ directory have changed

echo "🔍 Checking if marketing site files changed..."

# Check if this is the first deployment (no previous commit)
if git rev-parse HEAD^ >/dev/null 2>&1; then
  # Compare current commit with previous commit
  # Only check files in marketing/ directory
  if git diff --quiet HEAD^ HEAD -- ../marketing/ ../../marketing/ ./; then
    echo "✅ No changes in marketing/ - skipping build"
    exit 0
  else
    echo "🚀 Marketing files changed - proceeding with build"
    exit 1
  fi
else
  # First deployment - always build
  echo "🎉 First deployment - proceeding with build"
  exit 1
fi
