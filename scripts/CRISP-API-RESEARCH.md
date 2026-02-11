# Crisp API Research Summary

Research conducted on February 11, 2026 for bulk-uploading helpdesk articles to Crisp.

## API Overview

**Base URL**: `https://api.crisp.chat/v1`

**Website ID**: `74f01aba-2977-4100-92ed-3297d60c6fcb`

## Authentication

### Method

HTTP Basic Authentication with Base64 encoding:

```
Authorization: Basic BASE64(identifier:key)
```

### Required Header

```
X-Crisp-Tier: plugin
```

### Getting Credentials

1. Navigate to: https://app.crisp.chat/settings/marketplace/
2. Create a plugin (or select existing)
3. Go to "Tokens" tab
4. Generate Development Token (for testing) or Production Token (for production)
5. Copy the identifier and key pair

**Token Types**:
- **Development Token**: No scope restrictions, easy to generate, good for testing
- **Production Token**: Requires approval, scoped permissions, for production use

## Article Endpoints

### Create Article

```
POST /v1/website/{website_id}/helpdesk/locale/{locale}/article
```

**Request Headers**:
```
Authorization: Basic BASE64(identifier:key)
X-Crisp-Tier: plugin
Content-Type: application/json
```

**Request Body**:
```json
{
  "title": "Article Title",
  "description": "Optional short description",
  "content": "Markdown content here...",
  "featured": false,
  "order": 0
}
```

**Response**:
```json
{
  "data": {
    "article_id": "abc123..."
  }
}
```

### List Categories

```
GET /v1/website/{website_id}/helpdesk/locale/{locale}/categories/{page}
```

Returns existing categories with their slugs. Useful for validating category assignments.

### Update Article (Not Implemented in Script)

```
POST /v1/website/{website_id}/helpdesk/locale/{locale}/article/{article_id}
```

Can be used to update existing articles. Requires article_id.

## Article Fields

### Required Fields

- **title** (string): The article title
- **content** (string): Article body in Markdown format

### Optional Fields

- **description** (string): Short summary/description (default: empty string)
- **featured** (boolean): Whether to feature the article (default: false)
- **order** (number): Display order, higher numbers appear first (default: 0)

### Not Currently Supported

- **category**: Category assignment requires additional API calls after creation
- **tags**: Not available in the create endpoint
- **author**: Set automatically to the API token owner

## Content Formatting

### Markdown Support

Crisp helpdesk articles support **Markdown** formatting:

- Headers (H1-H6)
- **Bold** and *italic* text
- Lists (ordered and unordered)
- Links: `[text](url)`
- Images: `![alt](url)`
- Code blocks (inline and fenced)
- Tables (up to 50 rows)
- Blockquotes
- Horizontal rules

### HTML Support

- HTML frames can be embedded using special syntax
- iFrames must be published before visualization
- For advanced formatting, consider using HTML mode

## Rate Limiting

### Plugin Token Limits

- **Per-minute limits**: Plugin tokens are NOT subject to per-minute rate limiting
- **Daily quota**: Plugin tokens have a daily request quota instead
- **Quota varies**: Each integration may have different daily limits
- **Increase quota**: Contact Crisp support to request higher limits

### Recommended Delays

- Default: 1000ms (1 second) between requests
- If you hit 429 errors: Increase to 2000ms or more
- Plugin tokens generally have high limits, but be respectful

### Error Codes

- **429 Too Many Requests**: You've exceeded your rate limit
- **420 Enhance Your Calm**: Alternative rate limit error

## Locales

### Supported Locales

Crisp supports multiple locales for articles. Common codes:

- `en` - English
- `fr` - French
- `es` - Spanish
- `de` - German
- `pt` - Portuguese
- `it` - Italian

Articles are locale-specific. Create separate articles for each language.

## Limitations & Considerations

### Current Script Limitations

1. **No category assignment**: The script creates articles but doesn't assign them to categories
   - Workaround: Manually assign in Crisp dashboard
   - Future: Could add category creation/assignment API calls

2. **No update support**: The script only creates new articles
   - Workaround: Delete old articles in dashboard first
   - Future: Could add update mode with article ID lookup

3. **No bulk delete**: No way to delete articles via the script
   - Workaround: Use Crisp dashboard

4. **Single locale**: Script processes one locale at a time
   - Workaround: Run multiple times with different CRISP_LOCALE values
   - Future: Could add multi-locale support

### API Limitations

1. **No bulk create endpoint**: Must create articles one at a time
2. **No transaction support**: Can't rollback if some articles fail
3. **No duplicate detection**: API doesn't prevent duplicate titles

## Best Practices

### Content Guidelines

