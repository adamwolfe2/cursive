# Crisp Helpdesk Article Bulk Importer

This script allows you to bulk-upload helpdesk/knowledge base articles to Crisp programmatically using their REST API.

## Prerequisites

1. **Node.js** and **npm** installed
2. **TypeScript** installed (or use `ts-node`)
3. A **Crisp account** with access to the Marketplace

## Installation

Install the required dependencies:

```bash
npm install --save-dev gray-matter node-fetch@2 @types/node
```

Or add to your `package.json`:

```json
{
  "devDependencies": {
    "gray-matter": "^4.0.3",
    "node-fetch": "^2.7.0",
    "@types/node": "^20.0.0"
  }
}
```

## Getting Your Crisp API Credentials

### Step 1: Access Crisp Marketplace

1. Log in to your Crisp account
2. Navigate to **Settings → Marketplace**
   - URL: https://app.crisp.chat/settings/marketplace/

### Step 2: Create a Plugin (or Use Existing)

1. Click **"Create a Plugin"** (or select an existing one)
2. Give it a name like "Article Importer"
3. Save the plugin

### Step 3: Generate API Token

1. Click on your plugin to open it
2. Go to the **"Tokens"** tab
3. Choose one:
   - **Development Token**: Best for testing, easier to generate
   - **Production Token**: Required for production use, needs approval

4. Click **"Generate Development Token"** (or request production token)
5. Copy both values:
   - **Identifier**: Looks like `5c0595b7-...`
   - **Key**: Looks like a long hex string

### Step 4: Get Your Website ID

Your Website ID is visible in the Crisp dashboard URL or for this project it's:

```
74f01aba-2977-4100-92ed-3297d60c6fcb
```

## Configuration

Set the following environment variables:

```bash
export CRISP_IDENTIFIER="your-identifier-here"
export CRISP_KEY="your-key-here"
export CRISP_WEBSITE_ID="74f01aba-2977-4100-92ed-3297d60c6fcb"
export CRISP_LOCALE="en"  # Optional, defaults to "en"
```

