import { ROLE_IDS, type RoleId } from '@luna/contracts'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { lunaMessages } from '@/app/messages'
import { createLunaI18n, LANGUAGES, type Language } from '@/shared/infrastructure/i18n/lunaI18n'
import { sharedMessages } from '@/shared/infrastructure/i18n/sharedMessages'
import RoleCard from './RoleCard.vue'

const mountCard = (role: RoleId, variant: 'face' | 'mini', locale: Language = 'en') =>
  mount(RoleCard, { props: { role, variant }, global: { plugins: [createLunaI18n(lunaMessages, locale)] } })

const stickersIn = (language: Language): string[] => ROLE_IDS.map((role) => sharedMessages[language].roleStickers[role])

describe('RoleCard', () => {
  it('shows the Seer as Goo-Eyed Gail', () => {
    const card = mountCard('seer', 'face')
    expect(card.find('.rcard-sticker').text()).toBe('Goo-Eyed Gail')
    expect(card.find('.rcard-name').text()).toBe('Seer')
    expect(card.find('.rcard-art').classes()).toContain('r-seer')
  })

  it('shows the Spanish sticker name', () => {
    const card = mountCard('seer', 'face', 'es')
    expect(card.find('.rcard-sticker').text()).toBe('Clara Legañas')
    expect(card.find('.rcard-name').text()).toBe('Vidente')
  })

  it('shows the sticker and the role on a mini card', () => {
    const card = mountCard('werewolf', 'mini')
    expect(card.find('b').text()).toBe('Wolfgang Drool')
    expect(card.find('small').text()).toBe('Werewolf')
  })

  it.each(LANGUAGES)('gives every role its own sticker in %s', (language) => {
    const stickers = stickersIn(language)
    expect(stickers.every((sticker) => sticker.length > 0)).toBe(true)
    expect(new Set(stickers).size).toBe(ROLE_IDS.length)
  })

  it('keeps the sticker names party-safe', () => {
    const banned = /vomit|v[oó]mito|barf|puke|armpit|axila|vello|hairy|peludo|naked|desnud/i
    const stickers = LANGUAGES.flatMap(stickersIn)
    expect(stickers.filter((sticker) => banned.test(sticker))).toEqual([])
  })
})
