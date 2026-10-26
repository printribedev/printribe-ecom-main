import configPromise from '@payload-config'
import Link from 'next/link'
import { getPayload } from 'payload'
import React from 'react'

import type {
  CategoryTilesBlock,
  LatestPostsBlock,
  LogoStripBlock,
  MerchHeroBlock,
  MethodsBlock,
  NewsletterBlock,
  PromisesBlock,
  QuoteBandBlock,
  ReviewsBlock,
  StepsBlock,
  StudioTeaserBlock,
  Media as MediaType,
} from '@/payload-types'

import { Media } from '@/components/Media'
import { PillButton } from '@/components/PillButton'
import { SubscribeForm } from './SubscribeForm'

/* ---------- small shared pieces ---------- */

const Heading: React.FC<{ eyebrow?: string | null; heading: string; sub?: string | null; light?: boolean }> = ({
  eyebrow,
  heading,
  sub,
  light,
}) => (
  <div>
    {eyebrow && <p className={`mb-2.5 text-sm font-medium ${light ? 'text-sky-bright' : 'text-sky'}`}>{eyebrow}</p>}
    <h2 className={`font-heading text-[clamp(30px,4.4vw,48px)] ${light ? 'text-white' : 'text-ink'}`}>{heading}</h2>
    {sub && <p className="mt-3 max-w-xl text-lg text-body">{sub}</p>}
  </div>
)

const asMedia = (m: unknown): MediaType | null => (m && typeof m === 'object' ? (m as MediaType) : null)
const isVideo = (m: MediaType | null) => Boolean(m?.mimeType?.includes('video'))

/* ---------- 1. Hero ---------- */

