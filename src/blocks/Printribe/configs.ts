import type { Block, Field } from 'payload'

/**
 * Printribe homepage sections. Each one is a "block" the team can add, reorder and edit in the admin
 * (Pages > Home > Content), with no code changes.
 */

const buttons = (max = 3): Field => ({
  name: 'buttons',
  type: 'array',
  maxRows: max,
  admin: { initCollapsed: true },
  fields: [
    { name: 'label', type: 'text', required: true },
    { name: 'url', type: 'text', required: true },
    {
      name: 'style',
      type: 'select',
      defaultValue: 'white',
      options: [
        { label: 'White (for dark backgrounds)', value: 'white' },
        { label: 'Outline (for dark backgrounds)', value: 'ghost' },
        { label: 'Sky blue', value: 'sky' },
        { label: 'Dark', value: 'dark' },
        { label: 'Outline (for light backgrounds)', value: 'outline' },
      ],
    },
  ],
})

const eyebrowAndHeading: Field[] = [
  { name: 'eyebrow', type: 'text', admin: { description: 'Small blue label above the heading' } },
  { name: 'heading', type: 'text', required: true },
]

export const MerchHero: Block = {
  slug: 'merchHero',
  interfaceName: 'MerchHeroBlock',
  labels: { singular: 'Hero (big banner)', plural: 'Hero banners' },
  fields: [
    { name: 'headline', type: 'text', required: true },
    { name: 'subline', type: 'textarea' },
    buttons(3),
    {
      name: 'chips',
      type: 'array',
      label: 'Small proof chips under the buttons',
      maxRows: 6,
      admin: { initCollapsed: true },
      fields: [{ name: 'text', type: 'text', required: true }],
    },
    {
      name: 'background',
      type: 'upload',
      relationTo: 'media',
      admin: { description: 'A video or photo of your printing floor. Leave empty to show the plain dark banner.' },
    },
    {
      name: 'proofStrip',
      type: 'array',
      label: 'Numbers strip (only use numbers you can prove)',
      maxRows: 4,
      admin: { initCollapsed: true },
      fields: [
        { name: 'value', type: 'text', required: true, admin: { description: 'e.g. 100,000+' } },
        { name: 'label', type: 'text', required: true, admin: { description: 'e.g. products delivered' } },
      ],
    },
  ],
}

export const LogoStrip: Block = {
  slug: 'logoStrip',
  interfaceName: 'LogoStripBlock',
  labels: { singular: 'Client logos', plural: 'Client logo strips' },
  fields: [
    { name: 'heading', type: 'text', defaultValue: 'Trusted by teams, colleges and brands' },
    {
      name: 'logos',
      type: 'array',
      admin: { initCollapsed: true },
      fields: [
        { name: 'name', type: 'text', required: true, admin: { description: 'Shown if there is no logo image' } },
        { name: 'logo', type: 'upload', relationTo: 'media' },
        { name: 'url', type: 'text' },
      ],
    },
  ],
}

export const CategoryTiles: Block = {
  slug: 'categoryTiles',
  interfaceName: 'CategoryTilesBlock',
  labels: { singular: 'Category tiles', plural: 'Category tiles' },
  fields: [
    ...eyebrowAndHeading,
    { name: 'linkLabel', type: 'text', defaultValue: 'View all' },
    { name: 'linkUrl', type: 'text' },
    {
      name: 'tiles',
      type: 'array',
      minRows: 1,
      maxRows: 6,
      admin: { initCollapsed: true },
      fields: [
        { name: 'kicker', type: 'text', defaultValue: 'Custom' },
        { name: 'title', type: 'text', required: true },
        { name: 'url', type: 'text', required: true },
        { name: 'image', type: 'upload', relationTo: 'media' },
        {
          name: 'links',
          type: 'array',
          label: 'Sub-category links',
          admin: { initCollapsed: true },
          fields: [
            { name: 'label', type: 'text', required: true },
            { name: 'url', type: 'text', required: true },
          ],
        },
      ],
    },
  ],
}

export const StudioTeaser: Block = {
  slug: 'studioTeaser',
  interfaceName: 'StudioTeaserBlock',
  labels: { singular: 'Design Studio teaser', plural: 'Design Studio teasers' },
  fields: [
    { name: 'tag', type: 'text', defaultValue: 'New' },
    { name: 'heading', type: 'text', required: true, defaultValue: 'Design Studio' },
    { name: 'body', type: 'textarea' },
    { name: 'buttonLabel', type: 'text', defaultValue: 'Start designing' },
    { name: 'image', type: 'upload', relationTo: 'media', admin: { description: 'Optional picture of the studio or a product' } },
  ],
}

