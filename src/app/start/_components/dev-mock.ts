import type { Mock } from './api'

/** `?mock=<scenario>` replays fixtures from ./mock. Never honored in production builds. */
export function devMock(value: string | string[] | undefined): Mock {
  if (process.env.NODE_ENV === 'production') return null
  return typeof value === 'string' && value ? value : null
}
