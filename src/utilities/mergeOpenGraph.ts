import type { Metadata } from 'next'
import { getServerSideURL } from './getURL'

const defaultOpenGraph: Metadata['openGraph'] = {
  type: 'website',
  description: 'Custom apparel and accessories, made right and delivered on time.',
  images: [
    {
      url: `${getServerSideURL()}/website-template-OG.webp`, // TODO replace with a Printribe share image
    },
  ],
  siteName: 'Printribe',
  title: 'Printribe',
}

export const mergeOpenGraph = (og?: Metadata['openGraph']): Metadata['openGraph'] => {
  return {
    ...defaultOpenGraph,
    ...og,
    images: og?.images ? og.images : defaultOpenGraph.images,
  }
}
