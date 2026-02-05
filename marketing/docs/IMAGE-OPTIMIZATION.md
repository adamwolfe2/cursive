# Image Optimization Guide

This guide covers best practices for optimizing images on the Cursive marketing site to improve performance and SEO.

## Quick Reference

### Image Size Limits

- **Photos/Screenshots**: Max 100KB
- **Logos/Icons**: Max 10KB
- **Social Preview Images**: Max 200KB

### Recommended Formats

- **Photos**: WebP (fallback to JPEG if needed)
- **Logos/Icons**: SVG (fallback to PNG for complex graphics)
- **Social Previews**: WebP or optimized PNG

### Dimensions

- **Social Preview**: 1200x630px (or 1.91:1 ratio)
- **Blog Headers**: 1920x1080px max
- **Integration Logos**: 48x48px (use SVG for scaling)

## Optimization Workflow

### 1. Before Adding New Images

Before adding any image to the project:

1. **Check the file size**
   ```bash
   ls -lh path/to/image.png
   ```

2. **Optimize if needed** (see tools below)

3. **Add descriptive alt text** for SEO and accessibility

### 2. Using the Optimization Script

We provide a Node.js script for batch optimization using Sharp:

```bash
# Install dependencies first
npm install

# Basic optimization (converts to WebP, 80% quality, max 1920px width)
node scripts/optimize-images.js public/cursive-social-preview.png

# Custom quality and dimensions
node scripts/optimize-images.js public/image.png --quality 85 --max-width 1200

# Generate multiple responsive sizes
node scripts/optimize-images.js public/image.png --sizes 640,1280,1920

# Specify output directory
node scripts/optimize-images.js public/image.png --output public/optimized
```

#### Script Options

- `--quality <number>`: Quality setting (1-100, default: 80)
- `--max-width <number>`: Maximum width in pixels (default: 1920)
- `--sizes <widths>`: Generate multiple sizes (comma-separated)
- `--output <path>`: Output directory (default: same as input)
- `--format <format>`: Output format: webp, jpeg, png (default: webp)

### 3. Manual Optimization Tools

If you prefer GUI tools:

- **Mac**: ImageOptim (free)
- **Windows**: FileOptimizer (free)
- **Online**: Squoosh.app, TinyPNG

## Implementation Best Practices

### Using Next.js Image Component

Always use the Next.js `Image` component for optimal performance:

```tsx
import Image from 'next/image'

// Good: Proper implementation
<Image
  src="/image.png"
  alt="Descriptive alt text for SEO"
  width={800}
  height={600}
  priority  // Only for above-the-fold images
/>

// Bad: Missing alt text and dimensions
<Image src="/image.png" alt="" />
```

### Alt Text Guidelines

Write descriptive alt text for every image:

```tsx
// Logos
<Image src="/cursive-logo.png" alt="Cursive logo" width={32} height={32} />

// Integration logos
<img src="/integrations/slack.svg" alt="Slack integration logo" />

// Screenshots/Social previews
<Image
  src="/cursive-social-preview.png"
  alt="Cursive - AI Intent Systems That Never Sleep - Dashboard showing visitor identification and lead generation"
  width={1314}
  height={1129}
/>

// Author photos
<Image
  src={author.avatar}
  alt={`${author.name} profile picture`}
  width={80}
  height={80}
/>
```

### Lazy Loading

The Next.js Image component handles lazy loading automatically. For native `<img>` tags:

```tsx
<img
  src="/integrations/slack.svg"
  alt="Slack integration logo"
  loading="lazy"  // Lazy load images below the fold
/>
```

### Priority Loading

Use `priority` prop for above-the-fold images:

```tsx
// Logo in header - loads immediately
<Image src="/cursive-logo.png" alt="Cursive logo" width={32} height={32} priority />

// Hero image - loads immediately
<Image src="/hero.png" alt="Hero image" width={1200} height={600} priority />
```

## Format Decision Tree

```
Is it a logo or icon?
├─ Yes → Use SVG if possible
│         Otherwise → PNG with transparency
│
└─ No → Is it a photo/screenshot?
        ├─ Yes → Use WebP (80% quality)
        │         Fallback → JPEG (85% quality)
        │
        └─ No → Is it a social preview?
                  → Use WebP or optimized PNG
```

## Responsive Images

For images that need multiple sizes:

```tsx
// Generate multiple sizes with the script
node scripts/optimize-images.js public/hero.png --sizes 640,1280,1920

// Use in Next.js
<Image
  src="/hero.webp"
  alt="Hero image"
  width={1920}
  height={1080}
  sizes="(max-width: 640px) 640px, (max-width: 1280px) 1280px, 1920px"
/>
```

## Optimization Checklist

Before deploying:

- [ ] All images are under size limits
- [ ] All `<Image>` components have `alt` attributes
- [ ] All `<Image>` components have explicit `width` and `height`
- [ ] Above-the-fold images use `priority` prop
- [ ] Below-the-fold images use lazy loading
- [ ] Social preview images have descriptive alt text
- [ ] Integration logos have proper alt text (e.g., "Slack integration logo")

## Common Issues and Solutions

### Issue: Image is too large (>100KB)

**Solution**: Use the optimization script

```bash
node scripts/optimize-images.js path/to/image.png --quality 80
```

### Issue: Image looks blurry on retina displays

**Solution**: Provide 2x resolution source

```tsx
// Provide 2x image source for crisp display
<Image src="/logo@2x.png" alt="Logo" width={100} height={100} />
```

### Issue: CLS (Cumulative Layout Shift) on images

**Solution**: Always specify width and height

```tsx
// Good: Prevents layout shift
<Image src="/image.png" alt="Image" width={800} height={600} />

// Bad: Causes layout shift
<Image src="/image.png" alt="Image" />
```

### Issue: Images loading slowly

**Solution**: Use priority for critical images, lazy load others

```tsx
// Critical images
<Image src="/hero.png" alt="Hero" width={1200} height={600} priority />

// Non-critical images (lazy loaded by default)
<Image src="/feature.png" alt="Feature" width={600} height={400} />
```

## Performance Metrics

Target metrics for images:

- **Largest Contentful Paint (LCP)**: < 2.5s
- **Cumulative Layout Shift (CLS)**: < 0.1
- **First Input Delay (FID)**: < 100ms

Check your metrics:

```bash
# Use Lighthouse in Chrome DevTools
# Or run from CLI
npx lighthouse https://meetcursive.com --view
```

## Advanced: WebP with JPEG Fallback

Next.js automatically handles fallbacks, but for native `<picture>` elements:

```tsx
<picture>
  <source srcSet="/image.webp" type="image/webp" />
  <source srcSet="/image.jpg" type="image/jpeg" />
  <img src="/image.jpg" alt="Description" loading="lazy" />
</picture>
```

## Resources

- [Next.js Image Optimization](https://nextjs.org/docs/app/api-reference/components/image)
- [Web.dev Image Optimization](https://web.dev/fast/#optimize-your-images)
- [Sharp Documentation](https://sharp.pixelplumbing.com/)
- [WebP Format](https://developers.google.com/speed/webp)

## Maintenance

Run periodic audits:

```bash
# Check for large images
find public -type f \( -name "*.png" -o -name "*.jpg" -o -name "*.jpeg" \) -size +100k

# Optimize all images in a directory
for file in public/*.png; do
  node scripts/optimize-images.js "$file"
done
```

---

**Last Updated**: 2026-02-04
