# Vercel Environment Variables - AI Studio Setup

## Required for AI Studio Features

Add these environment variables in Vercel Dashboard → Project Settings → Environment Variables:

### 1. Firecrawl API (Web Scraping)
```
FIRECRAWL_API_KEY=fc-b6041607224242faa631f47574e7cd35
```
**Used for:** Extracting brand DNA from websites (colors, fonts, logos, content)

### 2. Tavily API (Fallback Search)
```
TAVILY_API_KEY=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
```
**Used for:** Fallback search when Firecrawl fails

### 3. FAL.ai API (Image Generation)
```
FAL_KEY=8efc197a-415d-49e3-8c01-75da065f249b:1a6a53bb03edb80ed1845f16d7e06e4e
```
**Used for:** AI-powered ad creative generation with Flux model

---

## How to Add in Vercel

1. Go to: https://vercel.com/adamwolfe2/cursive/settings/environment-variables
2. Click "Add New"
3. Enter variable name (e.g., `FIRECRAWL_API_KEY`)
4. Enter value
5. Select "Production", "Preview", and "Development"
6. Click "Save"
7. Repeat for all three variables
8. **Redeploy** the app to apply the new variables

---

## Testing After Setup

Once deployed with environment variables:

### Test Web Scraper:
```bash
curl -X POST https://leads.meetcursive.com/api/ai-studio/brand/extract \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com"}'
```

### Test Image Generation:
Go to `/ai-studio/creatives` and try generating an image

---

## Security Note

✅ These keys are already added to `.env.local` for local development
⚠️  Make sure `.env.local` is in `.gitignore` (already is)
🔒 Never commit API keys to GitHub
