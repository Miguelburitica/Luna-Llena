import { describe, expect, it } from 'vitest'
import { sheetOffsetOf, sheetReleaseOf } from './sheetDrag'

describe('sheet drag', () => {
  it('closes when dragged past a third of the sheet', () => {
    expect(sheetReleaseOf({ offset: 201, height: 600, velocity: 0 })).toBe('close')
  })

  it('closes on a quick downward flick over a short distance', () => {
    expect(sheetReleaseOf({ offset: 40, height: 600, velocity: 0.8 })).toBe('close')
  })

  it('stays open after a short, slow drag', () => {
    expect(sheetReleaseOf({ offset: 40, height: 600, velocity: 0.1 })).toBe('stay')
  })

  it('stays open on a fast twitch shorter than a flick', () => {
    expect(sheetReleaseOf({ offset: 10, height: 600, velocity: 2 })).toBe('stay')
  })

  it('never lifts the sheet above its open position', () => {
    expect(sheetOffsetOf(300, 120)).toBe(0)
    expect(sheetReleaseOf({ offset: -300, height: 600, velocity: 3 })).toBe('stay')
  })

  it('follows the finger downwards', () => {
    expect(sheetOffsetOf(300, 420)).toBe(120)
  })
})
