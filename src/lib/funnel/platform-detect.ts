/**
 * Site-platform detection + per-platform pixel install guides.
 *
 * Why detect instead of asking: a low-ticket funnel cannot afford another
 * required question, and buyers routinely pick the wrong answer anyway. We
 * already fetch the buyer's homepage (see the test-pixel verifier), so the
 * HTML tells us the truth for free. The buyer can still override via a picker
 * when detection is inconclusive or wrong.
 *
 * Pure + dependency-free so it is trivially testable and safe to import from
 * both server routes and client components.
 */

export type PlatformSlug =
  | 'shopify'
  | 'wordpress'
  | 'webflow'
  | 'squarespace'
  | 'wix'
  | 'bigcommerce'
  | 'drupal'
  | 'hubspot'
  | 'framer'
  | 'gtm'
  | 'nextjs'
  | 'other'

export interface PlatformGuide {
  slug: PlatformSlug
  label: string
  /** simple-icons slug used for the brand mark; null renders a letter tile. */
  icon: string | null
  /** Brand hex (no leading #) for the logo + letter-tile fallback. */
  color: string
  /**
   * Lowercased substrings that identify this platform in homepage HTML.
   * Empty for 'other' (never auto-detected).
   */
  signatures: string[]
  /**
   * Lowercased "key: value" fragments matched against response headers.
   * Headers beat HTML: a page can merely *mention* a competitor or link to
   * another stack's asset, but it cannot fake the server that served it.
   */
  headerSignatures?: string[]
  /** Where the snippet goes, in the buyer's own words. */
  location: string
  /** Ordered click-path. Rendered as a numbered list. */
  steps: string[]
  /** Optional gotcha shown under the steps. */
  note?: string
}

/**
 * Ordered most-specific first. Detection returns the FIRST match, so
 * storefront/builder platforms must precede generic CMS and GTM — a Shopify
 * store that also runs GTM should get Shopify instructions, not GTM ones.
 */
