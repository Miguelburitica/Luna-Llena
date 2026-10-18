import { err, ok } from '@luna/contracts'
import { flushPromises } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { sessionFor, summaryOf } from '../../application/RoomGateway.fixtures'
import { snapshotOf } from '../../domain/snapshot.fixtures'
import { mountRoomView } from '../mountRoomView.fixtures'
import JoinView from './JoinView.vue'

const caroSeat = { code: 'LUNA42', memberId: 'id-Caro', token: 'token-id-Caro' }

describe('JoinView', () => {
  it('offers the saved seat in a running game and returns the player to it', async () => {
    const { wrapper, router } = await mountRoomView(JoinView, {
      path: '/join/LUNA42',
      stored: caroSeat,
      seed: async ({ gateway }) => {
        gateway.answer('lookUp', ok(summaryOf({ acceptingPlayers: false })))
        gateway.answer('resume', ok(sessionFor('id-Caro', snapshotOf({ status: 'in-game' }))))
      }
    })
    expect(wrapper.text()).toContain('Your seat is waiting')
    expect(wrapper.text()).not.toContain('This village is mid-game')
    expect(wrapper.find('#join-name').exists()).toBe(false)
    await wrapper.find('form').trigger('submit')
    await vi.waitFor(() => expect(router.currentRoute.value.fullPath).toBe('/room/LUNA42'))
  })

  it('shows the normal join form for a room other than the saved seat', async () => {
    const { wrapper } = await mountRoomView(JoinView, { path: '/join/NUBE77', stored: caroSeat })
    expect(wrapper.text()).not.toContain('Your seat is waiting')
    expect(wrapper.find('#join-name').exists()).toBe(true)
    expect(wrapper.text()).toContain('Pick your look')
  })

  it('falls back to the join form when the saved seat is gone', async () => {
    const { wrapper } = await mountRoomView(JoinView, { path: '/join/LUNA42', stored: caroSeat })
    await wrapper.find('form').trigger('submit')
    await flushPromises()
    expect(wrapper.text()).toContain('Your seat is gone. Join again with the code.')
    expect(wrapper.find('#join-name').exists()).toBe(true)
  })

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