1. **Clear titles**: Use descriptive, searchable titles
2. **Good descriptions**: Write concise summaries for previews
3. **Structured content**: Use headers and lists for readability
4. **Link related articles**: Cross-reference related content
5. **Keep it updated**: Review and update articles regularly

### API Usage

1. **Respect rate limits**: Use reasonable delays between requests
2. **Handle errors gracefully**: Catch and log all errors
3. **Validate before upload**: Check frontmatter before API calls
4. **Monitor quotas**: Track your daily API usage
5. **Use production tokens**: For production deployments

### Organization

1. **Use categories**: Organize articles into logical categories
2. **Feature important articles**: Mark key articles as featured
3. **Set order thoughtfully**: Use order field for important articles
4. **Keep files organized**: Use clear filenames and directory structure

## Node.js SDK

Crisp provides an official Node.js SDK: `crisp-api`

```bash
npm install crisp-api
```

**Example Usage**:
```javascript
const Crisp = require('crisp-api');
const CrispClient = new Crisp();

CrispClient.authenticateTier('plugin', identifier, key);

const article = await CrispClient.website.addNewHelpdeskLocaleArticle(
  websiteId,
  locale,
  title
);
```

**Note**: The script in this project uses direct HTTP calls via `fetch` instead of the SDK for:
- Better TypeScript support
- More control over requests
- Fewer dependencies
- Educational purposes (shows exactly what's being sent)

## Resources

### Official Documentation

- **REST API Reference**: https://docs.crisp.chat/references/rest-api/v1/
- **Authentication Guide**: https://docs.crisp.chat/guides/rest-api/authentication/
- **Rate Limits**: https://docs.crisp.chat/guides/rest-api/rate-limits/
- **Quickstart**: https://docs.crisp.chat/guides/rest-api/quickstart/

### Knowledge Base

- **Formatting Articles**: https://help.crisp.chat/en/article/how-can-i-format-knowledge-base-articles-oiurpj/
- **REST API Usage**: https://help.crisp.chat/en/article/how-do-i-use-the-rest-api-1b25hnd/

### GitHub Repositories

- **Node.js SDK**: https://github.com/crisp-im/node-crisp-api
- **Python SDK**: https://github.com/crisp-im/python-crisp-api
- **Go SDK**: https://github.com/crisp-im/go-crisp-api
- **PHP SDK**: https://github.com/crisp-im/php-crisp-api

## Testing

### Recommended Testing Workflow

1. **Start with development token**: Easier to generate, no approval needed
2. **Test with one article**: Verify authentication and API calls work
3. **Check the Crisp dashboard**: Confirm article appears correctly
4. **Test error handling**: Try invalid data to verify error handling
5. **Test rate limiting**: Try rapid requests to test delay mechanism
6. **Scale up gradually**: Process more articles once confident

### Development Token vs Production Token

| Feature | Development | Production |
|---------|-------------|------------|
| Approval needed | No | Yes |
| Scope restrictions | None | Scoped |
| Rate limits | Standard | May be higher |
| Best for | Testing | Production |

## Future Enhancements

Potential improvements to the script:

1. **Category support**:
   - Auto-create categories if they don't exist
   - Assign articles to categories after creation

2. **Update mode**:
   - Detect existing articles by title
   - Update instead of creating duplicates

3. **Multi-locale support**:
   - Process multiple locales in one run
   - Language-specific subdirectories

4. **Dry-run mode**:
   - Preview what would be created without making API calls
   - Validate all files before uploading

5. **Progress tracking**:
   - Show progress bar
   - Save state to resume interrupted uploads

6. **Batch operations**:
   - Delete all articles
   - Export all articles to markdown

7. **Advanced error handling**:
   - Retry failed uploads
   - Save failed articles for manual review

8. **Validation improvements**:
   - Check for broken links in content
   - Validate image URLs
   - Enforce maximum content length

## API Schema (TypeScript)

```typescript
interface CrispArticle {
  title: string;
  description: string;
  content: string;
  featured: boolean;
  order: number;
}

interface CrispArticleResponse {
  data: {
    article_id: string;
  };
}

interface CrispCategory {
  id: string;
  name: string;
  slug: string;
  order: number;
  // ... other fields
}

interface CrispError {
  error: {
    reason: string;
    message: string;
  };
}
```

## Conclusion

The Crisp API provides a straightforward way to programmatically create helpdesk articles. The authentication is simple (Basic Auth), the endpoints are well-designed, and rate limits are reasonable for plugin tokens.

The bulk import script created in this project provides a solid foundation for managing helpdesk content as code, allowing you to:

- Version control your articles
- Edit in your favorite text editor
- Deploy articles programmatically
- Maintain consistency across articles

For production use, consider:
- Requesting a production token
- Setting up CI/CD for automatic deployments
- Implementing the suggested enhancements
- Monitoring API usage and quotas
