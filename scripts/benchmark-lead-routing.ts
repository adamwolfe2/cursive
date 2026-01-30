/**
 * Lead Routing Performance Benchmark Script
 *
 * Tests atomic routing performance under various load conditions.
 * Run with: tsx scripts/benchmark-lead-routing.ts
 *
 * Requirements:
 * - Test database configured
 * - Admin Supabase client credentials
 * - Migrations applied
 */

import { createAdminClient } from '@/lib/supabase/admin'
import { LeadRoutingService } from '@/lib/services/lead-routing.service'
import crypto from 'crypto'

interface BenchmarkResult {
  scenario: string
  totalLeads: number
  successCount: number
  failureCount: number
  duplicateCount: number
  avgLatencyMs: number
  p50LatencyMs: number
  p95LatencyMs: number
  p99LatencyMs: number
  maxLatencyMs: number
  throughputLeadsPerSec: number
  lockSuccessRate: number
  retryQueueDepth: number
}

interface RoutingAttempt {
  success: boolean
  latencyMs: number
  lockAcquired: boolean
  isDuplicate: boolean
  error?: string
}

class LeadRoutingBenchmark {
  private supabase = createAdminClient()
  private testWorkspaceId: string = ''
  private testWorkspaceId2: string = ''
  private testRuleId: string = ''

  /**
   * Setup test environment
   */
  async setup(): Promise<void> {
    console.log('🔧 Setting up benchmark environment...\n')

    // Create test workspaces
    const { data: workspace1 } = await this.supabase
      .from('workspaces')
      .insert({
        name: 'Benchmark Workspace 1',
        workspace_type: 'standard',
        allowed_industries: ['Technology', 'Software'],
        allowed_regions: ['US'],
      })
      .select('id')
      .single()

    const { data: workspace2 } = await this.supabase
      .from('workspaces')
      .insert({
        name: 'Benchmark Workspace 2 (Partner)',
        workspace_type: 'partner',
        allowed_industries: ['Technology'],
        allowed_regions: ['US', 'CA'],
      })
      .select('id')
      .single()

    this.testWorkspaceId = workspace1!.id
    this.testWorkspaceId2 = workspace2!.id

    // Create test routing rule
    const { data: rule } = await this.supabase
      .from('lead_routing_rules')
      .insert({
        workspace_id: this.testWorkspaceId,
        rule_name: 'Benchmark Tech Rule',
        destination_workspace_id: this.testWorkspaceId2,
        priority: 100,
        is_active: true,
        conditions: {
          industries: ['Technology'],
        },
      })
      .select('id')
      .single()

    this.testRuleId = rule!.id

    console.log('✅ Benchmark environment ready')
    console.log(`   Source Workspace: ${this.testWorkspaceId}`)
    console.log(`   Destination Workspace: ${this.testWorkspaceId2}`)
    console.log(`   Routing Rule: ${this.testRuleId}\n`)
  }

  /**
   * Cleanup test environment
   */
  async cleanup(): Promise<void> {
    console.log('\n🧹 Cleaning up benchmark environment...')

    await this.supabase.from('leads').delete().eq('workspace_id', this.testWorkspaceId)
    await this.supabase.from('leads').delete().eq('workspace_id', this.testWorkspaceId2)
    await this.supabase.from('lead_routing_rules').delete().eq('id', this.testRuleId)
    await this.supabase.from('workspaces').delete().eq('id', this.testWorkspaceId)
    await this.supabase.from('workspaces').delete().eq('id', this.testWorkspaceId2)

    console.log('✅ Cleanup complete\n')
  }

  /**
   * Create a test lead
   */
  private async createTestLead(index: number): Promise<string> {
    const { data: lead } = await this.supabase
      .from('leads')
      .insert({
        workspace_id: this.testWorkspaceId,
        name: `Benchmark Lead ${index}`,
        company_industry: 'Technology',
        company_location: { country: 'US', state: 'CA' },
        contact_data: {
          email: `benchmark${index}@test.com`,
        },
        routing_status: 'pending',
        dedupe_hash: crypto
          .createHash('sha256')
          .update(`benchmark${index}@test.com|Technology|${Date.now()}`)
          .digest('hex'),
      })
      .select('id')
      .single()

    return lead!.id
  }

