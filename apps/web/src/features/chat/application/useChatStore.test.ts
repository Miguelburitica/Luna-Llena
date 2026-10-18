import { flushPromises } from '@vue/test-utils'
import type { ChatMessage, MatchView } from '@luna/contracts'
import { describe, expect, it } from 'vitest'
import { sessionFor } from '@/features/room/application/RoomGateway.fixtures'
import { ok } from '@luna/contracts'
import { playerViewOf } from '@/features/match/application/MatchGateway.fixtures'
import { createMatchTestApp } from '@/features/match/application/matchApp.fixtures'
import { accessOf, messageOf } from './ChatGateway.fixtures'
import { useChatStore } from './useChatStore'

const wolfView = () => playerViewOf({ chat: accessOf({ read: ['village', 'wolves'], write: ['village'] }) })

const startChat = async (view: MatchView, history: readonly ChatMessage[] = []) => {
  const kit = createMatchTestApp(view)
  kit.chats.withHistory(history)
  await kit.room.join('LUNA42', 'Ana')
  await kit.store.sync()
  const chat = kit.app.runWithContext(() => useChatStore())
  await flushPromises()
  return { ...kit, chat }
}

describe('chat store', () => {
  it('fetches the history when the game view loads, split per channel', async () => {
    const village = messageOf({ text: 'good morning' })
    const wolves = messageOf({ channel: 'wolves', text: 'him', authorId: 'id-Tato' })
    const { chat, chats } = await startChat(wolfView(), [village, wolves])
    expect(chats.commands()).toEqual(['history'])
    expect(chat.messages.village).toEqual([village])
    expect(chat.messages.wolves).toEqual([wolves])
    expect(chat.messages.ghosts).toEqual([])
  })

  it('treats the history as already seen', async () => {
    const { chat } = await startChat(wolfView(), [messageOf({ channel: 'wolves', authorId: 'id-Tato' })])
    expect(chat.unread).toEqual({ village: 0, wolves: 0, ghosts: 0 })
  })

  it('fetches the history again after the connection comes back and the seat is resumed', async () => {
    const { chats, rooms, chat } = await startChat(wolfView())
    rooms.answer('resume', ok(sessionFor('id-Ana')))
    const later = messageOf({ text: 'while you were away' })
    chats.withHistory([later])
    chats.pushReconnected()
    rooms.pushReconnected()
    await flushPromises()
    expect(chats.commands()).toEqual(['history', 'history'])
    expect(chat.messages.village).toEqual([later])
    expect(chat.unread.village).toBe(1)
  })

  it('adds live messages of readable channels and counts them as unread', async () => {
    const { chat, chats } = await startChat(wolfView())
    chats.pushMessage(messageOf({ channel: 'wolves', authorId: 'id-Tato' }))
    chats.pushMessage(messageOf({ text: 'hello' }))
    expect(chat.messages.wolves).toHaveLength(1)
    expect(chat.messages.village).toHaveLength(1)
    expect(chat.unread).toEqual({ village: 1, wolves: 1, ghosts: 0 })
  })

  it('ignores a live message from a channel it may not read', async () => {
    const { chat, chats } = await startChat(playerViewOf({ chat: accessOf() }))
    chats.pushMessage(messageOf({ channel: 'wolves', authorId: 'id-Tato' }))
    chats.pushMessage(messageOf({ channel: 'ghosts', authorId: 'id-Juan' }))
    expect(chat.messages.wolves).toEqual([])
    expect(chat.messages.ghosts).toEqual([])
  })

  it('never repeats a message that arrives twice', async () => {
    const { chat, chats } = await startChat(wolfView())
    const message = messageOf()
    chats.pushMessage(message)
    chats.pushMessage(message)
    expect(chat.messages.village).toEqual([message])
  })

  it('marks the open tab as seen while the sheet is open', async () => {
    const { chat, chats } = await startChat(wolfView())
    chats.pushMessage(messageOf({ authorId: 'id-Pipe' }))
    expect(chat.unread.village).toBe(1)
    chat.openSheet()
    await flushPromises()
    expect(chat.unread.village).toBe(0)
    chats.pushMessage(messageOf({ authorId: 'id-Pipe' }))
    await flushPromises()
    expect(chat.unread.village).toBe(0)
    chats.pushMessage(messageOf({ channel: 'wolves', authorId: 'id-Tato' }))
    expect(chat.unread.wolves).toBe(1)
    chat.selectTab('wolves')
    await flushPromises()
    expect(chat.unread.wolves).toBe(0)
  })

  it('opens on the ghosts for the dead and falls back to a readable tab', async () => {
    const { chat, store, matches } = await startChat(playerViewOf({ chat: accessOf({ read: ['village', 'ghosts'] }) }))
    expect(chat.currentTab).toBe('ghosts')
    chat.selectTab('village')
    expect(chat.currentTab).toBe('village')
    matches.pushView(playerViewOf({ chat: accessOf() }))
    expect(store.view?.chat.read).toEqual(['village'])
    expect(chat.currentTab).toBe('village')
  })

  it('fetches the history again when a channel becomes readable', async () => {
    const { chat, chats, matches } = await startChat(playerViewOf())
    const gossip = messageOf({ channel: 'ghosts', authorId: 'id-Juan', text: 'boo' })
    chats.withHistory([gossip])
    matches.pushView(playerViewOf({ chat: accessOf({ read: ['village', 'ghosts'], write: ['ghosts'] }) }))
    await flushPromises()
    expect(chats.commands()).toEqual(['history', 'history'])
    expect(chat.messages.ghosts).toEqual([gossip])
  })

  it('sends a message and keeps it in the channel', async () => {
    const { chat, chats } = await startChat(playerViewOf({ chat: accessOf({ write: ['village'] }) }))
    const result = await chat.send('village', 'arepas are a valid alibi')
    expect(result.ok).toBe(true)
    expect(chats.calls.at(-1)).toEqual({ command: 'send', input: { channel: 'village', text: 'arepas are a valid alibi' } })
    expect(chat.messages.village.map((message) => message.text)).toEqual(['arepas are a valid alibi'])
    expect(chat.failure).toBeNull()
  })

  it('keeps a send failure until the next success or tab change', async () => {
    const { chat, chats } = await startChat(wolfView())
    chats.failWith('chat-closed')
    const failed = await chat.send('village', 'anyone there?')
    expect(failed.ok).toBe(false)
    expect(chat.failure).toEqual({ code: 'chat-closed' })
    expect(chat.messages.village).toEqual([])
    chat.selectTab('wolves')
    expect(chat.failure).toBeNull()
    chats.failWith('unreachable')
    await chat.send('wolves', 'hi')
    expect(chat.failure).toEqual({ code: 'unreachable' })
    chats.sendResult = null
    await chat.send('wolves', 'hi')
    expect(chat.failure).toBeNull()
  })

  it('keeps a failed history fetch as the failure', async () => {
    const kit = createMatchTestApp(playerViewOf())
    kit.chats.historyResult = { ok: false, error: { code: 'unreachable' } }
    await kit.room.join('LUNA42', 'Ana')
    await kit.store.sync()
    const chat = kit.app.runWithContext(() => useChatStore())
    await flushPromises()
    expect(chat.failure).toEqual({ code: 'unreachable' })
  })
})
