import type { PlayerMatchView } from '@luna/contracts'
import { flushPromises } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { accessOf, messageOf } from '../../application/ChatGateway.fixtures'
import { playerViewOf } from '@/features/match/application/MatchGateway.fixtures'
import PlayerTable from '@/features/match/infrastructure/components/PlayerTable.vue'
import { matchPlayers, mountMatchView } from '@/features/match/infrastructure/mountMatchView.fixtures'

const dayView = (): PlayerMatchView =>
  playerViewOf({ players: matchPlayers(), phase: 'day', chat: accessOf({ read: ['village'], write: ['village'] }) })

const mountOpenChat = async (history = [messageOf({ id: 'message-flagged', text: 'algo feo' })]) => {
  const view = dayView()
  const mounted = await mountMatchView(PlayerTable, { view, props: { view }, configure: ({ chats }) => chats.withHistory(history) })
  await mounted.wrapper.find('.chatbar').trigger('click')
  await flushPromises()
  return mounted
}

describe('message length countdown', () => {
  it('stops input at 200 characters', async () => {
    const { wrapper } = await mountOpenChat()
    expect(wrapper.find('.composer .input').attributes('maxlength')).toBe('200')
  })

  it('shows no count for a short draft', async () => {
    const { wrapper } = await mountOpenChat()
    await wrapper.find('.composer .input').setValue('x'.repeat(20))
    expect(wrapper.find('.chat-composer-count').exists()).toBe(false)
  })

  it('shows the characters left near the limit and warns at zero', async () => {
    const { wrapper } = await mountOpenChat()
    await wrapper.find('.composer .input').setValue('x'.repeat(170))
    expect(wrapper.find('.chat-composer-count').text()).toBe('30')
    expect(wrapper.find('.chat-composer-count').classes()).not.toContain('err')
    await wrapper.find('.composer .input').setValue('x'.repeat(200))
    expect(wrapper.find('.chat-composer-count').classes()).toContain('err')
  })
})

describe('moderated messages', () => {
  it('replaces a removed message with Message removed', async () => {
    const { wrapper, chats } = await mountOpenChat()
    expect(wrapper.text()).toContain('algo feo')
    chats.pushRemoved('message-flagged')
    await flushPromises()
    expect(wrapper.text()).not.toContain('algo feo')
    expect(wrapper.find('.chat-removed').text()).toBe('Message removed')
  })

  it.each([
    ['chat-too-fast', 'Slow down a little.'],
    ['chat-muted', 'The narrator muted you.'],
    ['message-blocked', 'That message is not allowed here.']
  ] as const)('explains %s', async (code, text) => {
    const { wrapper, chats } = await mountOpenChat()
    chats.failWith(code)
    await wrapper.find('.composer .input').setValue('hola')
    await wrapper.find('.composer').trigger('submit')
    await flushPromises()
    expect(wrapper.find('.chat-composer-error').text()).toBe(text)
  })
})
