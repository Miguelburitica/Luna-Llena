import { describe, expect, it } from 'vitest'
import { unwrap } from '../domain/Room.fixtures'
import { clientOf, createRoomKit } from './roomUseCases.fixtures'

const NICO = clientOf('Nico', '10.0.0.5')
const MINUTE = 60_000

describe('Room visibility', () => {
  it('creates private rooms by default and keeps them off the list', async () => {
    const kit = createRoomKit()
    const { session } = await kit.createRoom()
    expect(session.snapshot.visibility).toBe('private')
    expect(await kit.useCases.listPublicRooms.execute()).toEqual([])
  })

  it('lists a public room for everyone to see', async () => {
    const kit = createRoomKit()
    const { session } = await kit.createRoom(undefined, 'public', NICO)
    expect(session.snapshot.visibility).toBe('public')
    expect(await kit.useCases.listPublicRooms.execute()).toEqual([
      {
        code: session.code,
        name: 'Los Primos',
        narratorName: 'Nico',
        playerCount: 0,
        capacity: 15,
        botCount: 0,
        deckSize: 8,
        status: 'waiting',
        joinable: true
      }
    ])
    expect(kit.lobby.changes).toBeGreaterThan(0)
  })

  it('rejects an unknown visibility', async () => {
    const kit = createRoomKit()
    expect(await kit.useCases.createRoom.execute({ roomName: 'Sala', narratorName: 'Nico', visibility: 'secret' })).toEqual({
      ok: false,
      error: { code: 'settings-invalid' }
    })
  })

  it('shows bot counts and drops the room when its narrator is away', async () => {
    const kit = createRoomKit()
    const { session, narrator } = await kit.createRoom(undefined, 'public', NICO)
    unwrap(await kit.useCases.addBot.execute(narrator, {}))
    expect((await kit.useCases.listPublicRooms.execute())[0]?.botCount).toBe(1)
    unwrap(await kit.useCases.markDisconnected.execute(narrator))
    expect(await kit.useCases.listPublicRooms.execute()).toEqual([])
    unwrap(await kit.useCases.resumeSession.execute({ code: session.code, token: session.token }))
    expect(await kit.useCases.listPublicRooms.execute()).toHaveLength(1)
  })
})

describe('Public room cap', () => {
  it('rejects a third public room from the same address', async () => {
    const kit = createRoomKit(['LUNA42', 'NUBE77', 'SUNNY8'])
    await kit.createRoom(undefined, 'public', NICO)
    await kit.createRoom(undefined, 'public', NICO)
    expect(await kit.useCases.createRoom.execute({ roomName: 'Otra', narratorName: 'Nico', visibility: 'public' }, NICO)).toEqual({
      ok: false,
      error: { code: 'public-room-limit' }
    })
  })

  it('leaves private rooms unlimited', async () => {
    const kit = createRoomKit(['LUNA42', 'NUBE77', 'SUNNY8'])
    await kit.createRoom(undefined, 'public', NICO)
    await kit.createRoom(undefined, 'public', NICO)
    expect((await kit.useCases.createRoom.execute({ roomName: 'Otra', narratorName: 'Nico' }, NICO)).ok).toBe(true)
  })

  it('frees a slot when a public room closes', async () => {
    const kit = createRoomKit(['LUNA42', 'NUBE77', 'SUNNY8'])
    const { narrator } = await kit.createRoom(undefined, 'public', NICO)
    await kit.createRoom(undefined, 'public', NICO)
    unwrap(await kit.useCases.leaveRoom.execute(narrator))
    expect((await kit.useCases.createRoom.execute({ roomName: 'Otra', narratorName: 'Nico', visibility: 'public' }, NICO)).ok).toBe(true)
  })

  it('frees a slot when cleanup closes a public room', async () => {
    const kit = createRoomKit(['LUNA42', 'NUBE77', 'SUNNY8'])
    const { narrator } = await kit.createRoom(undefined, 'public', NICO)
    await kit.createRoom(undefined, 'public', NICO)
    unwrap(await kit.useCases.markDisconnected.execute(narrator))
    kit.clock.advanceBy(10 * MINUTE)
    expect(await kit.useCases.sweepRooms.execute()).toEqual([{ code: 'LUNA42', reason: 'narrator-gone' }])
    expect(kit.publisher.closed).toEqual(['LUNA42'])
    expect(kit.starter.discarded).toEqual(['LUNA42'])
    expect((await kit.useCases.createRoom.execute({ roomName: 'Otra', narratorName: 'Nico', visibility: 'public' }, NICO)).ok).toBe(true)
  })
})