export const MerchHeroSection: React.FC<MerchHeroBlock> = ({
  headline,
  subline,
  buttons,
  chips,
  background,
  proofStrip,
}) => {
  const bg = asMedia(background)
  return (
    <section className="relative flex min-h-[640px] items-end overflow-hidden bg-[#111] text-white">
      {bg ? (
        isVideo(bg) ? (
          // eslint-disable-next-line jsx-a11y/media-has-caption
          <video
            src={bg.url || undefined}
            autoPlay
            muted
            loop
            playsInline
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <Media resource={bg} fill priority imgClassName="object-cover" className="absolute inset-0" />
        )
      ) : (
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(900px 440px at 85% 15%, rgba(14,165,233,.5), transparent 60%), radial-gradient(700px 500px at 5% 95%, rgba(3,105,161,.5), transparent 60%), #111',
          }}
        />
      )}
      <div aria-hidden className="absolute inset-0 bg-gradient-to-b from-black/10 to-black/70" />
      {!bg && (
        <p className="absolute right-6 top-6 max-w-[18rem] text-right text-[11px] tracking-[0.14em] text-white/40">
          PLACEHOLDER: ADD A VIDEO OR PHOTO OF YOUR PRINTING FLOOR IN THE ADMIN
        </p>
      )}

      <div className="container relative z-10 pb-10 pt-24">
        <h1 className="font-heading max-w-[820px] text-[clamp(40px,7vw,80px)]">{headline}</h1>
        {subline && <p className="mb-8 mt-5 max-w-[560px] text-[19px] text-white/90">{subline}</p>}

        {buttons && buttons.length > 0 && (
          <div className="flex flex-wrap gap-2.5">
            {buttons.map((b, i) => (
              <PillButton key={i} {...b} />
            ))}
          </div>
        )}

        {chips && chips.length > 0 && (
          <ul className="mt-7 flex flex-wrap gap-2">
            {chips.map((c, i) => (
              <li key={i} className="rounded-full bg-white/15 px-4 py-1.5 text-sm backdrop-blur-sm">
                {c.text}
              </li>
            ))}
          </ul>
        )}

        {proofStrip && proofStrip.length > 0 && (
          <dl className="mt-12 grid grid-cols-2 gap-x-8 gap-y-5 border-t border-white/20 pt-7 sm:grid-cols-4">
            {proofStrip.map((p, i) => (
              <div key={i}>
                <dt className="font-heading text-3xl">{p.value}</dt>
                <dd className="text-sm text-white/70">{p.label}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>
    </section>
  )
}

/* ---------- 2. Client logos ---------- */

export const LogoStripSection: React.FC<LogoStripBlock> = ({ heading, logos }) => (
  <section className="border-b border-border bg-card py-10">
    <div className="container">
      {heading && <p className="mb-6 text-center text-sm font-medium text-muted-foreground">{heading}</p>}
      <ul className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6">
        {(logos || []).map((l, i) => {
          const img = asMedia(l.logo)
          return (
            <li key={i} className="flex h-10 items-center text-sm font-semibold tracking-wide text-muted-foreground">
              {img ? (
                <Media resource={img} imgClassName="h-10 w-auto max-w-[140px] object-contain grayscale opacity-70" />
              ) : (
                l.name
              )}
            </li>
          )
        })}
      </ul>
    </div>
  </section>
)

/* ---------- 3. Category tiles ---------- */

const tileGradients = [
  'linear-gradient(170deg, #4b4f58, #1d1d1f)',
  'linear-gradient(170deg, #38bdf8, #0369a1)',
  'linear-gradient(170deg, #6b7280, #2a2d33)',
  'linear-gradient(170deg, #7dd3fc, #0284c7)',
]

export const CategoryTilesSection: React.FC<CategoryTilesBlock> = ({
  eyebrow,
  heading,
  linkLabel,
  linkUrl,
  tiles,
}) => (
  <section className="py-[88px]">
    <div className="container">
      <div className="mb-9 flex flex-wrap items-end justify-between gap-5">
        <Heading eyebrow={eyebrow} heading={heading} />
        {linkUrl && <PillButton label={linkLabel} url={linkUrl} style="outline" />}
      </div>
      <div className={`grid gap-4 ${(tiles?.length ?? 0) > 2 ? 'sm:grid-cols-2 lg:grid-cols-4' : 'md:grid-cols-2'}`}>
        {(tiles || []).map((t, i) => {
          const img = asMedia(t.image)
          return (
            <div
              key={i}
              className={`group relative flex flex-col justify-end overflow-hidden rounded-xl p-6 text-white ${
                (tiles?.length ?? 0) > 2 ? 'aspect-[4/5]' : 'aspect-[4/3]'
              }`}
              style={img ? undefined : { background: tileGradients[i % tileGradients.length] }}
            >
              {img && (
                <Media
                  resource={img}
                  fill
                  imgClassName="object-cover transition-transform duration-500 group-hover:scale-105"
                  className="absolute inset-0"
                />
              )}
              <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="relative">
                {t.kicker && <p className="text-sm text-white/85">{t.kicker}</p>}
                <h3 className="font-heading text-[28px]">
                  <Link href={t.url} className="after:absolute after:inset-0">
                    {t.title}
                  </Link>
                </h3>
                {t.links && t.links.length > 0 && (
                  <ul className="relative z-10 mt-3 flex flex-wrap gap-2">
                    {t.links.map((l, j) => (
                      <li key={j}>
                        <Link
                          href={l.url}
                          className="rounded-full bg-white/20 px-3 py-1 text-sm backdrop-blur-sm hover:bg-white/35"
                        >
                          {l.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  </section>
)

/* ---------- 4. Design Studio teaser ---------- */

export const StudioTeaserSection: React.FC<StudioTeaserBlock> = ({ tag, heading, body, buttonLabel, image }) => {
  const img = asMedia(image)
  return (
    <section className="py-2">
      <div className="mx-5 grid items-center gap-10 rounded-3xl bg-black px-6 py-12 text-white md:px-14 md:py-[72px] lg:mx-auto lg:max-w-[1180px] lg:grid-cols-[1.1fr_1fr]">
        <div>
          {tag && (
            <span className="mb-5 inline-block rounded-full bg-sky-bright px-3.5 py-1 text-[13px] font-semibold text-[#00253a]">
              {tag}
            </span>
          )}
          <h2 className="font-heading text-[clamp(30px,4.4vw,48px)]">{heading}</h2>
          {body && <p className="mb-7 mt-4 text-lg text-white/75">{body}</p>}
          <SubscribeForm source="design-studio" buttonLabel={buttonLabel} tone="dark" />
        </div>
        <div className="relative grid aspect-square place-items-center overflow-hidden rounded-[20px] bg-[radial-gradient(circle_at_50%_40%,#2c2c2e,#151516)]">
          {img ? (
            <Media resource={img} fill imgClassName="object-cover" className="absolute inset-0" />
          ) : (
            <>
              <svg viewBox="0 0 200 200" className="w-3/5" aria-hidden>
                <path
                  d="M70 22 L18 52 L40 88 L60 75 L60 184 L140 184 L140 75 L160 88 L182 52 L130 22 Q100 44 70 22 Z"
                  fill="#2a2a2c"
                  stroke="rgba(255,255,255,.25)"
                  strokeWidth="2"
                />
                <rect x="82" y="80" width="36" height="30" rx="4" fill="#0EA5E9" />
              </svg>
              <span className="absolute bottom-4 text-xs tracking-[0.12em] text-white/50">PRODUCT PREVIEW</span>
            </>
          )}
        </div>
      </div>
    </section>
  )
}

/* ---------- 5-7. Methods, steps, promises (cards with a title and text) ---------- */

const CardGrid: React.FC<{
  items: { title: string; text?: string | null }[]
  cols: string
  numbered?: boolean
}> = ({ items, cols, numbered }) => (
  <div className={`mt-9 grid gap-4 ${cols}`}>
    {items.map((it, i) => (
      <div key={i} className="rounded-xl border border-border bg-card p-7">
        <b className="mb-4 grid h-10 w-10 place-items-center rounded-full bg-sky-tint font-semibold text-sky">
          {numbered ? i + 1 : '✓'}
        </b>
        <h3 className="font-heading mb-2 text-2xl">{it.title}</h3>
        {it.text && <p className="text-body">{it.text}</p>}
      </div>
    ))}
  </div>
)

export const MethodsSection: React.FC<MethodsBlock> = ({ eyebrow, heading, subheading, items }) => (
  <section className="py-[88px]">
    <div className="container">
      <Heading eyebrow={eyebrow} heading={heading} sub={subheading} />
      <CardGrid items={items || []} cols="sm:grid-cols-2 lg:grid-cols-4" />
    </div>
  </section>
)

export const StepsSection: React.FC<StepsBlock> = ({ eyebrow, heading, items }) => (
  <section className="py-[88px]">
    <div className="container">
      <Heading eyebrow={eyebrow} heading={heading} />
      <CardGrid items={items || []} cols="md:grid-cols-3" numbered />
    </div>
  </section>
)

export const PromisesSection: React.FC<PromisesBlock> = ({ eyebrow, heading, subheading, items }) => (
  <section className="py-[88px]">
    <div className="container">
      <Heading eyebrow={eyebrow} heading={heading} sub={subheading} />
      <CardGrid items={items || []} cols="md:grid-cols-2 lg:grid-cols-3" />
    </div>
  </section>
)

/* ---------- 8. Reviews ---------- */

export const ReviewsSection: React.FC<ReviewsBlock> = ({ eyebrow, heading, items }) => (
  <section className="py-[88px]">
    <div className="container">
      <Heading eyebrow={eyebrow} heading={heading} />
      <div className="mt-9 grid gap-4 md:grid-cols-3">
        {(items || []).map((r, i) => {
          const photo = asMedia(r.photo)
          return (
            <figure key={i} className="flex flex-col justify-between gap-6 rounded-xl border border-border bg-card p-7">
              <blockquote className="text-lg text-ink">“{r.quote}”</blockquote>
              <figcaption className="flex items-center gap-3 text-[15px] font-medium">
                {photo ? (
                  <Media resource={photo} imgClassName="h-10 w-10 rounded-full object-cover" />
                ) : (
                  <span aria-hidden className="h-10 w-10 flex-none rounded-full bg-[#d9dde3]" />
                )}
                <span>
                  {r.name}
                  {(r.role || r.company) && (
                    <span className="block text-[13px] font-normal text-muted-foreground">
                      {[r.role, r.company].filter(Boolean).join(', ')}
                    </span>
                  )}
                </span>
              </figcaption>
            </figure>
          )
        })}
      </div>
    </div>
  </section>
)

/* ---------- 9. Latest blog posts (reads the Posts collection) ---------- */

export const LatestPostsSection: React.FC<LatestPostsBlock> = async ({
  eyebrow,
  heading,
  count,
  linkLabel,
  linkUrl,
}) => {
  const payload = await getPayload({ config: configPromise })
  const posts = await payload.find({
    collection: 'posts',
    depth: 1,
    limit: count || 3,
    sort: '-publishedAt',
    where: { _status: { equals: 'published' } },
    overrideAccess: false,
    select: { title: true, slug: true, heroImage: true, publishedAt: true, categories: true, meta: true },
  })

  return (
    <section className="py-[88px]">
      <div className="container">
        <div className="mb-9 flex flex-wrap items-end justify-between gap-5">
          <Heading eyebrow={eyebrow} heading={heading} />
          {linkUrl && <PillButton label={linkLabel} url={linkUrl} style="outline" />}
        </div>
        {posts.docs.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border p-8 text-center text-muted-foreground">
            Articles will appear here once you publish your first blog post in the admin.
          </p>
        ) : (
          <div className="grid gap-5 md:grid-cols-3">
            {posts.docs.map((p) => {
              const img = asMedia(p.heroImage) || asMedia(p.meta?.image)
              const cat =
                Array.isArray(p.categories) && typeof p.categories[0] === 'object' ? p.categories[0].title : null
              const date = p.publishedAt
                ? new Date(p.publishedAt).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })
                : null
              return (
                <Link key={p.id} href={`/posts/${p.slug}`} className="group block">
                  <div className="relative mb-3.5 aspect-[16/10] overflow-hidden rounded-xl bg-gradient-to-br from-[#f1f2f4] to-[#dfe2e7]">
                    {img && (
                      <Media
                        resource={img}
                        fill
                        imgClassName="object-cover transition-transform duration-500 group-hover:scale-105"
                        className="absolute inset-0"
                      />
                    )}
                  </div>
                  <small className="text-muted-foreground">{[date, cat].filter(Boolean).join(' · ')}</small>
                  <h3 className="font-heading mt-1.5 text-[22px] group-hover:text-sky">{p.title}</h3>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}

/* ---------- 10. Bulk order band ---------- */

export const QuoteBandSection: React.FC<QuoteBandBlock> = ({ heading, text, buttons }) => (
  <section className="py-2">
    <div className="mx-5 flex flex-wrap items-center justify-between gap-6 rounded-3xl bg-sky px-6 py-14 text-white md:px-[52px] lg:mx-auto lg:max-w-[1180px]">
      <div>
        <h2 className="font-heading text-[clamp(30px,4.4vw,48px)]">{heading}</h2>
        {text && <p className="mt-2.5 text-lg text-white/90">{text}</p>}
      </div>
      <div className="flex flex-wrap gap-2.5">
        {(buttons || []).map((b, i) => (
          <PillButton key={i} {...b} />
        ))}
      </div>
    </div>
  </section>
)

/* ---------- 11. Newsletter ---------- */

export const NewsletterSection: React.FC<NewsletterBlock> = ({ heading, text, buttonLabel }) => (
  <section className="py-[88px]">
    <div className="container flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
      <div className="max-w-lg">
        <h2 className="font-heading text-[clamp(30px,4.4vw,44px)]">{heading}</h2>
        {text && <p className="mt-3 text-lg text-body">{text}</p>}
      </div>
      <SubscribeForm source="newsletter" buttonLabel={buttonLabel} tone="light" />
    </div>
  </section>
)
