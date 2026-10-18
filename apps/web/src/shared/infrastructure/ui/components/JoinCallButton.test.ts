import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { lunaMessages } from '@/app/messages'
import { createLunaI18n } from '@/shared/infrastructure/i18n/lunaI18n'
import JoinCallButton from './JoinCallButton.vue'

const mountButton = (url: string, compact = false, locale: 'en' | 'es' = 'en') =>
  mount(JoinCallButton, { props: { url, compact }, global: { plugins: [createLunaI18n(lunaMessages, locale)] } })

describe('JoinCallButton', () => {
  it.each([
    ['https://discord.gg/abc123', 'Join on Discord'],
    ['https://meet.google.com/abc-defg-hij', 'Join on Google Meet'],
    ['https://us02web.zoom.us/j/1', 'Join on Zoom'],
    ['https://chat.whatsapp.com/invite', 'Join on WhatsApp'],
    ['https://meet.jit.si/LunaLlena-CE9JLT', 'Join on Jitsi'],
    ['https://calls.example.org/luna', 'Join the call']
  ])('names the provider of %s', (url, label) => {
    expect(mountButton(url).text()).toBe(label)
  })

  it('opens the link in a new tab without giving that page access to the game', () => {
    const anchor = mountButton('https://discord.gg/abc123').find('a')
    expect(anchor.attributes('href')).toBe('https://discord.gg/abc123')
    expect(anchor.attributes('target')).toBe('_blank')
    expect(anchor.attributes('rel')).toBe('noopener noreferrer')
  })

  it('shrinks to an icon with the provider as its accessible name on crowded bars', () => {
    const anchor = mount(JoinCallButton, {
      props: { url: 'https://meet.jit.si/LunaLlena-CE9JLT', iconOnly: true },
      global: { plugins: [createLunaI18n(lunaMessages, 'en')] }
    }).find('a')
    expect(anchor.classes()).toContain('btn-icon')
    expect(anchor.text()).toBe('')
    expect(anchor.attributes('aria-label')).toBe('Join on Jitsi')
  })

  it('has a compact variant for top bars', () => {
    expect(mountButton('https://discord.gg/abc123', true).classes()).toContain('btn-sm')
    expect(mountButton('https://discord.gg/abc123').classes()).not.toContain('btn-sm')
  })

  it('speaks Spanish', () => {
    expect(mountButton('https://discord.gg/abc123', false, 'es').text()).toBe('Entrar en Discord')
  })
})
