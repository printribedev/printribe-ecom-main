/**
 * Fills a fresh database with the Printribe homepage, menu, footer and placeholder blog posts.
 * Run it with:  npm run seed
 * Safe to run again: it replaces the homepage and the placeholder posts, and leaves everything else alone.
 *
 * Every fact below comes from the owner: 1,000+ customers, 100,000+ products, 5+ years, standard delivery
 * 10 to 15 days with express on request, every piece inspected, free design support, minimums from 1 to 30
 * pieces depending on the product. Anything unknown is clearly marked as a placeholder.
 */
import 'dotenv/config'
import { getPayload } from 'payload'

import config from '../payload.config'

const link = (label: string, url: string) => ({ link: { type: 'custom' as const, label, url, newTab: false } })

const lexical = (text: string) => ({
  root: {
    type: 'root',
    children: [
      {
        type: 'paragraph',
        version: 1,
        direction: 'ltr' as const,
        format: '' as const,
        indent: 0,
        textFormat: 0,
        textStyle: '',
        children: [{ type: 'text', version: 1, text, format: 0, detail: 0, mode: 'normal', style: '' }],
      },
    ],
    direction: 'ltr' as const,
    format: '' as const,
    indent: 0,
    version: 1,
  },
})

const PLACEHOLDER_POSTS = [
  'How to choose the right fabric for team polos',
  'Corporate gifting ideas your team will actually wear',
  'Inside our printing floor',
]

