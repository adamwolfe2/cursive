// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from '@sentry/nextjs'
import { initSentry } from './src/lib/monitoring/sentry'

initSentry()
// Handled errors are logged with safeError (console.error) and never thrown; capture them so failed scans,
// deliveries and webhooks raise Sentry issues instead of living only in Vercel logs.
Sentry.addIntegration(Sentry.captureConsoleIntegration({ levels: ['error'] }))
