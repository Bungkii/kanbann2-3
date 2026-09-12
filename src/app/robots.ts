import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/settings/roles', '/settings/system'],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: ['/api/'],
      },
    ],
    sitemap: [
      'https://primjaa.bungkii.app/sitemap.xml',
      'https://kanbann.bungkii.app/sitemap.xml',
    ],
  }
}