  /**
   * Route a single lead and measure performance
   */
  private async routeLeadWithMetrics(leadId: string): Promise<RoutingAttempt> {
    const startTime = Date.now()

    try {
      const result = await LeadRoutingService.routeLead({
        leadId,
        sourceWorkspaceId: this.testWorkspaceId,
        userId: 'benchmark-user',
        maxRetries: 3,
      })

      const latencyMs = Date.now() - startTime

      return {
        success: result.success,
        latencyMs,
        lockAcquired: result.success || result.error?.includes('lock') === false,
        isDuplicate: result.isDuplicate || false,
        error: result.error,
      }
    } catch (error: any) {
      return {
        success: false,
        latencyMs: Date.now() - startTime,
        lockAcquired: false,
        isDuplicate: false,
        error: error.message,
      }
    }
  }

  /**
   * Calculate percentile from sorted array
   */
  private percentile(arr: number[], p: number): number {
    if (arr.length === 0) return 0
    const sorted = [...arr].sort((a, b) => a - b)
    const index = Math.ceil((p / 100) * sorted.length) - 1
    return sorted[Math.max(0, index)]
  }

  /**
   * Analyze benchmark results
   */
  private analyzeResults(
    scenario: string,
    attempts: RoutingAttempt[],
    durationSec: number
  ): BenchmarkResult {
    const latencies = attempts.map(a => a.latencyMs)
    const successCount = attempts.filter(a => a.success).length
    const failureCount = attempts.filter(a => !a.success && !a.isDuplicate).length
    const duplicateCount = attempts.filter(a => a.isDuplicate).length
    const locksAcquired = attempts.filter(a => a.lockAcquired).length

    return {
      scenario,
      totalLeads: attempts.length,
      successCount,
      failureCount,
      duplicateCount,
      avgLatencyMs: latencies.reduce((a, b) => a + b, 0) / latencies.length,
      p50LatencyMs: this.percentile(latencies, 50),
      p95LatencyMs: this.percentile(latencies, 95),
      p99LatencyMs: this.percentile(latencies, 99),
      maxLatencyMs: Math.max(...latencies),
      throughputLeadsPerSec: attempts.length / durationSec,
      lockSuccessRate: (locksAcquired / attempts.length) * 100,
      retryQueueDepth: 0, // Will be fetched separately
    }
  }

  /**
   * Get current retry queue depth
   */
  private async getRetryQueueDepth(): Promise<number> {
    const { count } = await this.supabase
      .from('lead_routing_queue')
      .select('*', { count: 'exact', head: true })
      .eq('workspace_id', this.testWorkspaceId)
      .is('processed_at', null)

    return count || 0
  }

  /**
   * Print benchmark results
   */
  private printResults(result: BenchmarkResult): void {
    console.log(`\n📊 ${result.scenario}`)
    console.log('━'.repeat(60))
    console.log(`Total Leads:           ${result.totalLeads}`)
    console.log(`✅ Successful:          ${result.successCount} (${((result.successCount / result.totalLeads) * 100).toFixed(1)}%)`)
    console.log(`❌ Failed:              ${result.failureCount} (${((result.failureCount / result.totalLeads) * 100).toFixed(1)}%)`)
    console.log(`🔄 Duplicates:          ${result.duplicateCount} (${((result.duplicateCount / result.totalLeads) * 100).toFixed(1)}%)`)
    console.log(`\nLatency Metrics:`)
    console.log(`  Avg:                 ${result.avgLatencyMs.toFixed(0)}ms`)
    console.log(`  p50:                 ${result.p50LatencyMs.toFixed(0)}ms`)
    console.log(`  p95:                 ${result.p95LatencyMs.toFixed(0)}ms`)
    console.log(`  p99:                 ${result.p99LatencyMs.toFixed(0)}ms`)
    console.log(`  Max:                 ${result.maxLatencyMs.toFixed(0)}ms`)
    console.log(`\nPerformance:`)
    console.log(`  Throughput:          ${result.throughputLeadsPerSec.toFixed(1)} leads/sec`)
    console.log(`  Lock Success Rate:   ${result.lockSuccessRate.toFixed(1)}%`)
    console.log(`  Retry Queue Depth:   ${result.retryQueueDepth}`)

    // Performance assessment
    console.log(`\nAssessment:`)
    if (result.p95LatencyMs < 2000) {
      console.log(`  ✅ p95 latency meets SLO (< 2000ms)`)
    } else {
      console.log(`  ❌ p95 latency exceeds SLO (${result.p95LatencyMs.toFixed(0)}ms > 2000ms)`)
    }

    if (result.successCount / result.totalLeads >= 0.95) {
      console.log(`  ✅ Success rate meets SLO (≥ 95%)`)
    } else {
      console.log(`  ❌ Success rate below SLO (${((result.successCount / result.totalLeads) * 100).toFixed(1)}% < 95%)`)
    }

    if (result.lockSuccessRate >= 90) {
      console.log(`  ✅ Lock acquisition healthy (≥ 90%)`)
    } else {
      console.log(`  ⚠️  Lock contention detected (${result.lockSuccessRate.toFixed(1)}% < 90%)`)
    }
  }

