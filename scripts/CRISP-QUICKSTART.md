# Crisp Bulk Import - Quick Start Guide

A quick guide to get you importing articles to Crisp in 5 minutes.

## 1. Install Dependencies

```bash
pnpm add -D gray-matter
```

## 2. Get Your Crisp API Credentials

1. Go to: https://app.crisp.chat/settings/marketplace/
2. Create a new plugin (call it "Article Importer")
3. Go to the **Tokens** tab
4. Click **"Generate Development Token"**
5. Copy the **identifier** and **key**

## 3. Set Environment Variables

```bash
export CRISP_IDENTIFIER="your-identifier-from-step-2"
export CRISP_KEY="your-key-from-step-2"
export CRISP_WEBSITE_ID="74f01aba-2977-4100-92ed-3297d60c6fcb"
```

Or create a `.env` file in the project root:

```env
CRISP_IDENTIFIER=your-identifier-from-step-2
CRISP_KEY=your-key-from-step-2
CRISP_WEBSITE_ID=74f01aba-2977-4100-92ed-3297d60c6fcb
```

## 4. Create Your Articles

Create markdown files in `docs/crisp-articles/`:

**Example: `docs/crisp-articles/my-first-article.md`**

```markdown
---
title: "Getting Started"
description: "Quick start guide for new users"
featured: true
order: 1
---

# Getting Started

Welcome! Here's how to get started...

## Step 1: Sign Up

Visit our website and...

## Step 2: Configure

Go to settings and...
```

## 5. Run the Import

```bash
pnpm crisp:import
```

That's it! Your articles will be uploaded to Crisp.

## What Happens Next?

The script will:

1. ✅ Validate your credentials
2. ✅ List existing categories in Crisp
3. ✅ Process each `.md` file in the directory
4. ✅ Upload articles with 1-second delay between each
5. ✅ Show you the results

## Troubleshooting

### "Missing CRISP_IDENTIFIER or CRISP_KEY"

Make sure you've exported the environment variables or added them to `.env`.

### "Articles directory not found"

The directory is created at `docs/crisp-articles/`. Make sure you're running the command from the project root.

### "Missing required title"

Add a title to your markdown frontmatter:

```markdown
---
title: "Your Title Here"
---
```

## Advanced Usage

### Custom Directory

```bash
pnpm crisp:import path/to/my/articles
```

### Different Locale

```bash
export CRISP_LOCALE="fr"  # For French articles
pnpm crisp:import
```

### Rate Limiting

If you get 429 errors, edit `scripts/crisp-bulk-import.ts` and increase:

```typescript
const DELAY_BETWEEN_REQUESTS = 2000; // Change from 1000 to 2000ms
```

## Full Documentation

See `scripts/README-crisp-import.md` for complete documentation including:

- Article formatting options
- Category management
- Rate limiting details
- API reference
- Troubleshooting guide

## Example Articles

Check out the example files for inspiration:

- `docs/crisp-articles/example-article.md` - Getting started guide
- `docs/crisp-articles/example-faq.md` - FAQ with tables

## Need Help?

- 📚 Full docs: `scripts/README-crisp-import.md`
- 🔧 Script source: `scripts/crisp-bulk-import.ts`
- 🌐 Crisp API: https://docs.crisp.chat/references/rest-api/v1/
