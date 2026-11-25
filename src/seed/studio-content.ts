/**
 * Makes the stored site content say the Design Studio is OPEN (it used to say "Coming soon").
 * It changes only: the homepage "Design Studio" section (tag, text, button) and the "Soon" tag on the menu item.
 * Everything else on the page, including anything edited in the admin, is left exactly as it is.
 * Run with:  npm run fix:studio-content        (uses the database in .env: local by default)
 * To run it on the LIVE site, put the live POSTGRES_URL in the environment for that one command.
 */
import 'dotenv/config'
import { getPayload } from 'payload'

import config from '../payload.config'

const NEW_TEXT = 'Add your logo or text, place it on the front or back, and see it on the product with the price updating as you go.'

async function run() {
  const payload = await getPayload({ config })

  // 1. Homepage section
  const pages = await payload.find({ collection: 'pages', where: { slug: { equals: 'home' } }, limit: 1, depth: 0, overrideAccess: true })
  const home = pages.docs[0]
  if (!home) {
    console.log('No homepage found.')
  } else {
    let changed = 0
    const layout = (home.layout || []).map((b) => {
      if (b.blockType !== 'studioTeaser') return b
      changed++
      const oldBody = b.body || ''
      return {
        ...b,
        tag: !b.tag || /soon/i.test(b.tag) ? 'New' : b.tag,
        buttonLabel: !b.buttonLabel || /notify/i.test(b.buttonLabel) ? 'Start designing' : b.buttonLabel,
        body: /soon|first|join the list|notify/i.test(oldBody) || !oldBody ? NEW_TEXT : oldBody,
      }
    })
    if (changed) {
      await payload.update({ collection: 'pages', id: home.id, data: { layout }, overrideAccess: true, context: { disableRevalidate: true } })
      console.log(`Homepage: updated ${changed} Design Studio section(s).`)
    } else console.log('Homepage: no Design Studio section found.')
  }

  // 2. Menu item "Soon" tag
  const header = await payload.findGlobal({ slug: 'header', depth: 0 })
  let menuChanged = 0
  const navItems = (header.navItems || []).map((n) => {
    const label = String(n.link?.label || '')
    const url = String(n.link?.url || '')
    if (n.soon && (/design studio/i.test(label) || url.startsWith('/design'))) {
      menuChanged++
      return { ...n, soon: false }
    }
    return n
  })
  if (menuChanged) {
    await payload.updateGlobal({ slug: 'header', data: { navItems }, overrideAccess: true, context: { disableRevalidate: true } })
    console.log(`Menu: removed the "Soon" tag from ${menuChanged} item(s).`)
  } else console.log('Menu: no "Soon" tag on Design Studio.')

  process.exit(0)
}

run().catch((e) => {
  console.error(e)
  process.exit(1)
})
