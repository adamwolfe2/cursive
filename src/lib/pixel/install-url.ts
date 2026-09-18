const ALLOWED_SCRIPT_HOST = 'cdn.idpixel.app'

/** Only ever redirect visitors to AudienceLab's script CDN over https. */
export function isAllowedInstallUrl(url: string | null | undefined): url is string {
  if (!url) return false
  try {
    const u = new URL(url)
    return u.protocol === 'https:' && u.hostname === ALLOWED_SCRIPT_HOST
  } catch {
    return false
  }
}