export const PLATFORM_GUIDES: PlatformGuide[] = [
  {
    slug: 'shopify',
    headerSignatures: ['x-shopid', 'x-shopify-stage', 'x-shardid'],
    label: 'Shopify',
    icon: 'shopify',
    color: '7AB55C',
    signatures: ['cdn.shopify.com', 'shopify.theme', 'shopify-features', 'myshopify.com'],
    location: 'your theme’s theme.liquid file',
    steps: [
      'In your Shopify admin, go to Online Store → Themes',
      'On your current theme, click the … button → Edit code',
      'Under the Layout folder, open theme.liquid',
      'Paste the snippet directly above the closing </head> tag',
      'Click Save',
    ],
    note: 'theme.liquid loads on every page, so this covers your whole store in one paste. If you switch themes later, add it again to the new theme.',
  },
  {
    slug: 'wordpress',
    headerSignatures: ['x-powered-by: wordpress', 'x-wp-'],
    label: 'WordPress',
    icon: 'wordpress',
    color: '21759B',
    signatures: ['/wp-content/', '/wp-includes/', 'wp-json', 'wp-emoji-release'],
    location: 'your site header',
    steps: [
      'In your WordPress admin, install and activate the free plugin WPCode (or any “header and footer scripts” plugin)',
      'Go to Code Snippets → Header & Footer',
      'Paste the snippet into the Header box',
      'Click Save Changes',
    ],
    note: 'A plugin is safer than editing header.php directly, because a theme update will not wipe it out.',
  },
  {
    slug: 'webflow',
    label: 'Webflow',
    icon: 'webflow',
    color: '146EF5',
    signatures: ['data-wf-site', 'assets.website-files.com', 'assets-global.website-files.com', 'webflow.js'],
    location: 'your project’s custom code',
    steps: [
      'Open your Webflow project, then go to Site settings → Custom code',
      'Paste the snippet into the Head code box',
      'Click Save changes',
      'Click Publish to push it live',
    ],
    note: 'Custom code only runs on the published site, not inside the Designer preview.',
  },
  {
    slug: 'squarespace',
    headerSignatures: ['x-servedby: squarespace', 'server: squarespace'],
    label: 'Squarespace',
    icon: 'squarespace',
    color: '000000',
    signatures: ['static1.squarespace.com', 'squarespace-cdn.com', 'squarespace_context'],
    location: 'your site-wide code injection',
    steps: [
      'In your Squarespace dashboard, go to Settings → Developer tools → Code injection',
      'Paste the snippet into the Header box',
      'Click Save',
    ],
    note: 'Code injection requires a Business plan or higher on Squarespace.',
  },
  {
    slug: 'wix',
    headerSignatures: ['x-wix-request-id', 'x-wix-'],
    label: 'Wix',
    icon: 'wix',
    color: '0C6EFC',
    signatures: ['static.parastorage.com', 'wixstatic.com', 'wix-code', '_wixcidx'],
    location: 'your site’s custom code',
    steps: [
      'In your Wix dashboard, go to Settings → Custom code',
      'Click + Add Custom Code',
      'Paste the snippet, set Add Code to Pages to All pages',
      'Under Place Code in, choose Head',
      'Click Apply',
    ],
    note: 'Custom code needs a paid Wix plan with a connected domain.',
  },
  {
    slug: 'bigcommerce',
    headerSignatures: ['x-bc-', 'x-bigcommerce-'],
    label: 'BigCommerce',
    icon: 'bigcommerce',
    color: '121118',
    signatures: ['cdn11.bigcommerce.com', 'bigcommerce.com/s-', 'stencil-utils'],
    location: 'your storefront script manager',
    steps: [
      'In your BigCommerce admin, go to Storefront → Script Manager',
      'Click Create a Script',
      'Set Location to Head and Pages to All pages',
      'Choose Script type: Script, then paste the snippet',
      'Click Save',
    ],
  },
  {
    slug: 'drupal',
    headerSignatures: ['x-generator: drupal', 'x-drupal-cache', 'x-drupal-dynamic-cache'],
    label: 'Drupal',
    icon: 'drupal',
    color: '0678BE',
    signatures: ['drupal-settings-json', 'drupal.settings', '/core/misc/drupal.js', '/sites/all/modules/'],
    location: 'your theme’s html.html.twig, or an asset-injector module',
    steps: [
      'Install the Asset Injector module (recommended over editing the theme directly)',
      'Go to Configuration → Development → Asset Injector → JS Injector',
      'Click Add JS injector, paste the snippet, and leave the conditions empty so it runs everywhere',
      'Save, then clear the site cache',
    ],
    note: 'If you prefer editing the theme, the snippet goes in html.html.twig before the closing </head>.',
  },
  {
    slug: 'hubspot',
    headerSignatures: ['x-hs-', 'x-hubspot-'],
    label: 'HubSpot CMS',
    icon: 'hubspot',
    color: 'FF7A59',
    signatures: ['hs-scripts.com', 'hsforms.net', 'hubspot.com/cms', 'hs-analytics.net'],
    location: 'your site header HTML',
    steps: [
      'In HubSpot, go to Settings → Content → Pages',
      'Select the domain you want, then open the Templates tab',
      'Paste the snippet into Site header HTML',
      'Click Save',
    ],
  },
  {
    slug: 'framer',
    label: 'Framer',
    icon: 'framer',
    color: '0055FF',
    signatures: ['framerusercontent.com', 'framer.com/m/', '__framer'],
    location: 'your project’s custom code',
    steps: [
      'Open your Framer project, then go to Site settings → General → Custom code',
      'Paste the snippet into Start of <head> tag',
      'Click Save, then Publish',
    ],
  },
  {
    slug: 'gtm',
    label: 'Google Tag Manager',
    icon: 'googletagmanager',
    color: '246FDB',
    signatures: ['googletagmanager.com/gtm.js', 'googletagmanager.com/ns.html'],
    location: 'a new Custom HTML tag',
    steps: [
      'In Google Tag Manager, go to Tags → New',
      'Choose Tag Configuration → Custom HTML and paste the snippet',
      'Set Triggering to All Pages',
      'Save, then click Submit → Publish',
    ],
    note: 'Make sure you publish the container. An unpublished GTM change never reaches your live site.',
  },
  {
    slug: 'nextjs',
    headerSignatures: ['x-powered-by: next.js'],
    label: 'Next.js / custom app',
    icon: 'nextdotjs',
    color: '000000',
    signatures: ['/_next/static', '__next_data__', '__next_f'],
    location: 'your root layout',
    steps: [
      'Open your root layout (app/layout.tsx for the App Router, or pages/_document.tsx for the Pages Router)',
      'Paste the snippet as a plain <script> tag inside <head>, exactly as given',
      'Commit and deploy',
    ],
    note: 'Use a plain <script> tag rather than next/script with the default afterInteractive strategy. afterInteractive injects the tag client-side after hydration, so it never appears in your server-rendered HTML — the pixel still fires, but our install check (and most third-party scanners) cannot see it and will report it as missing.',
  },
  {
    slug: 'other',
    label: 'Something else',
    icon: null,
    color: '52525B',
    signatures: [],
    location: 'the global <head> of your site',
    steps: [
      'Open the template that renders the <head> on every page of your site',
      'Paste the snippet directly above the closing </head> tag',
      'Deploy or save so the change is live',
    ],
    note: 'Not sure where that is? Reply to your welcome email and we will install it with you.',
  },
]

