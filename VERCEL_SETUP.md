# Vercel Monorepo Configuration Guide

This repository contains two separate Next.js applications in a monorepo structure:

1. **Marketing Site (cursive)** - `/marketing` → www.meetcursive.com
2. **Platform (leads.me)** - `/src` → leads.meetcursive.com

## Smart Build Configuration

To prevent unnecessary builds and reduce Vercel costs, we've configured Ignored Build Steps.

### Setup Instructions

#### 1. Marketing Site (cursive) Project

In Vercel Dashboard → cursive project:

1. Go to **Settings** → **Git**
2. Under **Ignored Build Step**, select "Override"
3. Enter: `bash vercel-ignore.sh`
4. Set **Root Directory** to: `marketing`

**What it does:** Only builds when files in `/marketing` directory change.

**Files:**
- `marketing/vercel.json` - Build configuration
- `marketing/vercel-ignore.sh` - Smart build detection script

---

#### 2. Platform (leads.me) Project

In Vercel Dashboard → leads.me project:

1. Go to **Settings** → **Git**
2. Under **Ignored Build Step**, select "Override"
3. Enter: `bash vercel-ignore-platform.sh`
4. Leave **Root Directory** blank (uses repo root)

**What it does:** Only builds when platform files change (src/, supabase/, root configs).

**Files:**
- `vercel-ignore-platform.sh` - Smart build detection script

---

#### 3. Disable leads.me-temp Project

This project should NOT build to avoid wasting credits.

**Option A: Delete the project (Recommended)**
1. Vercel Dashboard → leads.me-temp project
2. Settings → Advanced
3. Scroll to bottom → "Delete Project"

**Option B: Disconnect from Git**
1. Vercel Dashboard → leads.me-temp project
2. Settings → Git
3. Click "Disconnect" next to the repository

**Option C: Always ignore builds**
1. Vercel Dashboard → leads.me-temp project
2. Settings → Git → Ignored Build Step
3. Select "Override" and enter: `exit 0`

---

## How It Works

### Before Configuration
```
Every git push → 3 builds triggered:
├── cursive (marketing site)
├── leads.me (platform)
└── leads.me-temp (unused)
Result: 3X Vercel build credits consumed
```

### After Configuration
```
Git push with marketing/ changes → 1 build triggered:
└── cursive (marketing site only)

Git push with src/ changes → 1 build triggered:
└── leads.me (platform only)

Git push with unrelated changes → 0 builds triggered
└── Both projects skip build

leads.me-temp → Never builds (disabled)
Result: 67-100% reduction in build credits
```

---

## Testing the Configuration

After setup, test with a small change:

```bash
# Test marketing site build
echo "# test" >> marketing/README.md
git add marketing/README.md
git commit -m "test: verify marketing build detection"
git push

# Expected: Only cursive builds, leads.me skips

# Test platform build
echo "# test" >> src/README.md
git add src/README.md
git commit -m "test: verify platform build detection"
git push

# Expected: Only leads.me builds, cursive skips
```

---

## Build Decision Logic

### Marketing Site (cursive)
```bash
Changed files include marketing/*
  ├── YES → Build ✅
  └── NO → Skip build ⏭️
```

### Platform (leads.me)
```bash
Changed files include src/* OR supabase/* OR root configs
  ├── YES → Build ✅
  └── NO → Skip build ⏭️
```

---

## Troubleshooting

### "Build not triggering when it should"

Check the Vercel deployment logs:
- Look for the ignore script output
- Verify the script returned exit code 1 (should build)

### "Build triggering when it shouldn't"

Verify the Root Directory setting:
- Marketing site: Should be set to `marketing`
- Platform: Should be blank (repo root)

### "Permission denied on ignore script"

Scripts must be executable:
```bash
chmod +x marketing/vercel-ignore.sh
chmod +x vercel-ignore-platform.sh
git add marketing/vercel-ignore.sh vercel-ignore-platform.sh
git commit -m "fix: make vercel ignore scripts executable"
```

---

## Cost Savings Summary

**Typical scenario (10 pushes/week):**

| Scenario | Builds/week | Monthly Builds | Cost Impact |
|----------|-------------|----------------|-------------|
| Before (3 projects) | 30 | ~120 | 3X baseline |
| After (smart builds) | 10-15 | ~40-60 | 1X baseline |
| **Savings** | **50-67%** | **50-67%** | **50-67% reduction** |

---

## Maintenance

- Keep ignore scripts in sync with project structure
- If you add new important directories, update the ignore scripts
- Review Vercel deployment logs monthly to ensure scripts work correctly

---

**Last Updated:** February 2026
