import { err } from '@luna/contracts'
import { flushPromises } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { snapshotOf } from '../../domain/snapshot.fixtures'
import { mountRoomView } from '../mountRoomView.fixtures'
import NarratorLobby from './NarratorLobby.vue'
import VoiceCallPanel from './VoiceCallPanel.vue'

const mountPanel = (url: string | null = null) =>
  mountRoomView(VoiceCallPanel, { props: { url, code: 'CE9JLT' } })

const buttonLabelled = (wrapper: Awaited<ReturnType<typeof mountPanel>>['wrapper'], label: string) =>
  wrapper.findAll('button').find((button) => button.text() === label)

describe('VoiceCallPanel', () => {
  it('invites the narrator to add a call when there is none', async () => {
    const { wrapper } = await mountPanel()
    expect(wrapper.text()).toContain('Add a voice call')
    expect(wrapper.find('a').exists()).toBe(false)
    expect(buttonLabelled(wrapper, 'Remove')?.attributes('disabled')).toBeDefined()
    expect(buttonLabelled(wrapper, 'Save')?.attributes('disabled')).toBeDefined()
  })

  it('saves the typed link', async () => {
    const { wrapper, gateway } = await mountPanel()
    await wrapper.find('input').setValue('  https://discord.gg/abc123 ')
    await wrapper.find('form').trigger('submit')
    expect(gateway.calls.at(-1)).toEqual({ command: 'setVoiceCall', input: 'https://discord.gg/abc123' })
  })

  it('fills the link field with a free Jitsi call named after the room code', async () => {
    const { wrapper, gateway } = await mountPanel()
    await buttonLabelled(wrapper, 'Create a free call')?.trigger('click')
    expect((wrapper.find('input').element as HTMLInputElement).value).toBe('https://meet.jit.si/LunaLlena-CE9JLT')
    expect(gateway.commands()).not.toContain('setVoiceCall')
    await wrapper.find('form').trigger('submit')
    expect(gateway.calls.at(-1)).toEqual({ command: 'setVoiceCall', input: 'https://meet.jit.si/LunaLlena-CE9JLT' })
  })

  it('shows the current link as a join button and removes it', async () => {
    const { wrapper, gateway } = await mountPanel('https://discord.gg/abc123')
    expect((wrapper.find('input').element as HTMLInputElement).value).toBe('https://discord.gg/abc123')
    expect(wrapper.find('a').text()).toBe('Join on Discord')
    await buttonLabelled(wrapper, 'Remove')?.trigger('click')
    expect(gateway.calls.at(-1)).toEqual({ command: 'setVoiceCall', input: null })
    expect((wrapper.find('input').element as HTMLInputElement).value).toBe('')
  })

  it('explains a rejected link and keeps what was typed', async () => {
    const { wrapper, gateway } = await mountPanel('https://discord.gg/abc123')
    gateway.answer('setVoiceCall', err({ code: 'voice-call-invalid' }))
    await wrapper.find('input').setValue('our usual discord')
    await wrapper.find('form').trigger('submit')
    await flushPromises()
    expect(wrapper.find('[role="alert"]').text()).toContain('secure link')
    expect((wrapper.find('input').element as HTMLInputElement).value).toBe('our usual discord')
  })

  it('shows up in the narrator lobby and follows the room link', async () => {
    const snapshot = snapshotOf({ voiceCallUrl: 'https://meet.google.com/abc-defg-hij' })
    const { wrapper } = await mountRoomView(NarratorLobby, { props: { snapshot, memberId: 'id-Nico' } })
    expect(wrapper.find('.call-panel a').text()).toBe('Join on Google Meet')
  })
})
