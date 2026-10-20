import { afterEach, describe, expect, it, vi } from 'vitest'
import { DocumentColorModePreference } from './DocumentColorModePreference'

const phoneQuery = (prefersLight: boolean) => {
  const listeners: Array<(event: { matches: boolean }) => void> = []
  const query = {
    matches: prefersLight,
    addEventListener: (_type: string, listener: (event: { matches: boolean }) => void) => listeners.push(listener)
  }
  vi.stubGlobal('matchMedia', (media: string) => (media === '(prefers-color-scheme: light)' ? query : { matches: false }))
  return (next: boolean) => listeners.forEach((listener) => listener({ matches: next }))
}

afterEach(() => {
  vi.unstubAllGlobals()
  delete document.documentElement.dataset.colorMode
  document.head.innerHTML = ''
})

describe('DocumentColorModePreference', () => {
  it('reads a phone set to light mode', () => {
    phoneQuery(true)
    expect(new DocumentColorModePreference().prefersLight()).toBe(true)
  })

  it('assumes dark without matchMedia', () => {
    vi.stubGlobal('matchMedia', undefined)
    const preference = new DocumentColorModePreference()
    expect(preference.prefersLight()).toBe(false)
    expect(() => preference.onChange(() => undefined)).not.toThrow()
  })

  it('reports the phone switching scheme', () => {
    const switchPhone = phoneQuery(true)
    const seen: boolean[] = []
    new DocumentColorModePreference().onChange((prefersLight) => seen.push(prefersLight))
    switchPhone(false)
    expect(seen).toEqual([false])
  })

  it('marks the document and tints the browser bar', () => {
    document.head.innerHTML = '<meta name="theme-color" content="#000000">'
    const preference = new DocumentColorModePreference()
    preference.apply('light')
    expect(document.documentElement.dataset.colorMode).toBe('light')
    expect(document.querySelector('meta[name="theme-color"]')?.getAttribute('content')).toBe('#F4EEFF')
    preference.apply('dark')
    expect(document.documentElement.dataset.colorMode).toBe('dark')
    expect(document.querySelector('meta[name="theme-color"]')?.getAttribute('content')).toBe('#1E0F33')
  })
})
