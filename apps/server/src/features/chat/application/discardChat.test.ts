import { describe, expect, it } from 'vitest'
import { CARO, CODE, createChatKit, unwrap } from './chatUseCases.fixtures'

describe('DiscardChat', () => {
  it('forgets every message of the room', async () => {
    const { useCases, logs, say, actorOf } = createChatKit()
    unwrap(await say(CARO, 'village', 'Hola'))
    expect(unwrap(await useCases.chatHistory.execute(actorOf(CARO)))).toHaveLength(1)
    await useCases.discardChat.execute(CODE)
    expect(await logs.find(CODE)).toBeUndefined()
    expect(unwrap(await useCases.chatHistory.execute(actorOf(CARO)))).toEqual([])
  })

  it('starts a fresh log with the next message', async () => {
    const { useCases, say, actorOf } = createChatKit()
    unwrap(await say(CARO, 'village', 'Viejo'))
    await useCases.discardChat.execute(CODE)
    unwrap(await say(CARO, 'village', 'Nuevo'))
    expect(unwrap(await useCases.chatHistory.execute(actorOf(CARO))).map((message) => message.text)).toEqual(['Nuevo'])
  })

  it('does nothing for a room without a chat', async () => {
    const { useCases } = createChatKit()
    await expect(useCases.discardChat.execute('NOPE00')).resolves.toBeUndefined()
  })
})
