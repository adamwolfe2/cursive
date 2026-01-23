#!/usr/bin/env tsx
/**
 * Test Routing Script
 *
 * Runs the routing simulation and displays results.
 * Usage: pnpm test:routing
 */

import { main } from '../src/lib/services/__tests__/routing-test-harness'

main().catch((error) => {
  console.error('❌ Routing simulation failed:', error)
  process.exit(1)
})
