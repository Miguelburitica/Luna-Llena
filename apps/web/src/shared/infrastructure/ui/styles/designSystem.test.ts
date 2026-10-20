import { readFileSync } from 'node:fs'
import { AVATAR_IDS, ROLE_IDS } from '@luna/contracts'
import { describe, expect, it } from 'vitest'
import { roleArtClassOf } from '../roleArt'

const PHASES = ['night', 'dawn', 'day', 'vote', 'ghost'] as const
const OUTLINE = '#1C0F26'
const stylesheet = readFileSync('src/shared/infrastructure/ui/styles/design-system.css', 'utf8')
const pageHead = readFileSync('index.html', 'utf8')
const LIGHT_MENU = ':root[data-color-mode="light"] .ph-menu'

const illustrations: Record<string, string> = import.meta.glob('../assets/illustrations/*.svg', {
  query: '?raw',
  import: 'default',
  eager: true
})

const declarationsOf = (block: string): Record<string, string> =>
  Object.fromEntries(block.split(';').map((declaration) => declaration.split(':').map((part) => part.trim())))

const tokensOf = (phase: string): Record<string, string> =>
  declarationsOf(new RegExp(`(?:^|\\n)\\.ph-${phase}\\{([^}]*)\\}`).exec(stylesheet)?.[1] ?? '')

const lightMenuTokens = (): Record<string, string> =>
  declarationsOf(stylesheet.split(`${LIGHT_MENU}{`)[1]?.split('}')[0] ?? '')

const rootTokens = (): Record<string, string> =>
  declarationsOf((/:root\{([^}]*)\}/.exec(stylesheet)?.[1] ?? '').replace(/\s+/g, ''))

const menuLooks = { dark: () => tokensOf('menu'), light: lightMenuTokens }

const luminanceOf = (hex: string): number => {
  const channels = [1, 3, 5].map((start) => parseInt(hex.slice(start, start + 2), 16) / 255)
  const [red, green, blue] = channels.map((channel) =>
    channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
  )
  return 0.2126 * (red ?? 0) + 0.7152 * (green ?? 0) + 0.0722 * (blue ?? 0)
}

const contrastOf = (first: string, second: string): number => {
  const [light, dark] = [luminanceOf(first), luminanceOf(second)].sort((a, b) => b - a)
  return ((light ?? 0) + 0.05) / ((dark ?? 0) + 0.05)
}

const illustrationOf = (artClass: string): string => {
  const file = new RegExp(`\\.${artClass}\\{background-image:url\\(([^)]+)\\)\\}`).exec(stylesheet)?.[1] ?? ''
  return illustrations[file] ?? ''
}