describe('Reports', () => {
  it('hides a room after reports from three networks and strikes its creator', async () => {
    const kit = createRoomKit()
    const { session } = await kit.createRoom(undefined, 'public', NICO)
    for (const address of ['1.1.1.1', '2.2.2.2', '3.3.3.3']) {
      unwrap(await kit.useCases.reportRoom.execute({ code: session.code }, { address, device: `device-${address}` }))
    }
    expect(await kit.useCases.listPublicRooms.execute()).toEqual([])
    expect(kit.gate.reports).toHaveLength(3)
    expect(kit.gate.strikes).toEqual([{ client: NICO, reason: 'room-hidden', roomCode: session.code, excerpt: 'Los Primos' }])
    expect((await kit.useCases.lookUpRoom.execute({ code: session.code })).ok).toBe(true)
  })

  it('does not count a second report from the same network', async () => {
    const kit = createRoomKit()
    const { session } = await kit.createRoom(undefined, 'public', NICO)
    const caro = clientOf('Caro', '4.4.4.4')
    unwrap(await kit.useCases.reportRoom.execute({ code: session.code }, caro))
    unwrap(await kit.useCases.reportRoom.execute({ code: session.code }, caro))
    expect(kit.gate.reports).toHaveLength(1)
  })

  it('rejects reports of a private room', async () => {
    const kit = createRoomKit()
    const { session } = await kit.createRoom()
    expect(await kit.useCases.reportRoom.execute({ code: session.code }, clientOf('Caro'))).toEqual({
      ok: false,
      error: { code: 'room-not-public' }
    })
  })

  it('rejects reports from a banned client', async () => {
    const kit = createRoomKit()
    const { session } = await kit.createRoom(undefined, 'public', NICO)
    kit.gate.banned.set('device-Tato', 99)
    expect(await kit.useCases.reportRoom.execute({ code: session.code }, clientOf('Tato'))).toEqual({
      ok: false,
      error: { code: 'banned', until: 99 }
    })
    expect(kit.gate.reports).toEqual([])
  })
})

describe('Bans and review', () => {
  it('rejects joins and new rooms from a banned client', async () => {
    const kit = createRoomKit()
    const { session } = await kit.createRoom()
    kit.gate.banned.set('device-Tato', 5000)
    expect(await kit.useCases.joinRoom.execute({ code: session.code, name: 'Tato' }, clientOf('Tato'))).toEqual({
      ok: false,
      error: { code: 'banned', until: 5000 }
    })
    expect(await kit.useCases.createRoom.execute({ roomName: 'X', narratorName: 'Tato' }, clientOf('Tato'))).toEqual({
      ok: false,
      error: { code: 'banned', until: 5000 }
    })
  })

  it('blocks a profane name in a public room and strikes it', async () => {
    const kit = createRoomKit()
    const { session } = await kit.createRoom(undefined, 'public', NICO)
    kit.gate.labels.set('Grosero', 'profanity')
    expect(await kit.useCases.joinRoom.execute({ code: session.code, name: 'Grosero' }, clientOf('Tato'))).toEqual({
      ok: false,
      error: { code: 'name-blocked' }
    })
    expect(kit.gate.strikes[0]?.reason).toBe('name-blocked')
  })

  it('blocks a harassing public room name', async () => {
    const kit = createRoomKit()
    kit.gate.labels.set('Sala de odio', 'harassment')
    expect(
      await kit.useCases.createRoom.execute({ roomName: 'Sala de odio', narratorName: 'Nico', visibility: 'public' }, NICO)
    ).toEqual({ ok: false, error: { code: 'room-name-blocked' } })
  })

  it('does not review names in private rooms', async () => {
    const kit = createRoomKit()
    const { session } = await kit.createRoom()
    kit.gate.labels.set('Grosero', 'profanity')
    expect((await kit.useCases.joinRoom.execute({ code: session.code, name: 'Grosero' }, clientOf('Tato'))).ok).toBe(true)
    expect(kit.gate.reviewed).toEqual([])
  })
})

