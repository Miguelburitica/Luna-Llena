import { describe, expect, it } from 'vitest'
import { isColorMode, menuLookOf } from './colorMode'

describe('menuLookOf', () => {
  it('follows a phone set to light mode on a first visit', () => {
    expect(menuLookOf('system', true)).toBe('light')
  })

  it('follows a phone set to dark mode on a first visit', () => {
    expect(menuLookOf('system', false)).toBe('dark')
  })

  it('keeps dark when forced on a light phone', () => {
    expect(menuLookOf('dark', true)).toBe('dark')
  })

  it('keeps light when forced on a dark phone', () => {
    expect(menuLookOf('light', false)).toBe('light')
  })
})

describe('isColorMode', () => {
  it.each(['system', 'light', 'dark'])('accepts %s', (mode) => {
    expect(isColorMode(mode)).toBe(true)
  })

  it.each(['sepia', null, 3])('rejects %s', (mode) => {
    expect(isColorMode(mode)).toBe(false)
  })
})
