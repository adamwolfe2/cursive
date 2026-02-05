# Quick Image Optimization Guide

A one-page reference for adding and optimizing images on the Cursive marketing site.

## Before Adding Any Image

1. Check file size: `ls -lh path/to/image.png`
2. If over limits, optimize first (see below)
3. Use descriptive alt text

## Size Limits

| Type | Max Size | Format |
|------|----------|--------|
| Photos/Screenshots | 100KB | WebP |
| Logos/Icons | 10KB | SVG or PNG |
| Social Previews | 200KB | WebP or PNG |

## Quick Optimization

```bash
# Install dependencies (one time)
npm install

# Optimize image (default: WebP, 80% quality, max 1920px)
node scripts/optimize-images.js public/your-image.png

# For smaller file size
node scripts/optimize-images.js public/your-image.png --quality 70
```

## Using Images in Code

### Next.js Image Component (Preferred)

```tsx
import Image from 'next/image'

// Standard usage
<Image
  src="/image.png"
  alt="Descriptive alt text"
  width={800}
  height={600}
/>

// Above-the-fold (header, hero)
<Image
  src="/logo.png"
  alt="Cursive logo"
  width={32}
  height={32}
  priority
/>
```

### Native img Tag (for SVGs)

```tsx
// SVG logos
<img
  src="/integrations/slack.svg"
  alt="Slack integration logo"
  loading="lazy"
  className="w-12 h-12"
/>
```

## Alt Text Examples

```tsx
// Logos
alt="Cursive logo"

// Integration logos
alt="Slack integration logo"
alt="HubSpot integration logo"

// Profile pictures
alt={`${author.name} profile picture`}

// Social previews
alt="Cursive - AI Intent Systems That Never Sleep - Dashboard showing visitor identification and lead generation"

// Feature screenshots
alt="Dashboard view showing visitor identification panel with 247 identified visitors"
```

## Common Issues

### Image too large?
```bash
node scripts/optimize-images.js path/to/image.png --quality 75
```

### Image blurry on retina?
- Provide 2x resolution image
- Use SVG for logos/icons

### Layout shift on load?
- Always specify width and height
- Use Next.js Image component

## Need More Help?

- Full guide: `/marketing/docs/IMAGE-OPTIMIZATION.md`
- Script docs: `/marketing/scripts/README.md`
- Audit report: `/marketing/IMAGE-OPTIMIZATION-AUDIT.md`

---

**Quick Command Reference**

```bash
# Optimize single image
node scripts/optimize-images.js public/image.png

# Multiple sizes (responsive)
node scripts/optimize-images.js public/image.png --sizes 640,1280,1920

# Higher quality
node scripts/optimize-images.js public/image.png --quality 90

# Check large images
find public -type f \( -name "*.png" -o -name "*.jpg" \) -size +100k
```