describe('design system', () => {
  it.each(PHASES)('keeps %s text readable on both ends of the background', (phase) => {
    const tokens = tokensOf(phase)
    expect(contrastOf(tokens['--ink'] ?? '', tokens['--bg-1'] ?? '')).toBeGreaterThanOrEqual(4.5)
    expect(contrastOf(tokens['--ink'] ?? '', tokens['--bg-2'] ?? '')).toBeGreaterThanOrEqual(4.5)
  })

  it.each(PHASES)('keeps the %s primary button label readable', (phase) => {
    const tokens = tokensOf(phase)
    expect(contrastOf(tokens['--accent-ink'] ?? '', tokens['--accent'] ?? '')).toBeGreaterThanOrEqual(4.5)
  })

  it.each(['light', 'dark'] as const)('keeps the %s menu readable', (look) => {
    const tokens = menuLooks[look]()
    expect(contrastOf(tokens['--ink'] ?? '', tokens['--bg-1'] ?? '')).toBeGreaterThanOrEqual(4.5)
    expect(contrastOf(tokens['--ink'] ?? '', tokens['--bg-2'] ?? '')).toBeGreaterThanOrEqual(4.5)
    expect(contrastOf(tokens['--accent-ink'] ?? '', tokens['--accent'] ?? '')).toBeGreaterThanOrEqual(4.5)
  })

  it.each(['light', 'dark'] as const)('keeps checklist ticks and crosses readable on a %s menu panel', (look) => {
    const tokens = { ...rootTokens(), ...menuLooks[look]() }
    const ink = (token: string) => {
      const value = tokens[token] ?? ''
      return value.startsWith('var(') ? (tokens[value.slice(4, -1)] ?? '') : value
    }
    expect(contrastOf(ink('--ok-ink'), ink('--panel'))).toBeGreaterThanOrEqual(4.5)
    expect(contrastOf(ink('--err-ink'), ink('--panel'))).toBeGreaterThanOrEqual(4.5)
  })

  it('puts the day village behind the home buttons on a light menu', () => {
    expect(stylesheet).toContain('.bg-menu{background-image:url(../assets/illustrations/bg-night.svg)}')
    expect(stylesheet).toContain(`${LIGHT_MENU} .bg-menu{background-image:url(../assets/illustrations/bg-day.svg)}`)
    expect(stylesheet).toContain(`${LIGHT_MENU} .firefly{display:none}`)
  })

  it('draws a badge on a primary button in the button label colour', () => {
    expect(stylesheet).toContain('.btn-primary .sbadge{background:color-mix(in srgb,var(--accent-ink) 12%,transparent);color:var(--accent-ink);')
  })

  it.each(['light', 'dark'] as const)('keeps secondary button labels readable on a %s menu', (look) => {
    const tokens = menuLooks[look]()
    expect(contrastOf(tokens['--btn-2-ink'] ?? '', tokens['--btn-2'] ?? '')).toBeGreaterThanOrEqual(4.5)
  })

  it('keeps disabled menu buttons readable', () => {
    expect(stylesheet).toContain('.ph-menu .btn[disabled],.ph-menu .btn.is-disabled{opacity:.7}')
  })

  it('keeps the dark menu the night look', () => {
    const night = tokensOf('night')
    const menu = tokensOf('menu')
    expect(Object.keys(night).every((token) => menu[token] === night[token])).toBe(true)
  })

  it('declares both schemes so the browser never darkens the page itself', () => {
    expect(pageHead).toContain('<meta name="color-scheme" content="dark light">')
    expect(stylesheet).toMatch(/:root\{\s*color-scheme:dark;/)
  })

  it('draws native controls light on a light menu and on the day', () => {
    expect(lightMenuTokens()['color-scheme']).toBe('light')
    expect(tokensOf('menu')['color-scheme']).toBe('dark')
    expect(tokensOf('day')['color-scheme']).toBe('light')
  })

  it('lightens only the menus, never a phase', () => {
    const lightSelectors = stylesheet.match(/:root\[data-color-mode="light"\][^{]*\{/g) ?? []
    expect(lightSelectors.length).toBeGreaterThan(0)
    expect(lightSelectors.every((selector) => selector.includes('.ph-menu'))).toBe(true)
  })

  it('stops every animation for reduced motion', () => {
    const stillness = '{*,*::before,*::after{animation:none!important;transition:none!important}}'
    expect(stylesheet).toContain(`@media (prefers-reduced-motion:reduce)${stillness}`)
    expect(stylesheet).toContain('.reduced *, .reduced *::before, .reduced *::after{animation:none!important;transition:none!important}')
  })

  it('draws every avatar as its own outlined sticker face', () => {
    const faces = AVATAR_IDS.map((avatar) => illustrationOf(`f-${avatar}`))
    expect(faces.every((face) => face.startsWith('<svg') && face.includes(`stroke="${OUTLINE}"`))).toBe(true)
    expect(new Set(faces).size).toBe(AVATAR_IDS.length)
  })

  it('draws every role as its own outlined sticker', () => {
    const arts = ROLE_IDS.map((role) => illustrationOf(roleArtClassOf(role)))
    expect(arts.every((art) => art.startsWith('<svg') && art.includes(`stroke="${OUTLINE}"`))).toBe(true)
    expect(new Set(arts).size).toBe(ROLE_IDS.length)
  })
})
