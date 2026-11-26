import canUseDOM from './canUseDOM'

/**
 * Cleans up a website address typed into a settings screen: removes spaces and quotes, adds https:// when it is missing
 * (a bare "www.printribe.in" would otherwise crash the build with "Invalid URL"), and drops any trailing slash.
 */
export const normalizeSiteUrl = (raw?: string | null): string => {
  let v = String(raw ?? '').trim().replace(/^["']+|["']+$/g, '').trim()
  if (!v) return ''
  if (!/^https?:\/\//i.test(v)) v = (/^(localhost|127\.0\.0\.1)(:|\/|$)/i.test(v) ? 'http://' : 'https://') + v
  v = v.replace(/\/+$/, '')
  try {
    return new URL(v).origin // keeps only protocol, domain and port
  } catch {
    return ''
  }
}

export const getServerSideURL = () => {
  return (
    normalizeSiteUrl(process.env.NEXT_PUBLIC_SERVER_URL) ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL ? normalizeSiteUrl(process.env.VERCEL_PROJECT_PRODUCTION_URL) : '') ||
    'http://localhost:3000'
  )
}

export const getClientSideURL = () => {
  if (canUseDOM) {
    const protocol = window.location.protocol
    const domain = window.location.hostname
    const port = window.location.port

    return `${protocol}//${domain}${port ? `:${port}` : ''}`
  }

  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return normalizeSiteUrl(process.env.VERCEL_PROJECT_PRODUCTION_URL)
  }

  return normalizeSiteUrl(process.env.NEXT_PUBLIC_SERVER_URL)
}
