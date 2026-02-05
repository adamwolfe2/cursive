# Marketing Scripts

This directory contains utility scripts for the Cursive marketing site.

## Available Scripts

### optimize-images.js

Optimizes images for web performance using Sharp.

**Features:**
- Converts images to WebP, JPEG, or PNG
- Resizes to maximum dimensions
- Compresses with quality control
- Generates multiple responsive sizes
- Reports size savings

**Installation:**

```bash
npm install
```

**Usage:**

```bash
# Basic usage (80% quality WebP, max 1920px)
node scripts/optimize-images.js public/image.png

# Custom quality
node scripts/optimize-images.js public/image.png --quality 85

# Custom dimensions
node scripts/optimize-images.js public/image.png --max-width 1200

# Generate multiple sizes for responsive images
node scripts/optimize-images.js public/image.png --sizes 640,1280,1920

# Output to different directory
node scripts/optimize-images.js public/image.png --output public/optimized

# Different format (jpeg, png, webp)
node scripts/optimize-images.js public/image.png --format jpeg --quality 90
```

**Options:**
- `--quality <number>`: Quality setting (1-100, default: 80)
- `--max-width <number>`: Maximum width in pixels (default: 1920)
- `--sizes <widths>`: Generate multiple sizes (comma-separated)
- `--output <path>`: Output directory (default: same as input)
- `--format <format>`: Output format: webp, jpeg, png (default: webp)

**Examples:**

```bash
# Optimize social preview image
node scripts/optimize-images.js public/cursive-social-preview.png --quality 80 --max-width 1920

# Create responsive image set
node scripts/optimize-images.js public/hero.png --sizes 640,1280,1920 --quality 85

# Batch optimize all PNGs in a directory
for file in public/*.png; do
  node scripts/optimize-images.js "$file"
done
```

### notify-indexnow.js

Notifies search engines of updated content via IndexNow protocol.

Automatically runs after build via `postbuild` script.

## Adding New Scripts

When adding new scripts:

1. Add the script to this directory
2. Add execute permissions: `chmod +x scripts/your-script.js`
3. Add a shebang line: `#!/usr/bin/env node`
4. Document usage in this README
5. Add to package.json scripts if needed

## Troubleshooting

### "sharp not installed" error

Install sharp as a dev dependency:

```bash
npm install --save-dev sharp
```

### Permission denied

Make the script executable:

```bash
chmod +x scripts/optimize-images.js
```

### Out of memory errors

For large images, try:

```bash
NODE_OPTIONS="--max-old-space-size=4096" node scripts/optimize-images.js large-image.png
```
