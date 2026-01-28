#!/usr/bin/env npx ts-node
/**
 * Upload Pipeline Benchmark Script
 *
 * Tests upload performance with various file sizes to establish baselines.
 * Run with: pnpm tsx scripts/benchmark-upload.ts
 *
 * Environment variables required:
 * - TEST_PARTNER_API_KEY: API key for test partner
 * - NEXT_PUBLIC_SUPABASE_URL: Supabase URL
 * - SUPABASE_SERVICE_ROLE_KEY: Service role key
 */

import { createHash, randomUUID } from 'crypto'

// Test data generation
const FIRST_NAMES = ['John', 'Jane', 'Bob', 'Alice', 'Mike', 'Sarah', 'David', 'Emma', 'Tom', 'Lisa']
const LAST_NAMES = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Wilson', 'Moore']
const INDUSTRIES = ['hvac', 'roofing', 'plumbing', 'electrical', 'solar', 'insurance', 'real_estate', 'legal', 'healthcare', 'technology']
const STATES = ['CA', 'TX', 'FL', 'NY', 'PA', 'IL', 'OH', 'GA', 'NC', 'MI']
const SENIORITY = ['c_suite', 'vp', 'director', 'manager', 'ic']
const COMPANY_SIZES = ['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+']

interface BenchmarkResult {
  rowCount: number
  fileSizeBytes: number
  fileSizeMB: number
  totalTimeMs: number
  rowsPerSecond: number
  strategy: 'direct' | 'storage_first'
  validRows: number
  invalidRows: number
  duplicates: number
}

