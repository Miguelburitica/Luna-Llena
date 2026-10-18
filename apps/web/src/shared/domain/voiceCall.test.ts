import { describe, expect, it } from 'vitest'
import { freeCallFor, providerOf } from './voiceCall'

describe('providerOf', () => {
  it.each([
    ['https://discord.gg/abc123', 'discord'],
    ['https://discord.com/channels/1/2', 'discord'],
    ['https://meet.google.com/abc-defg-hij', 'meet'],
    ['https://zoom.us/j/123456789', 'zoom'],
    ['https://us02web.zoom.us/j/123456789', 'zoom'],
    ['https://chat.whatsapp.com/invite', 'whatsapp'],
    ['https://call.whatsapp.com/video/xyz', 'whatsapp'],
    ['https://meet.jit.si/LunaLlena-CE9JLT', 'jitsi']
  ])('recognises %s as %s', (url, provider) => {
    expect(providerOf(url)).toBe(provider)
  })

  it('ignores letter case in the host', () => {
    expect(providerOf('https://Discord.GG/abc123')).toBe('discord')
  })

  it.each([
    'https://calls.example.org/luna',
    'https://notzoom.us/j/1',
    'https://zoom.us.evil.example/j/1',
    'https://evil.example/discord.gg',
    'our usual discord',
    ''
  ])('treats %s as an unknown provider', (url) => {
    expect(providerOf(url)).toBe('other')
  })
})

describe('freeCallFor', () => {
  it('builds a Jitsi room named after the room code', () => {
    expect(freeCallFor('CE9JLT')).toBe('https://meet.jit.si/LunaLlena-CE9JLT')
  })

  it('is recognised as Jitsi', () => {
    expect(providerOf(freeCallFor('CE9JLT'))).toBe('jitsi')
  })
})
