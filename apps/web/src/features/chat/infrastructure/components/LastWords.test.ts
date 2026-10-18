import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { accessOf, messageOf } from '../../application/ChatGateway.fixtures'
import { playerViewOf } from '@/features/match/application/MatchGateway.fixtures'
import PlayerTable from '@/features/match/infrastructure/components/PlayerTable.vue'
import { matchPlayers, mountMatchView } from '@/features/match/infrastructure/mountMatchView.fixtures'
import type { ChatMessage, ChatAccess } from '@luna/contracts'

const SERVER_NOW = 1_000_000

beforeEach(() => vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval', 'Date'] }))
afterEach(() => vi.useRealTimers())

const mountWindow = async (
  access: Partial<ChatAccess>,
  history: readonly ChatMessage[] = [],
  playerOverrides = {}
) => {
  const view = playerViewOf({
    phase: 'dawn',
    serverNow: SERVER_NOW,
    players: matchPlayers(playerOverrides),
    chat: accessOf(access)
  })
  return mountMatchView(PlayerTable, { view, props: { view }, configure: ({ chats }) => chats.withHistory(history) })
}

const juanSpeaks = (sentAgo: number, text = 'It was Tato. Avenge my hat.') =>
  messageOf({ authorId: 'id-Juan', kind: 'last-words', sentAt: SERVER_NOW - sentAgo, text })

describe('last words prompt', () => {
  const dying = { read: ['village', 'ghosts'] as const, write: ['village', 'ghosts'] as const, lastWordsUntil: SERVER_NOW + 12_000 }

  it('prompts the dying player with a countdown and a composer', async () => {
    const { wrapper, chats } = await mountWindow(dying, [], { 'id-Ana': { alive: false } })
    const prompt = wrapper.find('.chat-prompt')
    expect(prompt.find('h2').text()).toBe('Your last words')
    expect(prompt.find('[role="timer"]').text()).toBe('0:12')
    await prompt.find('.input').setValue('Avenge my hat.')
    await prompt.find('.composer').trigger('submit')
    await flushPromises()
    expect(chats.calls.at(-1)).toEqual({ command: 'send', input: { channel: 'village', text: 'Avenge my hat.' } })
  })

  it('counts down every second and goes away when the time runs out', async () => {
    const { wrapper } = await mountWindow(dying, [], { 'id-Ana': { alive: false } })
    vi.advanceTimersByTime(3000)
    await flushPromises()
    expect(wrapper.find('.chat-prompt [role="timer"]').text()).toBe('0:09')
    vi.advanceTimersByTime(9000)
    await flushPromises()
    expect(wrapper.find('.chat-prompt').exists()).toBe(false)
  })

  it('does not prompt a player without a window', async () => {
    const { wrapper } = await mountWindow({ write: ['village'] })
    expect(wrapper.find('.chat-prompt').exists()).toBe(false)
  })
})

describe('last words spotlight', () => {
  it('shows everyone what Juan said, with a countdown', async () => {
    const { wrapper } = await mountWindow({ villagePaused: true }, [juanSpeaks(5_000)], { 'id-Juan': { alive: false, revealedRole: 'doctor' } })
    const spotlight = wrapper.find('.chat-spotlight')
    expect(spotlight.find('.ph-name').text()).toBe('Last words')
    expect(spotlight.find('.ph-sub').text()).toBe('Juan has the floor')
    expect(spotlight.find('.parch').text()).toBe('“It was Tato. Avenge my hat.”')
    expect(spotlight.find('.chat-spotlight-clock').text()).toBe('0:10')
    expect(spotlight.text()).toContain('Doctor · 15 seconds of fame')
    expect(spotlight.find('.locked-note').text()).toBe('Chat paused for last words')
  })

  it('shows no pause note once the village is open again', async () => {
    const { wrapper } = await mountWindow({}, [juanSpeaks(5_000)])
    expect(wrapper.find('.chat-spotlight').exists()).toBe(true)
    expect(wrapper.find('.chat-spotlight .locked-note').exists()).toBe(false)
  })

  it('appears when last words arrive live and leaves after the window', async () => {
    const { wrapper, chats } = await mountWindow({})
    expect(wrapper.find('.chat-spotlight').exists()).toBe(false)
    chats.pushMessage(juanSpeaks(1_000))
    await flushPromises()
    expect(wrapper.find('.chat-spotlight .parch').text()).toContain('It was Tato')
    vi.advanceTimersByTime(15_000)
    await flushPromises()
    expect(wrapper.find('.chat-spotlight').exists()).toBe(false)
  })

  it('stays away for old last words and for ordinary messages', async () => {
    const { wrapper } = await mountWindow({}, [juanSpeaks(60_000), messageOf({ sentAt: SERVER_NOW })])
    expect(wrapper.find('.chat-spotlight').exists()).toBe(false)
  })
})
