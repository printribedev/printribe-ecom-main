import type { NextConfig } from 'next'

export const redirects: NextConfig['redirects'] = async () => {
  const internetExplorerRedirect = {
    destination: '/ie-incompatible.html',
    has: [
      {
        type: 'header' as const,
        key: 'user-agent',
        value: '(.*Trident.*)', // all ie browsers
      },
    ],
    permanent: false,
    source: '/:path((?!ie-incompatible.html$).*)', // all pages except the incompatibility page
  }

  // The menu, footer and buttons link to /design-studio; the real hub page lives at /design
  const designStudioRedirect = { source: '/design-studio', destination: '/design', permanent: false }

  // Bulk orders and Contact are one page
  const bulkRedirect = { source: '/bulk-orders', destination: '/contact?topic=bulk', permanent: false }

  return [internetExplorerRedirect, designStudioRedirect, bulkRedirect]
}
