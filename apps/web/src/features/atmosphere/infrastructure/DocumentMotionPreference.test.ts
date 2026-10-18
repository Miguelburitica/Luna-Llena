import { afterEach, describe, expect, it, vi } from 'vitest'
import { DocumentMotionPreference } from './DocumentMotionPreference'

afterEach(() => {
  vi.unstubAllGlobals()
  document.documentElement.classList.remove('reduced')
})

describe('DocumentMotionPreference', () => {
  it('reads the operating system preference', () => {
    vi.stubGlobal('matchMedia', (query: string) => ({ matches: query.includes('reduce'), media: query }))
    expect(new DocumentMotionPreference().prefersReducedMotion()).toBe(true)
  })

  it('assumes full motion without matchMedia', () => {
    vi.stubGlobal('matchMedia', undefined)
    expect(new DocumentMotionPreference().prefersReducedMotion()).toBe(false)
  })

  it('toggles the reduced class on the document element', () => {
    const preference = new DocumentMotionPreference()
    preference.apply(true)
    expect(document.documentElement.classList.contains('reduced')).toBe(true)
    preference.apply(false)
    expect(document.documentElement.classList.contains('reduced')).toBe(false)
  })
})
