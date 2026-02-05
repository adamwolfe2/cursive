#!/usr/bin/env node

/**
 * Image Optimization Script
 *
 * Optimizes images for web performance:
 * - Converts PNG/JPG to WebP format
 * - Resizes images to maximum dimensions
 * - Compresses with quality setting
 * - Generates multiple sizes for responsive images
 *
 * Usage:
 *   node scripts/optimize-images.js <input-path> [options]
 *
 * Options:
 *   --quality <number>    Quality setting (1-100, default: 80)
 *   --max-width <number>  Maximum width in pixels (default: 1920)
 *   --sizes <widths>      Generate multiple sizes (comma-separated, e.g., "640,1280,1920")
 *   --output <path>       Output directory (default: same as input)
 *   --format <format>     Output format: webp, jpeg, png (default: webp)
 *
 * Examples:
 *   node scripts/optimize-images.js public/cursive-social-preview.png
 *   node scripts/optimize-images.js public/image.png --quality 85 --max-width 1200
 *   node scripts/optimize-images.js public/image.png --sizes 640,1280,1920
 */

const fs = require('fs');
const path = require('path');

// Parse command line arguments
const args = process.argv.slice(2);
if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
  console.log('Usage: node scripts/optimize-images.js <input-path> [options]');
  console.log('\nOptions:');
  console.log('  --quality <number>    Quality setting (1-100, default: 80)');
  console.log('  --max-width <number>  Maximum width in pixels (default: 1920)');
  console.log('  --sizes <widths>      Generate multiple sizes (comma-separated)');
  console.log('  --output <path>       Output directory (default: same as input)');
  console.log('  --format <format>     Output format: webp, jpeg, png (default: webp)');
  console.log('\nExamples:');
  console.log('  node scripts/optimize-images.js public/cursive-social-preview.png');
  console.log('  node scripts/optimize-images.js public/image.png --quality 85 --max-width 1200');
  console.log('  node scripts/optimize-images.js public/image.png --sizes 640,1280,1920');
  process.exit(0);
}

const inputPath = args[0];
const options = {
  quality: 80,
  maxWidth: 1920,
  sizes: null,
  output: null,
  format: 'webp'
};

// Parse options
for (let i = 1; i < args.length; i += 2) {
  const flag = args[i];
  const value = args[i + 1];

  switch (flag) {
    case '--quality':
      options.quality = parseInt(value, 10);
      break;
    case '--max-width':
      options.maxWidth = parseInt(value, 10);
      break;
    case '--sizes':
      options.sizes = value.split(',').map(s => parseInt(s.trim(), 10));
      break;
    case '--output':
      options.output = value;
      break;
    case '--format':
      options.format = value;
      break;
  }
}

// Check if sharp is installed
try {
  require.resolve('sharp');
} catch (e) {
  console.error('Error: sharp package is not installed.');
  console.error('Install it with: npm install --save-dev sharp');
  process.exit(1);
}

const sharp = require('sharp');

async function optimizeImage(inputPath, options) {
  // Validate input file exists
  if (!fs.existsSync(inputPath)) {
    console.error(`Error: Input file not found: ${inputPath}`);
    process.exit(1);
  }

  const inputDir = path.dirname(inputPath);
  const inputExt = path.extname(inputPath);
  const inputName = path.basename(inputPath, inputExt);
  const outputDir = options.output || inputDir;

  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  console.log(`Optimizing: ${inputPath}`);
  console.log(`Quality: ${options.quality}%`);
  console.log(`Max width: ${options.maxWidth}px`);
  console.log(`Format: ${options.format}`);

  // Get input image metadata
  const metadata = await sharp(inputPath).metadata();
  console.log(`\nInput image: ${metadata.width}x${metadata.height} (${(fs.statSync(inputPath).size / 1024).toFixed(2)} KB)`);

  const sizesToGenerate = options.sizes || [options.maxWidth];

  for (const targetWidth of sizesToGenerate) {
    // Don't upscale images
    const width = Math.min(targetWidth, metadata.width);

    const suffix = options.sizes ? `-${width}w` : '';
    const outputExt = options.format === 'jpeg' ? 'jpg' : options.format;
    const outputPath = path.join(outputDir, `${inputName}${suffix}.${outputExt}`);

    let pipeline = sharp(inputPath).resize(width, null, {
      withoutEnlargement: true,
      fit: 'inside'
    });

    // Apply format-specific optimization
    switch (options.format) {
      case 'webp':
        pipeline = pipeline.webp({ quality: options.quality });
        break;
      case 'jpeg':
        pipeline = pipeline.jpeg({ quality: options.quality, mozjpeg: true });
        break;
      case 'png':
        pipeline = pipeline.png({ quality: options.quality, compressionLevel: 9 });
        break;
    }

    await pipeline.toFile(outputPath);

    const outputSize = fs.statSync(outputPath).size;
    const inputSize = fs.statSync(inputPath).size;
    const savings = ((1 - outputSize / inputSize) * 100).toFixed(1);

    console.log(`\nGenerated: ${outputPath}`);
    console.log(`  Size: ${(outputSize / 1024).toFixed(2)} KB (${savings}% smaller)`);
  }

  console.log('\n✓ Optimization complete!');
}

// Run optimization
optimizeImage(inputPath, options).catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