describe('Kicks and mutes', () => {
  it('hands a kicked seat to a bot mid-game and strikes the player in a public room', async () => {
    const kit = createRoomKit()
    const { code, narrator, players } = await kit.roomReadyToStart(6, 'public')
    unwrap(await kit.useCases.startGame.execute(narrator))
    const target = players[0]
    if (target === undefined) throw new Error('No player')
    unwrap(await kit.useCases.kickPlayer.execute(narrator, { memberId: target.actor.memberId }))
    const seat = kit.publisher.latest?.members.find((member) => member.id === target.actor.memberId)
    expect(seat?.bot).not.toBeNull()
    expect(kit.publisher.kicked).toEqual([{ code, memberId: target.actor.memberId }])
    expect(kit.publisher.takeovers[0]?.takeover.formerName).toBe('Ana')
    expect(kit.starter.handedOver).toEqual([code])
    expect(kit.gate.strikes).toEqual([{ client: clientOf('Ana'), reason: 'kicked', roomCode: code, excerpt: null }])
    expect(await kit.useCases.resumeSession.execute({ code, token: target.session.token })).toEqual({
      ok: false,
      error: { code: 'session-invalid' }
    })
  })

  it('mutes a player and answers whether they are muted', async () => {
    const kit = createRoomKit()
    const { code, narrator, firstPlayer } = await kit.roomReadyToStart(6)
    unwrap(await kit.useCases.muteMember.execute(narrator, { memberId: firstPlayer.actor.memberId, muted: true }))
    expect(await kit.useCases.roomFacts.isMuted(code, firstPlayer.actor.memberId)).toBe(true)
    expect(kit.publisher.latest?.members.find((member) => member.id === firstPlayer.actor.memberId)?.muted).toBe(true)
    expect(await kit.useCases.muteMember.execute(firstPlayer.actor, { memberId: narrator.memberId, muted: true })).toEqual({
      ok: false,
      error: { code: 'not-narrator' }
    })
  })
})

describe('Rooms in progress', () => {
  it('lists a running public room as in progress and joinable again after play again', async () => {
    const kit = createRoomKit()
    const { narrator } = await kit.roomReadyToStart(6, 'public')
    unwrap(await kit.useCases.startGame.execute(narrator))
    expect((await kit.useCases.listPublicRooms.execute())[0]).toMatchObject({ status: 'in-progress', joinable: false })
    kit.starter.over = true
    unwrap(await kit.useCases.playAgain.execute(narrator))
    expect((await kit.useCases.listPublicRooms.execute())[0]).toMatchObject({ status: 'waiting', joinable: true })
  })
})

describe('Operator', () => {
  it('lists every room and closes one', async () => {
    const kit = createRoomKit()
    const { session } = await kit.createRoom(undefined, 'public', NICO)
    expect(await kit.useCases.adminRooms.list()).toEqual([
      expect.objectContaining({ code: session.code, visibility: 'public', reports: 0, hidden: false })
    ])
    expect(await kit.useCases.adminRooms.close(session.code)).toBe(true)
    expect(kit.publisher.closed).toEqual([session.code])
    expect(await kit.useCases.adminRooms.close('NOPE99')).toBe(false)
  })
})