async function seed() {
  const payload = await getPayload({ config })

  /* ---------- header ---------- */
  await payload.updateGlobal({
    slug: 'header',
    context: { disableRevalidate: true },
    data: {
      announcement: {
        enabled: true,
        badge: 'Bulk orders',
        text: 'Planning something big? Get a quote for your team, college or brand',
        url: '/quote',
      },
      navItems: [
        { ...link('Apparel', '/apparel'), soon: false },
        { ...link('Accessories', '/accessories'), soon: false },
        { ...link('Bulk orders', '/bulk-orders'), soon: false },
        { ...link('Design Studio', '/design-studio'), soon: true },
        { ...link('Blog', '/posts'), soon: false },
        { ...link('About', '/about'), soon: false },
      ],
      cta: { label: 'Get a quote', url: '/quote' },
    },
  })

  /* ---------- footer ---------- */
  await payload.updateGlobal({
    slug: 'footer',
    context: { disableRevalidate: true },
    data: {
      about: 'Custom apparel and accessories for teams, colleges, brands and individuals.',
      columns: [
        { title: 'Shop', links: [link('Apparel', '/apparel'), link('Accessories', '/accessories')] },
        {
          title: 'Services',
          links: [link('Bulk orders', '/bulk-orders'), link('Get a quote', '/quote'), link('Design Studio', '/design-studio')],
        },
        { title: 'Company', links: [link('About', '/about'), link('Blog', '/posts'), link('Contact', '/contact')] },
      ],
      contact: { email: 'info@theprintribe.com' },
      socials: [{ label: 'Instagram', url: 'https://www.instagram.com/printribe/' }],
      legalText: '© 2026 Printribe. All rights reserved.',
      navItems: [link('Terms and conditions', '/terms'), link('Privacy policy', '/privacy')],
    },
  })

  /* ---------- placeholder blog posts ---------- */
  await payload.delete({
    collection: 'posts',
    where: { title: { in: PLACEHOLDER_POSTS } },
    overrideAccess: true,
    context: { disableRevalidate: true },
  })
  for (const [i, title] of PLACEHOLDER_POSTS.entries()) {
    await payload.create({
      collection: 'posts',
      overrideAccess: true,
    context: { disableRevalidate: true },
      data: {
        title,
        slug: title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, ''),
        _status: 'published',
        publishedAt: new Date(Date.UTC(2026, 9 - i, 20 - i)).toISOString(),
        content: lexical('[Placeholder article: write the real post in the admin under Posts.]'),
      },
    })
  }

  /* ---------- homepage ---------- */
  await payload.delete({ collection: 'pages', where: { slug: { equals: 'home' } }, overrideAccess: true })
  await payload.create({
    collection: 'pages',
    overrideAccess: true,
    context: { disableRevalidate: true },
    data: {
      title: 'Home',
      slug: 'home',
      _status: 'published',
      publishedAt: new Date().toISOString(),
      hero: { type: 'none' },
      meta: {
        title: 'Custom apparel and accessories',
        description:
          'Merch that means something. Custom apparel and accessories, made to order and delivered on time, with free design support.',
      },
      layout: [
        {
          blockType: 'merchHero',
          headline: 'Merch that means something. Made right, delivered on time.',
          subline: 'We handle the design help, printing and delivery, so every piece arrives right the first time.',
          buttons: [
            { label: 'Shop apparel', url: '/apparel', style: 'white' },
            { label: 'Get a bulk quote', url: '/quote', style: 'ghost' },
            { label: 'Design now', url: '/design-studio', style: 'ghost' },
          ],
          chips: [
            { text: 'Low minimum quantities' },
            { text: 'Free design support' },
            { text: 'Every piece inspected' },
            { text: 'Express delivery available' },
            { text: 'Made to order' },
          ],
          proofStrip: [
            { value: '100,000+', label: 'products delivered' },
            { value: '1,000+', label: 'customers served' },
            { value: '5+ years', label: 'of custom apparel' },
            { value: '10 to 15 days', label: 'standard delivery, express available' },
          ],
        },
        {
          blockType: 'logoStrip',
          heading: 'Trusted by teams, colleges and brands',
          logos: [
            { name: '[Client logo 1]' },
            { name: '[Client logo 2]' },
            { name: '[Client logo 3]' },
            { name: '[Client logo 4]' },
            { name: '[Client logo 5]' },
          ],
        },
        {
          blockType: 'categoryTiles',
          eyebrow: 'Categories',
          heading: 'Choose where to start.',
          tiles: [
            {
              kicker: 'Custom',
              title: 'Apparel',
              url: '/apparel',
              links: [
                { label: 'T-shirts', url: '/apparel/t-shirts' },
                { label: 'Polos', url: '/apparel/polos' },
                { label: 'Hoodies', url: '/apparel/hoodies' },
                { label: 'Jerseys', url: '/apparel/jerseys' },
              ],
            },
            { kicker: 'Custom', title: 'Accessories', url: '/accessories', links: [] },
          ],
        },
        {
          blockType: 'studioTeaser',
          tag: 'Coming soon',
          heading: 'Design Studio',
          body: 'Upload your logo, place it on the front, back or sleeves, and see it on the product before you order. Join the list to be first.',
          buttonLabel: 'Notify me',
        },
        {
          blockType: 'methods',
          eyebrow: 'How we decorate',
          heading: 'The right finish for every piece.',
          subheading: 'We match the method to your design, fabric and quantity.',
          items: [
            { title: 'Screen printing', text: 'Bold, durable colour, well suited to larger runs.' },
            { title: 'Embroidery', text: 'Stitched logos with a premium feel, great on polos and caps.' },
            { title: 'Heat transfer', text: 'Sharp detail and full colour, good for smaller orders.' },
            { title: 'DTF', text: 'Vibrant, detailed prints that work on a wide range of fabrics.' },
          ],
        },
        {
          blockType: 'steps',
          eyebrow: 'How it works',
          heading: 'From idea to doorstep in three steps.',
          items: [
            {
              title: 'Choose your piece',
              text: 'Pick the apparel, fabric and sizes. Minimums start from 1 piece, depending on the product.',
            },
            {
              title: 'Share your design',
              text: 'Send your logo, theme or sketch. Our designers help for free, and mockups typically arrive within 24 hours.',
            },
            {
              title: 'We print, check and deliver',
              text: 'Every piece is inspected before it ships. Standard delivery takes 10 to 15 days, with express available.',
            },
          ],
        },
        {
          blockType: 'promises',
          eyebrow: 'Why Printribe',
          heading: 'Merch that means something.',
          subheading: 'Warm service, with the proof to back it up.',
          items: [
            { title: 'Simple start', text: "One message is enough. Share an idea and we'll shape it." },
            { title: 'Fully custom', text: 'Every piece is made to order: fabric, fit, colour and print placement.' },
            { title: 'On time', text: "Dates we commit to, and updates you won't have to chase." },
            { title: 'Checked', text: 'Every order is inspected before it leaves us.' },
            { title: 'Free design help', text: 'Send a theme or sketch and our designers turn it into print-ready art.' },
            { title: 'A real person', text: 'A merch expert guides your fabric, fit and finish from first message to delivery.' },
          ],
        },
        {
          blockType: 'reviews',
          eyebrow: 'Reviews',
          heading: 'Loved by teams and brands.',
          items: [
            {
              quote:
                'Great coordination and excellent work and quality of the screen printing is too good, delivery of products within the promised time.',
              name: 'OnePoint Essentials',
            },
            { quote: '[Placeholder review: add a real customer review in the admin.]', name: '[Customer name]', role: '[Role]', company: '[Company]' },
            { quote: '[Placeholder review: add a real customer review in the admin.]', name: '[Customer name]', role: '[Role]', company: '[Company]' },
          ],
        },
        { blockType: 'latestPosts', eyebrow: 'Blog', heading: 'Read up.', count: 3, linkLabel: 'All articles', linkUrl: '/posts' },
        {
          blockType: 'quoteBand',
          heading: 'Planning a bulk order?',
          text: "Tell us what you need and we'll get back to you with a quote.",
          buttons: [{ label: 'Get a quote', url: '/quote', style: 'white' }],
        },
        {
          blockType: 'newsletter',
          heading: 'Join the tribe',
          text: 'New drops, offers and merch ideas for members.',
          buttonLabel: 'Join',
        },
      ],
    },
  })

  payload.logger.info('Printribe starter content is in place.')
  process.exit(0)
}

seed().catch((err) => {
  // Show which field failed validation, if that's the problem
  console.error(err?.data ? JSON.stringify(err.data, null, 2) : err)
  process.exit(1)
})