const BY_SLUG: Record<string, PlatformGuide> = Object.fromEntries(
  PLATFORM_GUIDES.map((p) => [p.slug, p])
)

/** Look up a guide, always returning something renderable. */
export function getPlatformGuide(slug: string | null | undefined): PlatformGuide {
  if (!slug) return BY_SLUG.other
  return BY_SLUG[slug] ?? BY_SLUG.other
}

/**
 * Identify the platform from homepage HTML.
 * Returns null when nothing matches, so callers can distinguish
 * "we did not detect" from "buyer explicitly chose other".
 */
export function detectPlatformFromHeaders(
  headers: Record<string, string> | Headers | null | undefined
): PlatformSlug | null {
  if (!headers) return null
  const entries =
    headers instanceof Headers
      ? Array.from(headers.entries())
      : Object.entries(headers)
  if (entries.length === 0) return null
  const blob = entries
    .map(([k, v]) => `${k.toLowerCase()}: ${String(v).toLowerCase()}`)
    .join('\n')
  for (const guide of PLATFORM_GUIDES) {
    if (guide.headerSignatures?.some((sig) => blob.includes(sig))) {
      return guide.slug
    }
  }
  return null
}

/**
 * Best-effort platform detection from a fetched page.
 * Headers are consulted first because they cannot be faked by page content —
 * an agency site that merely lists "Shopify" as a service, or embeds a logo
 * served from someone else's Drupal, must not be misread as running it.
 */
export function detectPlatform(input: {
  html?: string | null
  headers?: Record<string, string> | Headers | null
}): PlatformSlug | null {
  return (
    detectPlatformFromHeaders(input.headers) ??
    detectPlatformFromHtml(input.html ?? '')
  )
}

export function detectPlatformFromHtml(html: string): PlatformSlug | null {
  if (!html) return null
  const haystack = html.toLowerCase()
  for (const guide of PLATFORM_GUIDES) {
    if (guide.signatures.some((sig) => haystack.includes(sig))) {
      return guide.slug
    }
  }
  return null
}

/**
 * Fetch a URL and identify its platform. Server-side helper.
 *
 * Deliberately non-fatal and tightly bounded: knowing the platform is a
 * nicety that improves install instructions, never a reason to fail or delay
 * pixel provisioning. Any error, timeout, or oversized page yields null and
 * the buyer simply gets the picker.
 */
export async function detectPlatformForUrl(
  url: string,
  timeoutMs = 6000
): Promise<PlatformSlug | null> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        'User-Agent': 'CursivePixelVerifier/1.0 (+https://meetcursive.com)',
        Accept: 'text/html,application/xhtml+xml',
      },
    })
    // Headers alone often settle it, and cost nothing.
    const fromHeaders = detectPlatformFromHeaders(res.headers)
    if (fromHeaders) return fromHeaders
    if (!res.ok) return null
    const html = (await res.text()).slice(0, 500_000)
    return detectPlatformFromHtml(html)
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}
