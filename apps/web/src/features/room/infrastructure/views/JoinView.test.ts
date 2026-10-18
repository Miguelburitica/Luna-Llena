import { err, ok } from '@luna/contracts'
import { flushPromises } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { summaryOf } from '../../application/RoomGateway.fixtures'
import { mountRoomView } from '../mountRoomView.fixtures'
import JoinView from './JoinView.vue'

describe('JoinView', () => {
  it('fills the code from the invite link and shows the room it found', async () => {
    const { wrapper } = await mountRoomView(JoinView, { path: '/join/LUNA42' })
    const letters = wrapper.findAll('.code input').map((input) => (input.element as HTMLInputElement).value)
    expect(letters.join('')).toBe('LUNA42')
    expect(wrapper.text()).toContain('Room found')
    expect(wrapper.text()).toContain('Los Primos · Viernes')
    expect(wrapper.text()).toContain('Narrated by Nico · Classic')
    expect(wrapper.text()).toContain('5 of 15 joined')
  })

  it('offers alternative names when the name is taken and joins with one', async () => {
    const { wrapper, gateway, router } = await mountRoomView(JoinView, { path: '/join/LUNA42' })
    gateway.answer('join', err({ code: 'name-taken', suggestions: ['Ana 2', 'Ana B.'] }))
    await wrapper.find('#join-name').setValue('Ana')
    await wrapper.find('form').trigger('submit')
    await flushPromises()
    expect(wrapper.text()).toContain('Someone in this village is already called Ana.')
    const chips = wrapper.findAll('.chip')
    expect(chips.map((chip) => chip.text())).toEqual(['Ana 2', 'Ana B.'])

    delete gateway.responses.join
    await chips[0]?.trigger('click')
    expect((wrapper.find('#join-name').element as HTMLInputElement).value).toBe('Ana 2')
    expect(wrapper.find('.chip').exists()).toBe(false)
    await wrapper.find('form').trigger('submit')
    await vi.waitFor(() => expect(router.currentRoute.value.fullPath).toBe('/room/LUNA42'))
  })

  it('offers the call on the room found card by provider', async () => {
    const { wrapper, gateway } = await mountRoomView(JoinView, { path: '/join' })
    gateway.answer('lookUp', ok(summaryOf({ voiceCallUrl: 'https://discord.gg/abc123' })))
    await wrapper.findAll('.code input')[0]?.setValue('LUNA42')
    await flushPromises()
    expect(wrapper.find('.join-room a').text()).toBe('Join on Discord')
  })

  it('names an unknown provider generically and hides the button without a link', async () => {
    const { wrapper, gateway } = await mountRoomView(JoinView, { path: '/join/LUNA42' })
    expect(wrapper.find('.join-room a').exists()).toBe(false)
    gateway.answer('lookUp', ok(summaryOf({ voiceCallUrl: 'https://calls.example.org/luna' })))
    await wrapper.findAll('.code input')[0]?.setValue('NUBE77')
    await flushPromises()
    expect(wrapper.find('.join-room a').text()).toBe('Join the call')
  })

  it('explains when the code finds no room', async () => {
    const { wrapper, gateway } = await mountRoomView(JoinView, { path: '/join' })
    gateway.answer('lookUp', err({ code: 'room-not-found' }))
    const inputs = wrapper.findAll('.code input')
    await inputs[0]?.setValue('zzzzzz')
    await flushPromises()
    expect(wrapper.text()).toContain('No village with that code.')
    expect(wrapper.find('button[type="submit"]').attributes('disabled')).toBeDefined()
  })
})
