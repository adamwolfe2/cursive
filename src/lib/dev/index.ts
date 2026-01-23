/**
 * Development Utilities Index
 * OpenInfo Platform
 *
 * Export all development and debugging utilities.
 */

// Logger
export {
  logger,
  createLogger,
  logTime,
  devLog,
  devWarn,
  devError,
  type LogLevel,
  type LogEntry,
  type LoggerConfig,
} from './logger'

// Debug utilities
export {
  inspect,
  tap,
  debugOnly,
  perfMarker,
  measureAsync,
  measureSync,
  createRenderCounter,
  logPropsChanges,
  debugFetch,
  createDebugFetch,
  createDebugProxy,
  logStateChange,
  debugError,
  debugAssert,
  breakpoint,
  logMemoryUsage,
  isDevelopment,
  isProduction,
  isTest,
  getEnvironment,
} from './debug'

// React hooks
export {
  useRenderCount,
  useWhyDidYouRender,
  useLifecycleLogger,
  useValueHistory,
  useValueLogger,
  usePreviousValue,
  useRenderPerformance,
  useTimedCallback,
  useStateWithLog,
  useReducerWithLog,
  useEffectWithLog,
  useAsyncDebug,
  useForceUpdate,
  useIsMounted,
} from './hooks'
