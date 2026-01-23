/**
 * API Utilities Index
 * OpenInfo Platform
 *
 * Export all API utilities for easy importing.
 */

// Response utilities
export {
  success,
  created,
  noContent,
  error,
  badRequest,
  unauthorized,
  forbidden,
  notFound,
  methodNotAllowed,
  conflict,
  validationError,
  rateLimited,
  serverError,
  paginated,
  createPaginationMeta,
  type ApiResponse,
  type ApiMeta,
  type PaginationMeta,
  type ErrorDetails,
  type ApiErrorResponse,
} from './response'

// Error utilities
export {
  ApiError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  ValidationError,
  RateLimitError,
  DatabaseError,
  ExternalServiceError,
  handleApiError,
  withErrorHandler,
  assertFound,
  assertAuthenticated,
  assertAuthorized,
  assertValid,
} from './errors'

// Validation utilities
export {
  uuidSchema,
  emailSchema,
  nonEmptyString,
  paginationSchema,
  sortSchema,
  dateRangeSchema,
  searchSchema,
  userSchema,
  createQuerySchema,
  leadFilterSchema,
  peopleSearchSchema,
  parseBody,
  parseSearchParams,
  parseParams,
  validateData,
  createPartialSchema,
  sanitizeString,
  sanitizeObject,
  withSanitization,
  type PaginationParams,
  type SortParams,
  type UserSchema,
  type CreateQuerySchema,
  type LeadFilterSchema,
  type PeopleSearchSchema,
} from './validation'

// Middleware utilities
export {
  withAuth,
  withPlan,
  withWorkspaceOwner,
  withRateLimit,
  withCreditCheck,
  withCors,
  withLogging,
  compose,
  type AuthenticatedUser,
  type AuthenticatedHandler,
} from './middleware'
