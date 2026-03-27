/**
 * Configuration Utilities Index
 * Cursive Platform
 *
 * Export all configuration and production utilities.
 */

// Environment
export {
  getClientEnv,
  getServerEnv,
  isProduction,
  isDevelopment,
  isTest,
  getBaseUrl,
  isFeatureEnabled,
  checkEnvironment,
  logEnvironmentCheck,
  type ClientEnv,
  type ServerEnv,
} from './env'

// Health checks
export {
  checkSupabaseHealth,
  checkDatabaseHealth,
  checkExternalApiHealth,
  getSystemHealth,
  formatHealthResponse,
  livenessCheck,
  readinessCheck,
  getDiagnostics,
  type HealthStatus,
  type ServiceHealth,
  type SystemHealth,
} from './health'

// Centralized URLs
export {
  APP_URL,
  MARKETING_URL,
  CAL_BOOKING_URL,
  STRIPE_DASHBOARD_URL,
  SUPPORT_EMAIL,
} from './urls'

// Production utilities
export {
  CACHE_HEADERS,
  getCacheHeaders,
  SECURITY_HEADERS,
  getCSPDirectives,
  getAllSecurityHeaders,
  formatErrorReport,
  reportError,
  isFeatureEnabled as isFeatureFlagEnabled,
  getFeatureFlags,
  checkRateLimit,
  clearRateLimit,
  onShutdown,
  gracefulShutdown,
  getBuildInfo,
  type ErrorReport,
} from './production'