  /**
   * Scenario 1: Sequential routing (baseline)
   */
  async benchmarkSequential(count: number = 100): Promise<BenchmarkResult> {
    console.log(`\n🔄 Running Scenario 1: Sequential Routing (${count} leads)...`)

    const attempts: RoutingAttempt[] = []
    const startTime = Date.now()

    for (let i = 0; i < count; i++) {
      const leadId = await this.createTestLead(i)
      const attempt = await this.routeLeadWithMetrics(leadId)
      attempts.push(attempt)

      if ((i + 1) % 10 === 0) {
        process.stdout.write(`\r  Progress: ${i + 1}/${count}`)
      }
    }

    const durationSec = (Date.now() - startTime) / 1000
    const result = this.analyzeResults('Scenario 1: Sequential Routing', attempts, durationSec)
    result.retryQueueDepth = await this.getRetryQueueDepth()

    this.printResults(result)
    return result
  }

  /**
   * Scenario 2: Concurrent routing (stress test)
   */
  async benchmarkConcurrent(count: number = 100, concurrency: number = 10): Promise<BenchmarkResult> {
    console.log(`\n🔄 Running Scenario 2: Concurrent Routing (${count} leads, ${concurrency} concurrent)...`)

    const leadIds: string[] = []

    // Create all leads first
    console.log(`  Creating ${count} test leads...`)
    for (let i = 0; i < count; i++) {
      const leadId = await this.createTestLead(i)
      leadIds.push(leadId)
    }

    // Route concurrently
    console.log(`  Routing with ${concurrency} concurrent workers...`)
    const attempts: RoutingAttempt[] = []
    const startTime = Date.now()

    const batches = []
    for (let i = 0; i < leadIds.length; i += concurrency) {
      const batch = leadIds.slice(i, i + concurrency)
      batches.push(batch)
    }

    for (const batch of batches) {
      const batchAttempts = await Promise.all(
        batch.map(leadId => this.routeLeadWithMetrics(leadId))
      )
      attempts.push(...batchAttempts)
      process.stdout.write(`\r  Progress: ${attempts.length}/${count}`)
    }

    const durationSec = (Date.now() - startTime) / 1000
    const result = this.analyzeResults('Scenario 2: Concurrent Routing', attempts, durationSec)
    result.retryQueueDepth = await this.getRetryQueueDepth()

    this.printResults(result)
    return result
  }

  /**
   * Scenario 3: Duplicate detection
   */
  async benchmarkDuplicates(count: number = 50): Promise<BenchmarkResult> {
    console.log(`\n🔄 Running Scenario 3: Duplicate Detection (${count} duplicates)...`)

    const attempts: RoutingAttempt[] = []
    const startTime = Date.now()

    // Create and route original lead
    const originalLeadId = await this.createTestLead(0)
    const originalAttempt = await this.routeLeadWithMetrics(originalLeadId)
    attempts.push(originalAttempt)

    // Get dedupe hash from original
    const { data: originalLead } = await this.supabase
      .from('leads')
      .select('dedupe_hash')
      .eq('id', originalLeadId)
      .single()

    // Create duplicates with same hash
    for (let i = 1; i < count; i++) {
      const { data: dupLead } = await this.supabase
        .from('leads')
        .insert({
          workspace_id: this.testWorkspaceId,
          name: `Duplicate Lead ${i}`,
          company_industry: 'Technology',
          company_location: { country: 'US', state: 'CA' },
          contact_data: {
            email: `duplicate${i}@test.com`,
          },
          routing_status: 'pending',
          dedupe_hash: originalLead!.dedupe_hash, // Same hash as original
        })
        .select('id')
        .single()

      const attempt = await this.routeLeadWithMetrics(dupLead!.id)
      attempts.push(attempt)

      if (i % 10 === 0) {
        process.stdout.write(`\r  Progress: ${i}/${count}`)
      }
    }

    const durationSec = (Date.now() - startTime) / 1000
    const result = this.analyzeResults('Scenario 3: Duplicate Detection', attempts, durationSec)
    result.retryQueueDepth = await this.getRetryQueueDepth()

    this.printResults(result)
    return result
  }

