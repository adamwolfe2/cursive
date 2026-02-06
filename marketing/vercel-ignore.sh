#!/bin/bash

# Vercel Ignored Build Step for Marketing Site (cursive)
# Only build if files in the marketing/ directory have changed
# This script runs from the marketing/ directory when Root Directory is set

echo "🔍 Checking if marketing site files changed..."

# Check if this is the first deployment (no previous commit)
if git rev-parse HEAD^ >/dev/null 2>&1; then
  # Compare current commit with previous commit
  # Check current directory (which is marketing/ when Root Directory is set)
  if git diff --quiet HEAD^ HEAD -- .; then
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
