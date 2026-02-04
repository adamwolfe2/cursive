import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://meetcursive.com'

  const routes = [
    '',
    '/platform',
    '/services',
    '/pricing',
    '/about',
    '/resources',
    '/blog',
    '/case-studies',
    '/faq',
    '/contact',
    '/demos',
    '/visitor-identification',
    '/audience-builder',
    '/direct-mail',
    '/clean-room',
    '/data-access',
    '/integrations',
    '/intent-audiences',
    // Industries
    '/industries/financial-services',
    '/industries/ecommerce',
    '/industries/media-advertising',
    '/industries/b2b-software',
    '/industries/agencies',
    '/industries/franchises',
    '/industries/home-services',
    '/industries/retail',
    '/industries/education',
  ]

  return routes.map(route => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: route === '' ? 1.0 : 0.8,
  }))
}
