import type { ReviewLabel } from '@luna/contracts'
import { afterEach, describe, expect, it } from 'vitest'
import { createSocketKit, type Client } from '../../../shared/infrastructure/socketTestKit.fixtures'
import { FRIENDS, unwrap } from '../../room/domain/Room.fixtures'

const kit = createSocketKit()

afterEach(async () => {
  await kit.stop()
})

const startPublicGame = async (): Promise<{ narrator: Client; players: Client[] }> => {
  const narrator = await kit.newClient({ device: 'device-nico-1234' })
  const session = unwrap(
    await narrator.emitWithAck('room:create', { roomName: 'Lobos', narratorName: 'Nico', visibility: 'public' })
  )
  unwrap(
    await narrator.emitWithAck('room:updateSettings', {
      settings: { deck: { werewolf: 1, seer: 0, doctor: 0, witch: 0, hunter: 0, fool: 0, drunk: 0, villager: 5 } }
    })
  )
  const players: Client[] = []
  for (const name of FRIENDS.slice(0, 6)) {
    const player = await kit.newClient()
    unwrap(await player.emitWithAck('room:join', { code: session.code, name }))
    unwrap(await player.emitWithAck('room:setReady', { ready: true }))
    players.push(player)
  }
  unwrap(await narrator.emitWithAck('room:start', {}))
  return { narrator, players }
}

describe('moderated chat over sockets', () => {
  it('removes a flagged message for every reader', async () => {
    const harassing: ReviewLabel = 'harassment'
    await kit.start({ classifier: { classify: async (_text, kind) => (kind === 'message' ? harassing : 'ok') } })
    const { narrator, players } = await startPublicGame()
    const reader = players[0] as Client
    const removed = new Promise<string>((resolve) => reader.once('chat:removed', ({ messageId }) => resolve(messageId)))
    const sent = unwrap(await narrator.emitWithAck('chat:send', { channel: 'village', text: 'algo muy feo' }))
    expect(await removed).toBe(sent.id)
    expect(unwrap(await reader.emitWithAck('chat:history', {}))).toEqual([])
  })

  it('rejects a word-list match before delivery', async () => {
    await kit.start()
    const { narrator } = await startPublicGame()
    expect(await narrator.emitWithAck('chat:send', { channel: 'village', text: 'eres una put4' })).toEqual({
      ok: false,
      error: { code: 'message-blocked' }
    })
  })
})
