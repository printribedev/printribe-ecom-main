import type { MetadataRoute } from 'next'

import { getServerSideURL } from '@/utilities/getURL'

/** Tells search engines what to skip: the admin, the API, and every private page (accounts, checkout, orders, job sheets, saved designs). */
export default function robots(): MetadataRoute.Robots {
  const base = getServerSideURL()
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/api/', '/account', '/checkout', '/order/', '/print/', '/*?d=', '/search'],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  }
}
