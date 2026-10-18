import type { RoomSession, RoomSnapshot } from '@luna/contracts'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createSocketKit, type Client } from '../../../shared/infrastructure/socketTestKit.fixtures'
import { FRIENDS, unwrap } from '../domain/Room.fixtures'

const kit = createSocketKit()
const newClient = kit.newClient

const nextSnapshot = (client: Client, matches: (snapshot: RoomSnapshot) => boolean): Promise<RoomSnapshot> =>
  new Promise((resolve) => {
    const listener = (snapshot: RoomSnapshot) => {
      if (!matches(snapshot)) return
      client.off('room:snapshot', listener)
      resolve(snapshot)
    }
    client.on('room:snapshot', listener)
  })

const createRoom = async (client: Client): Promise<RoomSession> =>
  unwrap(await client.emitWithAck('room:create', { roomName: 'Los Primos', narratorName: 'Nico' }))

const join = async (client: Client, code: string, name: string): Promise<RoomSession> =>
  unwrap(await client.emitWithAck('room:join', { code, name }))

beforeEach(async () => {
  await kit.start()
})

afterEach(async () => {
  await kit.stop()
})

describe('room socket handlers', () => {
  it('broadcasts the lobby when a player joins', async () => {
    const narrator = await newClient()
    const session = await createRoom(narrator)
    const seesCaro = nextSnapshot(narrator, (snapshot) => snapshot.members.some((member) => member.name === 'Caro'))
    await join(await newClient(), session.code, 'Caro')
    expect((await seesCaro).members.map((member) => member.name)).toEqual(['Nico', 'Caro'])
  })

  it('answers lookups and errors through the acknowledgement', async () => {
    const client = await newClient()
    const session = await createRoom(client)
    const summary = unwrap(await (await newClient()).emitWithAck('room:lookUp', { code: session.code.toLowerCase() }))
    expect(summary).toMatchObject({ name: 'Los Primos', narratorName: 'Nico', playerCount: 0 })
    expect(await client.emitWithAck('room:join', { code: session.code, name: 'nico' })).toMatchObject({
      ok: false,
      error: { code: 'name-taken' }
    })
  })

  it('rejects commands from a socket without a session', async () => {
    const client = await newClient()
    expect(await client.emitWithAck('room:setReady', { ready: true })).toEqual({
      ok: false,
      error: { code: 'session-invalid' }
    })
  })

  it('survives malformed payloads', async () => {
    const client = await newClient()
    const emitRaw = client.emitWithAck.bind(client) as (event: string, payload: unknown) => Promise<unknown>
    expect(await emitRaw('room:create', null)).toEqual({ ok: false, error: { code: 'room-name-invalid' } })
    expect(await emitRaw('room:join', 'LUNA42')).toEqual({ ok: false, error: { code: 'room-not-found' } })
  })

  it('plays create, join, ready and start end to end', async () => {
    const narrator = await newClient()
    const session = await createRoom(narrator)
    const deck = { werewolf: 1, seer: 1, doctor: 0, witch: 0, hunter: 0, fool: 0, drunk: 0, villager: 4 }
    unwrap(await narrator.emitWithAck('room:updateSettings', { settings: { deck } }))
    for (const name of FRIENDS.slice(0, 6)) {
      const player = await newClient()
      await join(player, session.code, name)
      unwrap(await player.emitWithAck('room:setReady', { ready: true }))
    }
    const started = nextSnapshot(narrator, (snapshot) => snapshot.status === 'in-game')
    unwrap(await narrator.emitWithAck('room:start', {}))
    expect((await started).status).toBe('in-game')
  })

  it('broadcasts a new voice call link and rejects a player changing it', async () => {
    const narrator = await newClient()
    const session = await createRoom(narrator)
    const caro = await newClient()
    await join(caro, session.code, 'Caro')
    const link = 'https://discord.gg/abc123'
    const seesLink = nextSnapshot(caro, (snapshot) => snapshot.voiceCallUrl === link)
    unwrap(await narrator.emitWithAck('room:setVoiceCall', { url: link }))
    expect((await seesLink).voiceCallUrl).toBe(link)
    expect(await caro.emitWithAck('room:setVoiceCall', { url: null })).toEqual({ ok: false, error: { code: 'not-narrator' } })
    expect(await narrator.emitWithAck('room:setVoiceCall', { url: 'http://x.org' })).toEqual({
      ok: false,
      error: { code: 'voice-call-invalid' }
    })
    const cleared = nextSnapshot(caro, (snapshot) => snapshot.voiceCallUrl === null)
    unwrap(await narrator.emitWithAck('room:setVoiceCall', { url: null }))
    await cleared
  })

  it('tells a kicked player and stops their seat', async () => {
    const narrator = await newClient()
    const session = await createRoom(narrator)
    const tato = await newClient()
    const tatoSession = await join(tato, session.code, 'Tato')
    const kicked = new Promise<void>((resolve) => tato.on('room:kicked', () => resolve()))
    unwrap(await narrator.emitWithAck('room:kick', { memberId: tatoSession.memberId }))
    await kicked
    expect(await tato.emitWithAck('room:setReady', { ready: true })).toEqual({ ok: false, error: { code: 'session-invalid' } })
  })

  it('marks a member reconnecting on disconnect and connected again on resume', async () => {
    const narrator = await newClient()
    const session = await createRoom(narrator)
    const caro = await newClient()
    const caroSession = await join(caro, session.code, 'Caro')
    const caroOffline = nextSnapshot(narrator, (snapshot) => snapshot.members.some((member) => member.name === 'Caro' && !member.connected))
    caro.disconnect()
    await caroOffline
    const caroBack = nextSnapshot(narrator, (snapshot) => snapshot.members.some((member) => member.name === 'Caro' && member.connected))
    const resumed = unwrap(await (await newClient()).emitWithAck('room:resume', { code: session.code, token: caroSession.token }))
    expect(resumed.memberId).toBe(caroSession.memberId)
    await caroBack
  })

  it('tells everyone when the narrator closes the room', async () => {
    const narrator = await newClient()
    const session = await createRoom(narrator)
    const caro = await newClient()
    await join(caro, session.code, 'Caro')
    const closed = new Promise<void>((resolve) => caro.on('room:closed', () => resolve()))
    unwrap(await narrator.emitWithAck('room:leave', {}))
    await closed
  })
})