Or create a `.env` file (don't commit this!):

```env
CRISP_IDENTIFIER=your-identifier-here
CRISP_KEY=your-key-here
CRISP_WEBSITE_ID=74f01aba-2977-4100-92ed-3297d60c6fcb
CRISP_LOCALE=en
```

## Preparing Your Articles

### Directory Structure

Create markdown files in the `docs/crisp-articles/` directory (or any directory you prefer):

```
docs/
└── crisp-articles/
    ├── getting-started.md
    ├── faq.md
    ├── integrations.md
    └── troubleshooting.md
```

### Article Format

Each markdown file should include frontmatter with metadata:

```markdown
---
title: "Your Article Title"
description: "A brief description of the article"
category: "getting-started"  # Optional
featured: true               # Optional (default: false)
order: 1                     # Optional (default: 0)
---

# Your Article Content

Write your article content here using **Markdown** syntax.

## Supported Markdown Features

- Headers (H1-H6)
- **Bold** and *italic* text
- Lists (ordered and unordered)
- Links: [text](url)
- Images: ![alt](url)
- Code blocks
- Tables
- Blockquotes

> Note: Crisp supports Markdown formatting in articles!

## Example

Here's how to do something:

1. First step
2. Second step
3. Third step

Done!
```

### Required Fields

- **title**: (Required) The article title
- **content**: (Required) The markdown content

### Optional Fields

- **description**: A short description/summary
- **category**: Category slug (must exist in Crisp first)
- **featured**: Whether to feature this article (true/false)
- **order**: Display order (number, higher = appears first)

## Running the Script

### Basic Usage

Run the script using `ts-node`:

```bash
npx ts-node scripts/crisp-bulk-import.ts
```

This will process all `.md` files in `docs/crisp-articles/`

### Custom Directory

Specify a different articles directory:

```bash
npx ts-node scripts/crisp-bulk-import.ts path/to/your/articles
```

### Example Output

```
═══════════════════════════════════════════════════
  Crisp Helpdesk Article Bulk Importer
═══════════════════════════════════════════════════

Website ID: 74f01aba-2977-4100-92ed-3297d60c6fcb
Locale: en
Delay between requests: 1000ms

Articles directory: /path/to/docs/crisp-articles

📂 Fetching categories from Crisp...
✓ Found 3 existing categories
  - Getting Started (slug: getting-started)
  - FAQ (slug: faq)
  - Integrations (slug: integrations)

─────────────────────────────────────────────────
Found 4 markdown file(s) to process

📄 Processing: getting-started.md
  Title: "Getting Started with Cursive"
  Description: "Learn how to get started with Cursive..."
  Content length: 1523 characters
  Featured: true
  Order: 1
  ✅ Successfully created article!
  Article ID: abc123
  ⏳ Waiting 1000ms before next request...

📄 Processing: faq.md
  Title: "Frequently Asked Questions"
  Description: "Common questions and answers"
  Content length: 892 characters
  Featured: false
  Order: 2
  ✅ Successfully created article!
  Article ID: def456
  ⏳ Waiting 1000ms before next request...

─────────────────────────────────────────────────

📊 Summary:
  ✅ Successfully imported: 4
  ❌ Failed: 0
  📝 Total files: 4

🎉 Done! Visit your Crisp helpdesk to see the articles.
   https://app.crisp.chat/website/74f01aba-2977-4100-92ed-3297d60c6fcb/helpdesk/

═══════════════════════════════════════════════════
```

## Rate Limiting

### Default Behavior

- The script waits **1000ms (1 second)** between each article upload
- This is conservative and should work for most use cases

### Rate Limit Information

According to Crisp's documentation:

- **Plugin tokens** have higher rate limits than user tokens
- Plugin tokens are subject to a **daily quota** (not per-minute limits)
- The daily quota varies per integration

### If You Hit Rate Limits

If you get `429 Too Many Requests` errors:

1. **Increase the delay** in the script:
   ```typescript
   const DELAY_BETWEEN_REQUESTS = 2000; // Change from 1000 to 2000ms
   ```

2. **Request a higher quota** from Crisp:
   - Contact Crisp support
   - Explain your use case
   - They can increase your daily quota

3. **Use a production token** instead of development token:
   - Production tokens may have higher limits
   - Request one in the Marketplace settings

## Troubleshooting

### Error: Missing CRISP_IDENTIFIER or CRISP_KEY

Make sure you've exported the environment variables:

```bash
export CRISP_IDENTIFIER="your-identifier"
export CRISP_KEY="your-key"
```

### Error: Articles directory not found

Create the directory or specify the correct path:

```bash
mkdir -p docs/crisp-articles
```

### Error: Missing required "title" in frontmatter

Add a title to your markdown file's frontmatter:

```markdown
---
title: "Your Article Title"
---
```

### Error: 401 Unauthorized

- Check that your CRISP_IDENTIFIER and CRISP_KEY are correct
- Make sure they're from the same plugin/token pair
- Verify the token hasn't been revoked

### Error: 404 Not Found

- Verify your CRISP_WEBSITE_ID is correct
- Check that the website exists in your Crisp account

## API Reference

This script uses the following Crisp API endpoints:

### List Categories

```
GET /v1/website/{website_id}/helpdesk/locale/{locale}/categories/{page}
```

Used to fetch existing categories and validate category slugs.

### Create Article

```
POST /v1/website/{website_id}/helpdesk/locale/{locale}/article
```

**Request Body:**
```json
{
  "title": "Article Title",
  "description": "Article description",
  "content": "Markdown content here...",
  "featured": false,
  "order": 0
}
```

**Authentication:**
```
Authorization: Basic BASE64(identifier:key)
X-Crisp-Tier: plugin
```

### Official Documentation

- **REST API Reference**: https://docs.crisp.chat/references/rest-api/v1/
- **Authentication Guide**: https://docs.crisp.chat/guides/rest-api/authentication/
- **Rate Limits**: https://docs.crisp.chat/guides/rest-api/rate-limits/
- **Helpdesk Formatting**: https://help.crisp.chat/en/article/how-can-i-format-knowledge-base-articles-oiurpj/

## Limitations

### Known Limitations

1. **Category Assignment**:
   - The current version doesn't assign articles to categories
   - This requires additional API calls (first create, then assign to category)
   - You can manually assign categories in the Crisp dashboard after import

2. **Article Updates**:
   - The script only creates new articles
   - To update existing articles, you'd need to use the `saveHelpdeskLocaleArticle` endpoint with an article ID

3. **No Bulk Delete**:
   - The script doesn't delete articles
   - Use the Crisp dashboard to manage existing articles

### Future Enhancements

Potential improvements:

- Add category creation/assignment
- Add update mode (vs create-only)
- Add dry-run mode
- Add article deletion
- Support for multiple locales in one run
- Parallel uploads with queue management

## Example Article Files

See `docs/crisp-articles/example-article.md` for a complete example.

## Support

For issues with:

- **This script**: Check the troubleshooting section above
- **Crisp API**: Contact Crisp support or check their documentation
- **Cursive platform**: Contact support@meetcursive.com

## License

This script is part of the Cursive project. Use it freely for your Crisp helpdesk article imports.