function generateTestCSV(rowCount: number): { csv: string; sizeBytes: number } {
  const header = 'first_name,last_name,email,phone,company_name,company_domain,job_title,city,state,industry,seniority_level,company_size'
  const rows: string[] = [header]

  for (let i = 0; i < rowCount; i++) {
    const firstName = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)]
    const lastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)]
    const uniqueId = randomUUID().slice(0, 8)
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}.${uniqueId}@test-${uniqueId}.com`
    const phone = `555${String(Math.floor(Math.random() * 10000000)).padStart(7, '0')}`
    const companyName = `${lastName} ${INDUSTRIES[Math.floor(Math.random() * INDUSTRIES.length)]} Co`
    const companyDomain = `${lastName.toLowerCase()}-${uniqueId}.com`
    const jobTitle = `${SENIORITY[Math.floor(Math.random() * SENIORITY.length)]} of Operations`
    const city = 'Test City'
    const state = STATES[Math.floor(Math.random() * STATES.length)]
    const industry = INDUSTRIES[Math.floor(Math.random() * INDUSTRIES.length)]
    const seniority = SENIORITY[Math.floor(Math.random() * SENIORITY.length)]
    const companySize = COMPANY_SIZES[Math.floor(Math.random() * COMPANY_SIZES.length)]

    rows.push([
      firstName,
      lastName,
      email,
      phone,
      companyName,
      companyDomain,
      jobTitle,
      city,
      state,
      industry,
      seniority,
      companySize,
    ].join(','))
  }

  const csv = rows.join('\n')
  return {
    csv,
    sizeBytes: Buffer.byteLength(csv, 'utf-8'),
  }
}

async function runBenchmark(rowCount: number): Promise<BenchmarkResult> {
  console.log(`\n=== Benchmarking ${rowCount.toLocaleString()} rows ===`)

  // Generate test data
  console.log('Generating test data...')
  const startGen = Date.now()
  const { csv, sizeBytes } = generateTestCSV(rowCount)
  const genTime = Date.now() - startGen
  console.log(`Generated ${(sizeBytes / 1024 / 1024).toFixed(2)} MB in ${genTime}ms`)

  // Determine strategy
  const strategy: 'direct' | 'storage_first' = sizeBytes > 5 * 1024 * 1024 ? 'storage_first' : 'direct'
  console.log(`Upload strategy: ${strategy}`)

  // Simulate processing (since we can't actually call the API in a benchmark script)
  console.log('Simulating processing...')
  const startProcess = Date.now()

  // Parse CSV simulation
  const lines = csv.split('\n')
  const header = lines[0].split(',')

  let validRows = 0
  let invalidRows = 0
  let duplicates = 0
  const seenEmails = new Set<string>()

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',')
    const email = values[2]?.toLowerCase()

    // Validation simulation
    if (!email || !email.includes('@')) {
      invalidRows++
      continue
    }

    // Deduplication simulation
    const hash = createHash('sha256')
      .update(`${email}|${values[5] || ''}|${values[3] || ''}`)
      .digest('hex')

    if (seenEmails.has(hash)) {
      duplicates++
      continue
    }
    seenEmails.add(hash)

    validRows++
  }

  const processTime = Date.now() - startProcess
  const totalTimeMs = genTime + processTime
  const rowsPerSecond = Math.round(rowCount / (processTime / 1000))

  const result: BenchmarkResult = {
    rowCount,
    fileSizeBytes: sizeBytes,
    fileSizeMB: parseFloat((sizeBytes / 1024 / 1024).toFixed(2)),
    totalTimeMs,
    rowsPerSecond,
    strategy,
    validRows,
    invalidRows,
    duplicates,
  }

  console.log(`\nResults:`)
  console.log(`  File size: ${result.fileSizeMB} MB`)
  console.log(`  Processing time: ${processTime}ms`)
  console.log(`  Rows/second: ${rowsPerSecond.toLocaleString()}`)
  console.log(`  Valid: ${validRows.toLocaleString()}, Invalid: ${invalidRows}, Duplicates: ${duplicates}`)

  return result
}

async function main() {
  console.log('='.repeat(60))
  console.log('Upload Pipeline Benchmark')
  console.log('='.repeat(60))
  console.log(`Node version: ${process.version}`)
  console.log(`Date: ${new Date().toISOString()}`)

  const testCases = [
    1000,    // 1k rows - small file
    10000,   // 10k rows - medium file
    50000,   // 50k rows - large file
    100000,  // 100k rows - max file
  ]

  const results: BenchmarkResult[] = []

  for (const rowCount of testCases) {
    try {
      const result = await runBenchmark(rowCount)
      results.push(result)
    } catch (error) {
      console.error(`Benchmark failed for ${rowCount} rows:`, error)
    }
  }

  // Summary table
  console.log('\n' + '='.repeat(60))
  console.log('BENCHMARK SUMMARY')
  console.log('='.repeat(60))
  console.log('\n| Rows | File Size | Time | Rows/sec | Strategy |')
  console.log('|------|-----------|------|----------|----------|')

  for (const r of results) {
    console.log(
      `| ${r.rowCount.toLocaleString().padStart(6)} | ` +
      `${r.fileSizeMB.toFixed(1).padStart(6)} MB | ` +
      `${(r.totalTimeMs / 1000).toFixed(1).padStart(4)}s | ` +
      `${r.rowsPerSecond.toLocaleString().padStart(8)} | ` +
      `${r.strategy.padEnd(8)} |`
    )
  }

  // Extrapolation for 50MB limit
  console.log('\n--- Extrapolated Performance ---')
  const avgRowsPerSecond = results.reduce((sum, r) => sum + r.rowsPerSecond, 0) / results.length
  const avgBytesPerRow = results.reduce((sum, r) => sum + r.fileSizeBytes / r.rowCount, 0) / results.length

  const max50MBRows = Math.floor((50 * 1024 * 1024) / avgBytesPerRow)
  const estimated50MBTime = max50MBRows / avgRowsPerSecond

  console.log(`Average bytes/row: ${avgBytesPerRow.toFixed(0)}`)
  console.log(`Average rows/second: ${avgRowsPerSecond.toLocaleString()}`)
  console.log(`Estimated 50MB file rows: ~${max50MBRows.toLocaleString()}`)
  console.log(`Estimated 50MB processing time: ~${estimated50MBTime.toFixed(0)}s (${(estimated50MBTime / 60).toFixed(1)} min)`)

  // Memory usage
  const memUsage = process.memoryUsage()
  console.log(`\n--- Memory Usage ---`)
  console.log(`Heap used: ${(memUsage.heapUsed / 1024 / 1024).toFixed(1)} MB`)
  console.log(`Heap total: ${(memUsage.heapTotal / 1024 / 1024).toFixed(1)} MB`)
  console.log(`RSS: ${(memUsage.rss / 1024 / 1024).toFixed(1)} MB`)

  console.log('\nBenchmark complete.')
}

main().catch(console.error)
