import type { ChatMessage, PlayerMatchView } from '@luna/contracts'
import { flushPromises } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { accessOf, messageOf } from '../../application/ChatGateway.fixtures'
import { playerViewOf, youOf } from '@/features/match/application/MatchGateway.fixtures'
import PlayerTable from '@/features/match/infrastructure/components/PlayerTable.vue'
import { matchPlayers, mountMatchView } from '@/features/match/infrastructure/mountMatchView.fixtures'

const tableOf = (overrides: Partial<PlayerMatchView> = {}) => playerViewOf({ players: matchPlayers(), ...overrides })

const mountChat = async (view: ReturnType<typeof tableOf>, history: readonly ChatMessage[] = []) => {
  const mounted = await mountMatchView(PlayerTable, {
    view,
    props: { view },
    configure: ({ chats }) => chats.withHistory(history)
  })
  return mounted
}

const openSheet = async (wrapper: Awaited<ReturnType<typeof mountChat>>['wrapper']) => {
  await wrapper.find('.chatbar').trigger('click')
  await flushPromises()
}

const tabNamed = (wrapper: Awaited<ReturnType<typeof mountChat>>['wrapper'], name: string) =>
  wrapper.findAll('.tab').find((tab) => tab.text().startsWith(name))

describe('chat bar and sheet', () => {
  it('shows the night note on the bar and instead of a composer', async () => {
    const { wrapper } = await mountChat(tableOf({ phase: 'night', chat: accessOf() }))
    expect(wrapper.find('.chatbar').text()).toContain('The village sleeps — chat opens at dawn')
    expect(wrapper.find('.sheet').exists()).toBe(false)
    await openSheet(wrapper)
    expect(wrapper.find('.sheet .locked-note').text()).toBe('The village sleeps — chat opens at dawn')
    expect(wrapper.find('.sheet .composer').exists()).toBe(false)
  })

  it('opens a sheet with a composer by day and closes it from the grabber', async () => {
    const { wrapper } = await mountChat(tableOf({ phase: 'day', chat: accessOf({ write: ['village'] }) }))
    expect(wrapper.find('.chatbar').text()).toContain('Chat with the village')
    await openSheet(wrapper)
    expect(wrapper.find('.sheet .composer .input').exists()).toBe(true)
    expect(wrapper.find('.sheet .locked-note').exists()).toBe(false)
    await wrapper.find('.grabber').trigger('click')
    expect(wrapper.find('.sheet').exists()).toBe(false)
  })

  it('sends what you type to the village and clears the box', async () => {
    const { wrapper, chats } = await mountChat(tableOf({ phase: 'day', chat: accessOf({ write: ['village'] }) }))
    await openSheet(wrapper)
    const send = wrapper.find('.composer button')
    expect(send.attributes('disabled')).toBeDefined()
    await wrapper.find('.composer .input').setValue('arepas are a valid alibi')
    await wrapper.find('.composer').trigger('submit')
    await flushPromises()
    expect(chats.calls.at(-1)).toEqual({ command: 'send', input: { channel: 'village', text: 'arepas are a valid alibi' } })
    expect((wrapper.find('.composer .input').element as HTMLInputElement).value).toBe('')
    expect(wrapper.find('.msg-own .bubble').text()).toBe('arepas are a valid alibi')
  })

  it('shows the reason a message was refused', async () => {
    const { wrapper, chats } = await mountChat(tableOf({ phase: 'day', chat: accessOf({ write: ['village'] }) }))
    chats.failWith('chat-closed')
    await openSheet(wrapper)
    await wrapper.find('.composer .input').setValue('hello')
    await wrapper.find('.composer').trigger('submit')
    await flushPromises()
    expect(wrapper.find('.chat-composer-error').text()).toBe('This chat is closed right now.')
    expect((wrapper.find('.composer .input').element as HTMLInputElement).value).toBe('hello')
  })

  it('shows a count on the Wolves tab when the pack talks while you read the village', async () => {
    const view = tableOf({
      phase: 'night',
      you: youOf({ role: 'werewolf', team: 'wolves', packIds: ['id-Tato'] }),
      chat: accessOf({ read: ['village', 'wolves'], write: ['wolves'] })
    })
    const { wrapper, chats } = await mountChat(view)
    await openSheet(wrapper)
    expect(wrapper.findAll('.tab').map((tab) => tab.text())).toEqual(['Village', 'Wolves'])
    expect(tabNamed(wrapper, 'Village')?.classes()).toContain('is-on')
    expect(tabNamed(wrapper, 'Wolves')?.find('.count').exists()).toBe(false)
    chats.pushMessage(messageOf({ channel: 'wolves', authorId: 'id-Tato', text: 'him. he is too smart.' }))
    await flushPromises()
    expect(tabNamed(wrapper, 'Wolves')?.find('.count').text()).toBe('1')
    expect(tabNamed(wrapper, 'Village')?.find('.count').exists()).toBe(false)
    expect(wrapper.find('.chatbar .count').text()).toBe('1')
    await tabNamed(wrapper, 'Wolves')?.trigger('click')
    expect(tabNamed(wrapper, 'Wolves')?.find('.count').exists()).toBe(false)
    expect(wrapper.find('.msg-wolf .who').text()).toBe('Tato')
  })

  it('styles every kind of message', async () => {
    const history = [
      messageOf({ authorId: 'id-Marta', text: 'I have a feeling about Luis' }),
      messageOf({ authorId: 'id-Ana', text: 'arepas are a valid alibi' }),
      messageOf({ authorId: 'id-Nico', kind: 'narrator', text: 'The fog is thick tonight.' }),
      messageOf({ authorId: 'id-Juan', kind: 'last-words', text: 'It was Tato.' }),
      messageOf({ authorId: 'id-Juan', channel: 'ghosts', text: 'boo' }),
      messageOf({ authorId: 'id-Tato', channel: 'wolves', text: 'him' })
    ]
    const view = tableOf({
      phase: 'day',
      chat: accessOf({ read: ['village', 'wolves', 'ghosts'], write: ['village'] })
    })
    const { wrapper } = await mountChat(view, history)
    await openSheet(wrapper)
    await tabNamed(wrapper, 'Village')?.trigger('click')
    const village = wrapper.findAll('.sheet .msg')
    expect(village.map((message) => message.classes().filter((name) => name !== 'msg'))).toEqual([
      [],
      ['msg-own'],
      ['msg-narr'],
      ['msg-last']
    ])
    expect(village[0]?.find('.who').text()).toBe('Marta')
    expect(village[1]?.find('.who').exists()).toBe(false)
    expect(village[2]?.find('.who').text()).toBe('Narrator')
    expect(village[3]?.find('.who').text()).toBe('Juan · Last words')
    await tabNamed(wrapper, 'Wolves')?.trigger('click')
    expect(wrapper.find('.sheet .msg').classes()).toContain('msg-wolf')
    await tabNamed(wrapper, 'Ghosts')?.trigger('click')
    expect(wrapper.find('.sheet .msg').classes()).toContain('msg-ghost')
  })

  it('pauses the village while last words are open', async () => {
    const view = tableOf({ phase: 'dawn', chat: accessOf({ villagePaused: true }) })
    const { wrapper } = await mountChat(view)
    expect(wrapper.find('.chatbar').text()).toContain('Chat paused for last words')
    await openSheet(wrapper)
    expect(wrapper.find('.sheet .locked-note').text()).toBe('Chat paused for last words')
    expect(wrapper.find('.sheet .composer').exists()).toBe(false)
  })

  it('keeps the village read-only for a ghost and opens on the ghosts', async () => {
    const view = tableOf({
      phase: 'day',
      players: matchPlayers({ 'id-Ana': { alive: false } }),
      chat: accessOf({ read: ['village', 'ghosts'], write: ['ghosts'] })
    })
    const { wrapper } = await mountChat(view)
    expect(wrapper.find('.chatbar').text()).toContain('Ghosts · Village is read-only')
    await openSheet(wrapper)
    expect(tabNamed(wrapper, 'Ghosts')?.classes()).toContain('is-on')
    expect(wrapper.find('.sheet .composer').exists()).toBe(true)
    await tabNamed(wrapper, 'Village')?.trigger('click')
    expect(wrapper.find('.sheet .locked-note').text()).toBe('Village is read-only')
    expect(wrapper.find('.sheet .composer').exists()).toBe(false)
  })

  it('tells the wolves their den is quiet by day', async () => {
    const view = tableOf({
      phase: 'day',
      chat: accessOf({ read: ['village', 'wolves'], write: ['village'] })
    })
    const { wrapper } = await mountChat(view)
    await openSheet(wrapper)
    await tabNamed(wrapper, 'Wolves')?.trigger('click')
    expect(wrapper.find('.sheet .locked-note').text()).toBe('The den is quiet — wolves talk at night')
  })
})
