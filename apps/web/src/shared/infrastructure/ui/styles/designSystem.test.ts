import { readFileSync } from 'node:fs'
import { AVATAR_IDS, ROLE_IDS } from '@luna/contracts'
import { describe, expect, it } from 'vitest'
import { roleArtClassOf } from '../roleArt'

const PHASES = ['night', 'dawn', 'day', 'vote', 'ghost'] as const
const OUTLINE = '#1C0F26'
const stylesheet = readFileSync('src/shared/infrastructure/ui/styles/design-system.css', 'utf8')

const illustrations: Record<string, string> = import.meta.glob('../assets/illustrations/*.svg', {
  query: '?raw',
  import: 'default',
  eager: true
})

const tokensOf = (phase: string): Record<string, string> => {
  const block = new RegExp(`\\.ph-${phase}\\{([^}]*)\\}`).exec(stylesheet)?.[1] ?? ''
  return Object.fromEntries(block.split(';').map((declaration) => declaration.split(':').map((part) => part.trim())))
}

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
