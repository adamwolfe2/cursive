#!/usr/bin/env ts-node

/**
 * Crisp Helpdesk Article Bulk Importer
 *
 * This script reads markdown files from a directory and uploads them as helpdesk
 * articles to Crisp using their REST API.
 *
 * SETUP:
 * 1. Install dependencies:
 *    npm install --save-dev gray-matter node-fetch@2
 *
 * 2. Set environment variables:
 *    export CRISP_IDENTIFIER="your-identifier-here"
 *    export CRISP_KEY="your-key-here"
 *    export CRISP_WEBSITE_ID="74f01aba-2977-4100-92ed-3297d60c6fcb"
 *    export CRISP_LOCALE="en"  # Optional, defaults to "en"
 *
 * 3. Get your Crisp API credentials:
 *    - Go to https://app.crisp.chat/settings/marketplace/
 *    - Create a plugin (or use existing)
 *    - Go to "Tokens" tab
 *    - Generate a Development Token (for testing) or Production Token (for production)
 *    - Copy the identifier and key pair
 *
 * 4. Create markdown files in docs/crisp-articles/ with frontmatter:
 *    ---
 *    title: "How to Get Started"
 *    description: "A quick guide to getting started with our platform"
 *    category: "getting-started"  # Optional: category slug
 *    featured: true               # Optional: defaults to false
 *    order: 1                     # Optional: defaults to 0
 *    ---
 *
 *    Your markdown content here...
 *
 * 5. Run the script:
 *    npx ts-node scripts/crisp-bulk-import.ts
 *
 *    Or with custom directory:
 *    npx ts-node scripts/crisp-bulk-import.ts path/to/articles
 *
 * RATE LIMITING:
 * - Plugin tokens have higher rate limits than user tokens
 * - Default delay: 1000ms between requests (adjust if needed)
 * - Plugin tokens have a daily quota (can be increased by contacting Crisp)
 * - If you get 429 errors, increase the DELAY_BETWEEN_REQUESTS value
 *
 * API REFERENCE:
 * - REST API: https://docs.crisp.chat/references/rest-api/v1/
 * - Authentication: https://docs.crisp.chat/guides/rest-api/authentication/
 * - Rate Limits: https://docs.crisp.chat/guides/rest-api/rate-limits/
 */

import * as fs from 'fs';
import * as path from 'path';
import matter from 'gray-matter';

// Configuration
const CRISP_IDENTIFIER = process.env.CRISP_IDENTIFIER;
const CRISP_KEY = process.env.CRISP_KEY;
const CRISP_WEBSITE_ID = process.env.CRISP_WEBSITE_ID || '74f01aba-2977-4100-92ed-3297d60c6fcb';
const CRISP_LOCALE = process.env.CRISP_LOCALE || 'en';
const CRISP_API_BASE = 'https://api.crisp.chat/v1';
const DELAY_BETWEEN_REQUESTS = 1000; // milliseconds

// Validate required environment variables
if (!CRISP_IDENTIFIER || !CRISP_KEY) {
  console.error('❌ Error: CRISP_IDENTIFIER and CRISP_KEY environment variables are required');
  console.error('');
  console.error('To get your credentials:');
  console.error('1. Go to https://app.crisp.chat/settings/marketplace/');
  console.error('2. Create a plugin or select an existing one');
  console.error('3. Go to the "Tokens" tab');
  console.error('4. Generate a Development Token or Production Token');
  console.error('5. Copy the identifier and key');
  console.error('');
  console.error('Then set them:');
  console.error('  export CRISP_IDENTIFIER="your-identifier"');
  console.error('  export CRISP_KEY="your-key"');
  process.exit(1);
}

// Article frontmatter interface
interface ArticleFrontmatter {
  title: string;
  description?: string;
  category?: string;
  featured?: boolean;
  order?: number;
}

// Crisp API article payload
interface CrispArticle {
  title: string;
  description: string;
  content: string;
  featured: boolean;
  order: number;
}

// Create Basic Auth header
function getAuthHeader(): string {
  const credentials = `${CRISP_IDENTIFIER}:${CRISP_KEY}`;
  const base64 = Buffer.from(credentials).toString('base64');
  return `Basic ${base64}`;
}

// Delay helper for rate limiting
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Fetch categories from Crisp API to validate category slugs
 */
async function listCategories(): Promise<any[]> {
  const url = `${CRISP_API_BASE}/website/${CRISP_WEBSITE_ID}/helpdesk/locale/${CRISP_LOCALE}/categories/1`;

  console.log(`📂 Fetching categories from Crisp...`);

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': getAuthHeader(),
      'X-Crisp-Tier': 'plugin',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.warn(`⚠️  Could not fetch categories: ${response.status} ${errorText}`);
    return [];
  }

  const data = await response.json();
  const categories = data.data || [];

  if (categories.length > 0) {
    console.log(`✓ Found ${categories.length} existing categories`);
    categories.forEach((cat: any) => {
      console.log(`  - ${cat.name} (slug: ${cat.slug})`);
    });
  } else {
    console.log('ℹ️  No existing categories found');
  }

  return categories;
}

/**
 * Create a new helpdesk article in Crisp
 */
