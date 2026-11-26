import configPromise from '@payload-config'
import type { MetadataRoute } from 'next'
import { getPayload } from 'payload'

import { getServerSideURL } from '@/utilities/getURL'

// Built from the database on request, so new products and posts appear without a rebuild
export const dynamic = 'force-dynamic'

/** The map search engines use to find your pages: the main pages, every published product, studio page, post and CMS page. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getServerSideURL()
  const now = new Date()
  const payload = await getPayload({ config: configPromise })

  const staticPages: MetadataRoute.Sitemap = ['', '/shop', '/design', '/quote', '/contact', '/posts', '/terms', '/privacy'].map((path) => ({
    url: `${base}${path}`,
    lastModified: now,
    changeFrequency: path === '' || path === '/shop' ? 'weekly' : 'monthly',
    priority: path === '' ? 1 : path === '/shop' || path === '/design' ? 0.9 : 0.6,
  }))

  const [products, posts, pages] = await Promise.all([
    payload.find({ collection: 'products', where: { published: { equals: true } }, limit: 1000, depth: 0, pagination: false, overrideAccess: true }),
    payload.find({ collection: 'posts', where: { _status: { equals: 'published' } }, limit: 1000, depth: 0, pagination: false, select: { slug: true, updatedAt: true } }),
    payload.find({ collection: 'pages', where: { _status: { equals: 'published' } }, limit: 1000, depth: 0, pagination: false, select: { slug: true, updatedAt: true } }),
  ])

  const productUrls: MetadataRoute.Sitemap = products.docs.flatMap((p) => {
    if (!p.slug) return []
    const entries: MetadataRoute.Sitemap = [{ url: `${base}/products/${p.slug}`, lastModified: p.updatedAt, changeFrequency: 'weekly', priority: 0.8 }]
    const studioOn = p.studio?.enabled && (p.studio.views || []).some((v) => (v.areas || []).length > 0)
    if (studioOn) entries.push({ url: `${base}/design/${p.slug}`, lastModified: p.updatedAt, changeFrequency: 'monthly', priority: 0.5 })
    return entries
  })

  const postUrls: MetadataRoute.Sitemap = posts.docs.filter((p) => p.slug).map((p) => ({ url: `${base}/posts/${p.slug}`, lastModified: p.updatedAt, priority: 0.5 }))
  const pageUrls: MetadataRoute.Sitemap = pages.docs.filter((p) => p.slug && p.slug !== 'home').map((p) => ({ url: `${base}/${p.slug}`, lastModified: p.updatedAt, priority: 0.5 }))

  return [...staticPages, ...productUrls, ...postUrls, ...pageUrls]
}
