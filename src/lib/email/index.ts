/**
 * Email Module Index
 * OpenInfo Platform
 */

// Service functions
export {
  sendEmail,
  sendWelcomeEmail,
  sendQueryCompletedEmail,
  sendCreditLowEmail,
  sendExportReadyEmail,
  sendWeeklyDigestEmail,
  sendPasswordResetEmail,
  sendNewLeadEmail,
  sendBatchEmails,
  EMAIL_CATEGORIES,
  type EmailCategory,
} from './service'

// Template components (for testing/preview)
export {
  EmailLayout,
  Heading,
  Text,
  Button,
  Divider,
  Callout,
  WelcomeEmail,
  QueryCompletedEmail,
  CreditLowEmail,
  ExportReadyEmail,
  WeeklyDigestEmail,
  PasswordResetEmail,
  NewLeadEmail,
} from './templates'

// Note: renderEmail is exported from './render' separately
// Import directly from '@/lib/email/render' when needed (server-only)
