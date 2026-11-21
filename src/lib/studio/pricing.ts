/** Design studio price maths, in whole rupees. The server recalculates this too; the browser is never trusted. */
export type AreaSize = 'small' | 'medium' | 'large'
export type MethodPrices = { small: number; medium: number; large: number }

/** Extra rupees per piece for printing one area with one method. */
export const areaExtra = (prices: MethodPrices | undefined, size: AreaSize): number => (prices ? prices[size] || 0 : 0)

/** Sum of the extras for every print area that has a design on it. */
export function studioExtras(
  used: { size: AreaSize; methodId: number | null }[],
  methods: Record<number, MethodPrices>,
): number {
  return used.reduce((sum, u) => sum + (u.methodId != null ? areaExtra(methods[u.methodId], u.size) : 0), 0)
}
