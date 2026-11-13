/** Plain data the All products page needs, prepared on the server and handed to the browser. */
export type ShopCategory = {
  id: number
  title: string
  slug: string
  description: string
  image: string | null
  parentId: number | null
  order: number
}

export type ShopProduct = {
  id: number
  title: string
  slug: string
  price: number
  minQty: number
  deliveryDays: string
  /** Fastest delivery in days, worked out from the delivery text. Used by the Delivery filter. */
  maxDays: number
  image: string | null
  hoverImage: string | null
  colours: { name: string; hex: string }[]
  categoryId: number
  subCategoryId: number | null
}