const titledList = (name: string, label: string, max = 8): Field => ({
  name,
  type: 'array',
  label,
  maxRows: max,
  admin: { initCollapsed: true },
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'text', type: 'textarea' },
  ],
})

export const Methods: Block = {
  slug: 'methods',
  interfaceName: 'MethodsBlock',
  labels: { singular: 'How we decorate', plural: 'How we decorate' },
  fields: [...eyebrowAndHeading, { name: 'subheading', type: 'textarea' }, titledList('items', 'Methods', 6)],
}

export const Steps: Block = {
  slug: 'steps',
  interfaceName: 'StepsBlock',
  labels: { singular: 'How it works (steps)', plural: 'How it works (steps)' },
  fields: [...eyebrowAndHeading, titledList('items', 'Steps', 4)],
}

export const Promises: Block = {
  slug: 'promises',
  interfaceName: 'PromisesBlock',
  labels: { singular: 'Why Printribe (promises)', plural: 'Why Printribe (promises)' },
  fields: [...eyebrowAndHeading, { name: 'subheading', type: 'textarea' }, titledList('items', 'Promises', 9)],
}

export const Reviews: Block = {
  slug: 'reviews',
  interfaceName: 'ReviewsBlock',
  labels: { singular: 'Customer reviews', plural: 'Customer reviews' },
  fields: [
    ...eyebrowAndHeading,
    {
      name: 'items',
      type: 'array',
      admin: { initCollapsed: true },
      fields: [
        { name: 'quote', type: 'textarea', required: true },
        { name: 'name', type: 'text', required: true },
        { name: 'role', type: 'text' },
        { name: 'company', type: 'text' },
        { name: 'photo', type: 'upload', relationTo: 'media' },
      ],
    },
  ],
}

export const LatestPosts: Block = {
  slug: 'latestPosts',
  interfaceName: 'LatestPostsBlock',
  labels: { singular: 'Latest blog posts', plural: 'Latest blog posts' },
  fields: [
    ...eyebrowAndHeading,
    { name: 'count', type: 'number', defaultValue: 3, min: 1, max: 6, label: 'How many posts to show' },
    { name: 'linkLabel', type: 'text', defaultValue: 'All articles' },
    { name: 'linkUrl', type: 'text', defaultValue: '/posts' },
  ],
}

export const QuoteBand: Block = {
  slug: 'quoteBand',
  interfaceName: 'QuoteBandBlock',
  labels: { singular: 'Bulk order call to action', plural: 'Bulk order calls to action' },
  fields: [
    { name: 'heading', type: 'text', required: true },
    { name: 'text', type: 'textarea' },
    buttons(2),
  ],
}

export const Newsletter: Block = {
  slug: 'newsletter',
  interfaceName: 'NewsletterBlock',
  labels: { singular: 'Newsletter sign-up', plural: 'Newsletter sign-ups' },
  fields: [
    { name: 'heading', type: 'text', required: true, defaultValue: 'Join the tribe' },
    { name: 'text', type: 'textarea' },
    { name: 'buttonLabel', type: 'text', defaultValue: 'Join' },
  ],
}

/**
 * A plain text page: Terms, Privacy, About, Shipping & returns, FAQ and so on.
 * Add it to a page (set the page's Hero to "None") and write the sections in the admin.
 */
export const TextPage: Block = {
  slug: 'textPage',
  interfaceName: 'TextPageBlock',
  labels: { singular: 'Text page (legal, about, FAQ)', plural: 'Text pages' },
  fields: [
    { name: 'updated', type: 'text', admin: { description: 'Shown above the title, e.g. "27 November 2026". Leave empty to hide.' } },
    { name: 'title', type: 'text', required: true },
    { name: 'intro', type: 'textarea', admin: { description: 'The short paragraph under the title' } },
    {
      name: 'sections',
      type: 'array',
      admin: { initCollapsed: true, description: 'Each section has a heading and text. Drag to reorder.' },
      fields: [
        { name: 'heading', type: 'text', required: true },
        { name: 'body', type: 'richText', required: true },
      ],
    },
  ],
}

/** Every Printribe homepage section, in the order they appear in the "add block" menu. */
export const printribeBlocks: Block[] = [
  MerchHero,
  LogoStrip,
  CategoryTiles,
  StudioTeaser,
  Methods,
  Steps,
  Promises,
  Reviews,
  LatestPosts,
  QuoteBand,
  Newsletter,
  TextPage,
]
