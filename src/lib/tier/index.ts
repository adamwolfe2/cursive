/**
 * Tier Module
 * Cursive Platform
 *
 * Tier-based access control for features and limits.
 */

// Server-side exports
export {
  getWorkspaceTier,
  workspaceHasFeature,
  isWorkspaceWithinLimit,
  requireFeature,
  requireWithinLimit,
  FeatureNotAvailableError,
  LimitExceededError,
  type WorkspaceTierInfo,
} from './server'
