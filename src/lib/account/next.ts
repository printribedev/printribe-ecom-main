/** Only allow sending people to pages on this site after they sign in (never to another website). */
export const safeNext = (n?: string | null): string => {
  if (!n || !n.startsWith('/')) return '/account'
  if (n.startsWith('//') || n.startsWith('/\\')) return '/account'
  return n
}
