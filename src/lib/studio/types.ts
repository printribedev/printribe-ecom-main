import type { AreaSize } from './pricing'

export type StudioViewKey = 'front' | 'back' | 'left' | 'right'

export const VIEW_LABELS: Record<StudioViewKey, string> = { front: 'Front', back: 'Back', left: 'Left', right: 'Right' }

/** A place on the product where printing is allowed. Position and size are % of the photo. */
export type StudioArea = {
  key: string
  name: string
  size: AreaSize
  x: number
  y: number
  width: number
  height: number
  sizeNote: string
  /** Real size of the print area in inches (shown to customers). Empty if the owner has not set it. */
  widthIn: number | null
  heightIn: number | null
}

export type StudioMethod = {
  id: number
  title: string
  description: string
  small: number
  medium: number
  large: number
  /** Largest print this method can do, in inches. Null means no limit. */
  maxWidthIn: number | null
  maxHeightIn: number | null
}

/** Everything the studio needs, prepared on the server and handed to the browser. */
export type StudioProduct = {
  slug: string
  title: string
  price: number
  minQty: number
  tiers: { minQuantity: number; price: number }[]
  colours: { name: string; hex: string; mockups: Partial<Record<StudioViewKey, string>> }[]
  views: { view: StudioViewKey; areas: StudioArea[] }[]
  methods: StudioMethod[]
}
