import type { PublicRoomCard, RoomSession, SeatTakeover } from '@luna/contracts'
import { afterEach, describe, expect, it } from 'vitest'
import { createSocketKit, type Client } from '../../../shared/infrastructure/socketTestKit.fixtures'
import { FRIENDS, unwrap } from '../domain/Room.fixtures'

const kit = createSocketKit()

const nextRooms = (client: Client, matches: (rooms: readonly PublicRoomCard[]) => boolean): Promise<readonly PublicRoomCard[]> =>
  new Promise((resolve) => {
    const listener = (rooms: readonly PublicRoomCard[]) => {
      if (!matches(rooms)) return
      client.off('lobby:rooms', listener)
      resolve(rooms)
    }
    client.on('lobby:rooms', listener)
  })

const createPublicRoom = async (client: Client): Promise<RoomSession> =>
  unwrap(await client.emitWithAck('room:create', { roomName: 'Lobos de medianoche', narratorName: 'Nico', visibility: 'public' }))

afterEach(async () => {
  await kit.stop()
})

describe('public lobby sockets', () => {
  it('shows a new player in a public room to watchers within a second', async () => {
    await kit.start({ lobbyThrottleMs: 20 })
    const narrator = await kit.newClient()
    const session = await createPublicRoom(narrator)
    const watcher = await kit.newClient()
    expect(unwrap(await watcher.emitWithAck('lobby:watch', {})).map((room) => room.code)).toEqual([session.code])
    const seesPipe = nextRooms(watcher, (rooms) => rooms[0]?.playerCount === 1)
    unwrap(await (await kit.newClient()).emitWithAck('room:join', { code: session.code, name: 'Pipe' }))
    expect((await seesPipe)[0]).toMatchObject({ code: session.code, playerCount: 1, joinable: true })
  })

  it('drops a public room from the list when its narrator leaves', async () => {
    await kit.start({ lobbyThrottleMs: 20 })
    const narrator = await kit.newClient()
    await createPublicRoom(narrator)
    const watcher = await kit.newClient()
    unwrap(await watcher.emitWithAck('lobby:watch', {}))
    const empties = nextRooms(watcher, (rooms) => rooms.length === 0)
    unwrap(await narrator.emitWithAck('room:leave', {}))
    expect(await empties).toEqual([])
  })

  it('shows a started public game as in progress', async () => {
    await kit.start({ lobbyThrottleMs: 20 })
    const narrator = await kit.newClient()
    const session = await createPublicRoom(narrator)
    unwrap(
      await narrator.emitWithAck('room:updateSettings', {
        settings: { deck: { werewolf: 1, seer: 0, doctor: 0, witch: 0, hunter: 0, fool: 0, drunk: 0, villager: 5 } }
      })
    )
    for (const name of FRIENDS.slice(0, 6)) {
      const player = await kit.newClient()
      unwrap(await player.emitWithAck('room:join', { code: session.code, name }))
      unwrap(await player.emitWithAck('room:setReady', { ready: true }))
    }
    const watcher = await kit.newClient()
    unwrap(await watcher.emitWithAck('lobby:watch', {}))
    const running = nextRooms(watcher, (rooms) => rooms[0]?.status === 'in-progress')
    unwrap(await narrator.emitWithAck('room:start', {}))
    expect((await running)[0]).toMatchObject({ status: 'in-progress', joinable: false })
  })

  it('lets anyone join a public room by its code', async () => {
    await kit.start()
    const session = await createPublicRoom(await kit.newClient())
    const caro = await kit.newClient()
    expect(unwrap(await caro.emitWithAck('room:lookUp', { code: session.code }))).toMatchObject({ name: 'Lobos de medianoche' })
    expect((await caro.emitWithAck('room:join', { code: session.code, name: 'Caro' })).ok).toBe(true)
  })

  it('bars the kicked device from a public room and tells everyone about a seat takeover', async () => {
    await kit.start()
    const narrator = await kit.newClient()
    const session = await createPublicRoom(narrator)
    unwrap(
      await narrator.emitWithAck('room:updateSettings', {
        settings: { deck: { werewolf: 1, seer: 0, doctor: 0, witch: 0, hunter: 0, fool: 0, drunk: 0, villager: 5 } }
      })
    )
    const tato = await kit.newClient({ device: 'device-tato-1234' })
    const tatoSeat = unwrap(await tato.emitWithAck('room:join', { code: session.code, name: 'Tato' }))
    unwrap(await tato.emitWithAck('room:setReady', { ready: true }))
    for (const name of FRIENDS.slice(0, 5)) {
      const player = await kit.newClient()
      unwrap(await player.emitWithAck('room:join', { code: session.code, name }))
      unwrap(await player.emitWithAck('room:setReady', { ready: true }))
    }
    unwrap(await narrator.emitWithAck('room:start', {}))
    const takeover = new Promise<SeatTakeover>((resolve) => narrator.once('room:seatTakenOver', resolve))
    const kicked = new Promise<void>((resolve) => tato.once('room:kicked', () => resolve()))
    unwrap(await narrator.emitWithAck('room:kick', { memberId: tatoSeat.memberId }))
    await kicked
    expect((await takeover).formerName).toBe('Tato')
    const again = await kit.newClient({ device: 'device-tato-1234' })
    expect(await again.emitWithAck('room:join', { code: session.code, name: 'Tito' })).toMatchObject({ ok: false })
  })

  it('reports a room through the socket', async () => {
    await kit.start()
    const session = await createPublicRoom(await kit.newClient())
    expect(await (await kit.newClient()).emitWithAck('lobby:report', { code: session.code })).toEqual({ ok: true })
  })
})