async function createArticle(article: CrispArticle): Promise<any> {
  const url = `${CRISP_API_BASE}/website/${CRISP_WEBSITE_ID}/helpdesk/locale/${CRISP_LOCALE}/article`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': getAuthHeader(),
      'X-Crisp-Tier': 'plugin',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(article),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to create article: ${response.status} ${errorText}`);
  }

  return await response.json();
}

/**
 * Process a single markdown file
 */
async function processMarkdownFile(filePath: string): Promise<void> {
  const fileName = path.basename(filePath);
  console.log(`\n📄 Processing: ${fileName}`);

  // Read and parse the markdown file
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const { data, content } = matter(fileContent);
  const frontmatter = data as ArticleFrontmatter;

  // Validate required fields
  if (!frontmatter.title) {
    console.error(`  ❌ Skipping: Missing required "title" in frontmatter`);
    return;
  }

  if (!content || content.trim().length === 0) {
    console.error(`  ❌ Skipping: Empty content`);
    return;
  }

  // Build article payload
  const article: CrispArticle = {
    title: frontmatter.title,
    description: frontmatter.description || '',
    content: content.trim(),
    featured: frontmatter.featured ?? false,
    order: frontmatter.order ?? 0,
  };

  console.log(`  Title: "${article.title}"`);
  console.log(`  Description: "${article.description.substring(0, 50)}${article.description.length > 50 ? '...' : ''}"`);
  console.log(`  Content length: ${article.content.length} characters`);
  console.log(`  Featured: ${article.featured}`);
  console.log(`  Order: ${article.order}`);
  if (frontmatter.category) {
    console.log(`  Category: ${frontmatter.category} (note: category assignment not implemented in this version)`);
  }

  try {
    // Create the article
    const result = await createArticle(article);
    console.log(`  ✅ Successfully created article!`);

    // Log the article ID if available
    if (result.data && result.data.article_id) {
      console.log(`  Article ID: ${result.data.article_id}`);
    }
  } catch (error) {
    console.error(`  ❌ Error creating article: ${error instanceof Error ? error.message : String(error)}`);
    throw error; // Re-throw to stop processing on error
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('═══════════════════════════════════════════════════');
  console.log('  Crisp Helpdesk Article Bulk Importer');
  console.log('═══════════════════════════════════════════════════');
  console.log('');
  console.log(`Website ID: ${CRISP_WEBSITE_ID}`);
  console.log(`Locale: ${CRISP_LOCALE}`);
  console.log(`Delay between requests: ${DELAY_BETWEEN_REQUESTS}ms`);
  console.log('');

  // Get articles directory from command line or use default
  const articlesDir = process.argv[2] || path.join(process.cwd(), 'docs', 'crisp-articles');

  if (!fs.existsSync(articlesDir)) {
    console.error(`❌ Error: Articles directory not found: ${articlesDir}`);
    console.error('');
    console.error('Please create the directory and add markdown files, or specify a different path:');
    console.error(`  npx ts-node scripts/crisp-bulk-import.ts path/to/articles`);
    process.exit(1);
  }

  console.log(`Articles directory: ${articlesDir}`);
  console.log('');

  // List existing categories
  try {
    await listCategories();
  } catch (error) {
    console.warn('⚠️  Could not fetch categories (will continue anyway)');
  }

  console.log('');
  console.log('─────────────────────────────────────────────────');

  // Find all markdown files
  const files = fs.readdirSync(articlesDir)
    .filter(file => file.endsWith('.md') || file.endsWith('.markdown'))
    .map(file => path.join(articlesDir, file));

  if (files.length === 0) {
    console.log('');
    console.log('⚠️  No markdown files found in the articles directory');
    console.log('');
    console.log('Create files with this format:');
    console.log('');
    console.log('  ---');
    console.log('  title: "Your Article Title"');
    console.log('  description: "A short description"');
    console.log('  category: "getting-started"');
    console.log('  featured: true');
    console.log('  order: 1');
    console.log('  ---');
    console.log('  ');
    console.log('  Your markdown content here...');
    console.log('');
    process.exit(0);
  }

  console.log(`Found ${files.length} markdown file(s) to process`);

  let successCount = 0;
  let errorCount = 0;

  // Process each file
  for (const file of files) {
    try {
      await processMarkdownFile(file);
      successCount++;

      // Rate limiting delay (except for the last file)
      if (file !== files[files.length - 1]) {
        console.log(`  ⏳ Waiting ${DELAY_BETWEEN_REQUESTS}ms before next request...`);
        await delay(DELAY_BETWEEN_REQUESTS);
      }
    } catch (error) {
      errorCount++;
      console.error(`  ❌ Failed to process ${path.basename(file)}`);

      // Check if it's a rate limit error
      if (error instanceof Error && error.message.includes('429')) {
        console.error('');
        console.error('⚠️  Rate limit exceeded! Consider:');
        console.error('  1. Increasing DELAY_BETWEEN_REQUESTS in the script');
        console.error('  2. Requesting a higher quota from Crisp support');
        console.error('  3. Using a production token instead of development token');
        console.error('');
        break; // Stop processing on rate limit
      }
    }
  }

  // Summary
  console.log('');
  console.log('─────────────────────────────────────────────────');
  console.log('');
  console.log('📊 Summary:');
  console.log(`  ✅ Successfully imported: ${successCount}`);
  console.log(`  ❌ Failed: ${errorCount}`);
  console.log(`  📝 Total files: ${files.length}`);
  console.log('');

  if (successCount > 0) {
    console.log(`🎉 Done! Visit your Crisp helpdesk to see the articles.`);
    console.log(`   https://app.crisp.chat/website/${CRISP_WEBSITE_ID}/helpdesk/`);
  }

  console.log('');
  console.log('═══════════════════════════════════════════════════');

  process.exit(errorCount > 0 ? 1 : 0);
}

// Run the script
main().catch((error) => {
  console.error('');
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
