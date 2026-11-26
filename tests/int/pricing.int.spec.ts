import { describe, expect, it } from 'vitest'

import { deliveryFeeFor, unitPriceFor } from '@/lib/shop/pricing'
import { areaExtra, studioExtras } from '@/lib/studio/pricing'

describe('product price for a quantity', () => {
  const tiers = [
    { minQuantity: 10, price: 369 },
    { minQuantity: 25, price: 339 },
    { minQuantity: 50, price: 319 },
  ]

  it('uses the base price below the first price break', () => {
    expect(unitPriceFor(399, tiers, 1)).toBe(399)
    expect(unitPriceFor(399, tiers, 9)).toBe(399)
  })

  it('switches exactly at each price break', () => {
    expect(unitPriceFor(399, tiers, 10)).toBe(369)
    expect(unitPriceFor(399, tiers, 24)).toBe(369)
    expect(unitPriceFor(399, tiers, 25)).toBe(339)
    expect(unitPriceFor(399, tiers, 50)).toBe(319)
    expect(unitPriceFor(399, tiers, 5000)).toBe(319)
  })

  it('works when the price breaks are given out of order, or not at all', () => {
    expect(unitPriceFor(399, [...tiers].reverse(), 30)).toBe(339)
    expect(unitPriceFor(399, [], 100)).toBe(399)
    expect(unitPriceFor(399, null, 100)).toBe(399)
  })
})

describe('delivery fee', () => {
  const rule = { fee: 75, freeAbove: 1000 }
  it('charges the fee below the free-delivery amount and nothing at or above it', () => {
    expect(deliveryFeeFor(999, rule)).toBe(75)
    expect(deliveryFeeFor(1000, rule)).toBe(0)
    expect(deliveryFeeFor(8475, rule)).toBe(0)
  })
})

describe('Design Studio printing extras', () => {
  const methods = {
    1: { small: 20, medium: 35, large: 55 },
    2: { small: 45, medium: 80, large: 130 },
  }

  it('prices one area by its size class', () => {
    expect(areaExtra(methods[1], 'small')).toBe(20)
    expect(areaExtra(methods[1], 'large')).toBe(55)
    expect(areaExtra(undefined, 'small')).toBe(0)
  })

  it('adds up every area that has a design, each with its own method', () => {
    expect(
      studioExtras(
        [
          { size: 'small', methodId: 1 },
          { size: 'large', methodId: 1 },
        ],
        methods,
      ),
    ).toBe(75)
    expect(studioExtras([{ size: 'medium', methodId: 2 }], methods)).toBe(80)
  })

  it('adds nothing when no print method is chosen or the method is unknown', () => {
    expect(studioExtras([{ size: 'large', methodId: null }], methods)).toBe(0)
    expect(studioExtras([{ size: 'large', methodId: 99 }], methods)).toBe(0)
    expect(studioExtras([], methods)).toBe(0)
  })

  it('matches the worked example: 10 pieces at 369 plus 20 printing is 389 each, 3890 in total', () => {
    const perPiece = unitPriceFor(399, [{ minQuantity: 10, price: 369 }], 10) + studioExtras([{ size: 'small', methodId: 1 }], methods)
    expect(perPiece).toBe(389)
    expect(perPiece * 10).toBe(3890)
  })
})