  /**
   * Scenario 4: Retry queue processing
   */
  async benchmarkRetryQueue(count: number = 50): Promise<BenchmarkResult> {
    console.log(`\n🔄 Running Scenario 4: Retry Queue Processing (${count} retries)...`)

    const attempts: RoutingAttempt[] = []
    const startTime = Date.now()

    // Create leads that will fail routing (no matching rule)
    console.log(`  Creating leads that will fail routing...`)
    for (let i = 0; i < count; i++) {
      const { data: lead } = await this.supabase
        .from('leads')
        .insert({
          workspace_id: this.testWorkspaceId,
          name: `Retry Lead ${i}`,
          company_industry: 'Manufacturing', // Won't match Technology rule
          company_location: { country: 'US', state: 'CA' },
          contact_data: {
            email: `retry${i}@test.com`,
          },
          routing_status: 'pending',
          dedupe_hash: crypto.randomUUID(),
        })
        .select('id')
        .single()

      // Force failure by using invalid rule
      const attempt = await this.routeLeadWithMetrics(lead!.id)
      attempts.push(attempt)
    }

    console.log(`\n  Processing retry queue...`)
    const retryResult = await LeadRoutingService.processRetryQueue(count)

    const durationSec = (Date.now() - startTime) / 1000
    const result = this.analyzeResults('Scenario 4: Retry Queue Processing', attempts, durationSec)
    result.retryQueueDepth = await this.getRetryQueueDepth()

    console.log(`\n  Retry Queue Results:`)
    console.log(`    Processed: ${retryResult.processed}`)
    console.log(`    Succeeded: ${retryResult.succeeded}`)
    console.log(`    Failed: ${retryResult.failed}`)

    this.printResults(result)
    return result
  }

  /**
   * Run all benchmarks
   */
  async runAll(): Promise<void> {
    console.log('🚀 Lead Routing Performance Benchmark Suite')
    console.log('='.repeat(60))

    await this.setup()

    const results: BenchmarkResult[] = []

    try {
      // Scenario 1: Sequential baseline
      results.push(await this.benchmarkSequential(100))

      // Scenario 2: Concurrent stress test
      results.push(await this.benchmarkConcurrent(100, 10))

      // Scenario 3: Duplicate detection
      results.push(await this.benchmarkDuplicates(50))

      // Scenario 4: Retry queue
      results.push(await this.benchmarkRetryQueue(50))

      // Summary
      console.log('\n\n📈 BENCHMARK SUMMARY')
      console.log('='.repeat(60))

      results.forEach(result => {
        const sloMet = result.p95LatencyMs < 2000 && result.successCount / result.totalLeads >= 0.95
        const status = sloMet ? '✅' : '❌'
        console.log(`${status} ${result.scenario}`)
        console.log(`   p95: ${result.p95LatencyMs.toFixed(0)}ms | Success: ${((result.successCount / result.totalLeads) * 100).toFixed(1)}% | Throughput: ${result.throughputLeadsPerSec.toFixed(1)} leads/s`)
      })

      console.log('\n✅ All benchmarks complete!')
    } catch (error) {
      console.error('\n❌ Benchmark failed:', error)
      throw error
    } finally {
      await this.cleanup()
    }
  }
}

/**
 * Main execution
 */
async function main() {
  const benchmark = new LeadRoutingBenchmark()
  await benchmark.runAll()
}

// Run if executed directly
if (require.main === module) {
  main().catch(console.error)
}

export { LeadRoutingBenchmark }
