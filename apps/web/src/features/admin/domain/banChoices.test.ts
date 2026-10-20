import { describe, expect, it } from 'vitest'
import { sameKey, soonestEndingFirst } from './banChoices'

describe('ban helpers', () => {
  it('compares client keys by kind and value', () => {
    expect(sameKey({ kind: 'device', value: 'a' }, { kind: 'device', value: 'a' })).toBe(true)
    expect(sameKey({ kind: 'device', value: 'a' }, { kind: 'address', value: 'a' })).toBe(false)
  })

  it('orders bans by when they end', () => {
    const later = { key: { kind: 'device', value: 'b' }, until: 20, source: 'operator' } as const
    const sooner = { key: { kind: 'device', value: 'a' }, until: 10, source: 'strikes' } as const
    expect(soonestEndingFirst([later, sooner])).toEqual([sooner, later])
  })
})
