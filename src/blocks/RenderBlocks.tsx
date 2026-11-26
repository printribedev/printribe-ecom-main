import React, { Fragment } from 'react'

import type { Page } from '@/payload-types'

import { ArchiveBlock } from '@/blocks/ArchiveBlock/Component'
import { CallToActionBlock } from '@/blocks/CallToAction/Component'
import { ContentBlock } from '@/blocks/Content/Component'
import { FormBlock } from '@/blocks/Form/Component'
import { MediaBlock } from '@/blocks/MediaBlock/Component'
import {
  CategoryTilesSection,
  LatestPostsSection,
  LogoStripSection,
  MerchHeroSection,
  MethodsSection,
  NewsletterSection,
  PromisesSection,
  QuoteBandSection,
  ReviewsSection,
  StepsSection,
  StudioTeaserSection,
  TextPageSection,
} from '@/blocks/Printribe/Sections'

/** Generic blocks from the template. They get vertical spacing around them. */
const blockComponents = {
  archive: ArchiveBlock,
  content: ContentBlock,
  cta: CallToActionBlock,
  formBlock: FormBlock,
  mediaBlock: MediaBlock,
}

/** Printribe homepage sections. They are full-width and manage their own spacing. */
const printribeComponents = {
  merchHero: MerchHeroSection,
  logoStrip: LogoStripSection,
  categoryTiles: CategoryTilesSection,
  studioTeaser: StudioTeaserSection,
  methods: MethodsSection,
  steps: StepsSection,
  promises: PromisesSection,
  reviews: ReviewsSection,
  latestPosts: LatestPostsSection,
  quoteBand: QuoteBandSection,
  newsletter: NewsletterSection,
  textPage: TextPageSection,
}

export const RenderBlocks: React.FC<{
  blocks: Page['layout'][0][]
}> = (props) => {
  const { blocks } = props

  const hasBlocks = blocks && Array.isArray(blocks) && blocks.length > 0

  if (hasBlocks) {
    return (
      <Fragment>
        {blocks.map((block, index) => {
          const { blockType } = block

          if (blockType && blockType in printribeComponents) {
            const Section = printribeComponents[blockType as keyof typeof printribeComponents] as React.ElementType
            return <Section key={index} {...block} />
          }

          if (blockType && blockType in blockComponents) {
            const Block = blockComponents[blockType as keyof typeof blockComponents]

            if (Block) {
              return (
                <div className="my-16" key={index}>
                  {/* @ts-expect-error there may be some mismatch between the expected types here */}
                  <Block {...block} disableInnerContainer />
                </div>
              )
            }
          }
          return null
        })}
      </Fragment>
    )
  }

  return null
}
