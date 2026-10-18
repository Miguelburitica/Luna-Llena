import { describe, expect, it } from 'vitest'
import { unwrap } from '../domain/Room.fixtures'
import { createRoomKit } from './roomUseCases.fixtures'

describe('CreateRoom', () => {
  it('opens a room with the defaults and returns the narrator session', async () => {
    const { createRoom } = createRoomKit()
    const { session } = await createRoom()
    expect(session.code).toBe('LUNA42')
    expect(session.token).toMatch(/^id-/)
    expect(session.snapshot.members).toEqual([
      { id: session.memberId, name: 'Nico', avatar: null, isNarrator: true, ready: false, connected: true }
    ])
    expect(session.snapshot.settings.timers).toEqual({ night: 60, day: 180, vote: 60 })
  })

  it('draws another code when the first one is taken', async () => {
    const { createRoom } = createRoomKit(['LUNA42', 'LUNA42', 'NUBE77'])
    await createRoom()
    expect((await createRoom()).session.code).toBe('NUBE77')
  })

  it('rejects a blank room name', async () => {
    const { useCases } = createRoomKit()
    expect(await useCases.createRoom.execute({ roomName: ' ', narratorName: 'Nico' })).toEqual({
      ok: false,
      error: { code: 'room-name-invalid' }
    })
  })

  it('rejects invalid initial settings', async () => {
    const { useCases } = createRoomKit()
    const result = await useCases.createRoom.execute({ roomName: 'Sala', narratorName: 'Nico', settings: { theme: 'colombia' } })
    expect(result).toEqual({ ok: false, error: { code: 'settings-invalid' } })
  })
})

describe('LookUpRoom', () => {
  it('returns the public summary ignoring case', async () => {
    const { useCases, createRoom, join } = createRoomKit()
    const { session } = await createRoom()
    const ana = await join(session.code, 'Ana')
    unwrap(await useCases.chooseAvatar.execute(ana.actor, { avatar: 'ana' }))
    expect(await useCases.lookUpRoom.execute({ code: ' luna42' })).toEqual({
      ok: true,
      value: {
        code: 'LUNA42',
        name: 'Los Primos',
        narratorName: 'Nico',
        theme: 'classic',
        playerCount: 1,
        capacity: 15,
        avatarsInUse: ['ana'],
        acceptingPlayers: true
      }
    })
  })

  it('answers room-not-found for unknown codes', async () => {
    const { useCases } = createRoomKit()
    expect(await useCases.lookUpRoom.execute({ code: 'ZZZZZZ' })).toEqual({ ok: false, error: { code: 'room-not-found' } })
  })
})

describe('JoinRoom', () => {
  it('adds the player and publishes the lobby to everyone', async () => {
    const { createRoom, join, publisher } = createRoomKit()
    const { session } = await createRoom()
    const caro = await join(session.code, 'Caro')
    expect(caro.session.snapshot.members.map((member) => member.name)).toEqual(['Nico', 'Caro'])
    expect(publisher.latest?.members.map((member) => member.name)).toEqual(['Nico', 'Caro'])
  })

  it('never shares tokens in snapshots', async () => {
    const { createRoom, join, publisher } = createRoomKit()
    const { session } = await createRoom()
    const caro = await join(session.code, 'Caro')
    expect(JSON.stringify(publisher.snapshots)).not.toContain(caro.session.token)
    expect(JSON.stringify(publisher.snapshots)).not.toContain(session.token)
  })

  it('rejects a taken name with suggestions and publishes nothing', async () => {
    const { useCases, createRoom, join, publisher } = createRoomKit()
    const { session } = await createRoom()
    await join(session.code, 'Ana')
    const published = publisher.snapshots.length
    expect(await useCases.joinRoom.execute({ code: session.code, name: 'ana' })).toMatchObject({
      ok: false,
      error: { code: 'name-taken', suggestions: ['ana 2', 'ana B.', 'ana 3'] }
    })
    expect(publisher.snapshots).toHaveLength(published)
  })

  it('rejects joins after the game started', async () => {
    const { useCases, roomReadyToStart } = createRoomKit()
    const { code, narrator } = await roomReadyToStart(6)
    unwrap(await useCases.startGame.execute(narrator))
    expect(await useCases.joinRoom.execute({ code, name: 'Late' })).toEqual({
      ok: false,
      error: { code: 'game-already-started' }
    })
  })
})

describe('ResumeSession', () => {
  it('reconnects the seat after a dropped connection', async () => {
    const { useCases, createRoom, join } = createRoomKit()
    const { session } = await createRoom()
    const caro = await join(session.code, 'Caro')
    unwrap(await useCases.markDisconnected.execute(caro.actor))
    const resumed = unwrap(await useCases.resumeSession.execute({ code: session.code, token: caro.session.token }))
    expect(resumed.memberId).toBe(caro.session.memberId)
    expect(resumed.snapshot.members.find((member) => member.id === caro.session.memberId)?.connected).toBe(true)
  })

  it('rejects unknown codes and tokens as session-invalid', async () => {
    const { useCases, createRoom } = createRoomKit()
    const { session } = await createRoom()
    const invalid = { ok: false, error: { code: 'session-invalid' } }
    expect(await useCases.resumeSession.execute({ code: 'ZZZZZZ', token: session.token })).toEqual(invalid)
    expect(await useCases.resumeSession.execute({ code: session.code, token: 'stolen' })).toEqual(invalid)
  })
})

describe('Member commands', () => {
  it('publishes avatar and readiness changes', async () => {
    const { useCases, createRoom, join, publisher } = createRoomKit()
    const { session } = await createRoom()
    const caro = await join(session.code, 'Caro')
    unwrap(await useCases.chooseAvatar.execute(caro.actor, { avatar: 'caro' }))
    unwrap(await useCases.setReady.execute(caro.actor, { ready: true }))
    expect(publisher.latest?.members[1]).toMatchObject({ avatar: 'caro', ready: true })
  })

  it('rejects commands from members who are no longer in the room', async () => {
    const { useCases, createRoom, join } = createRoomKit()
    const { session, narrator } = await createRoom()
    const tato = await join(session.code, 'Tato')
    unwrap(await useCases.kickPlayer.execute(narrator, { memberId: tato.actor.memberId }))
    expect(await useCases.setReady.execute(tato.actor, { ready: true })).toEqual({
      ok: false,
      error: { code: 'session-invalid' }
    })
  })
})

describe('Narrator commands', () => {
  it('rejects settings changes from players', async () => {
    const { useCases, createRoom, join } = createRoomKit()
    const { session } = await createRoom()
    const ana = await join(session.code, 'Ana')
    expect(await useCases.updateSettings.execute(ana.actor, { settings: { timers: { day: 300 } } })).toEqual({
      ok: false,
      error: { code: 'not-narrator' }
    })
  })

  it('kicks a player and tells them', async () => {
    const { useCases, createRoom, join, publisher } = createRoomKit()
    const { session, narrator } = await createRoom()
    const tato = await join(session.code, 'Tato')
    unwrap(await useCases.kickPlayer.execute(narrator, { memberId: tato.actor.memberId }))
    expect(publisher.kicked).toEqual([{ code: 'LUNA42', memberId: tato.actor.memberId }])
    expect(publisher.latest?.members.map((member) => member.name)).toEqual(['Nico'])
  })

  it('closes the room when the narrator leaves', async () => {
    const { useCases, createRoom, join, publisher } = createRoomKit()
    const { session, narrator } = await createRoom()
    await join(session.code, 'Caro')
    unwrap(await useCases.leaveRoom.execute(narrator))
    expect(publisher.closed).toEqual(['LUNA42'])
    expect(await useCases.lookUpRoom.execute({ code: session.code })).toEqual({ ok: false, error: { code: 'room-not-found' } })
  })

  it('lets a player leave and frees the seat', async () => {
    const { useCases, createRoom, join, publisher } = createRoomKit()
    const { session } = await createRoom()
    const caro = await join(session.code, 'Caro')
    unwrap(await useCases.leaveRoom.execute(caro.actor))
    expect(publisher.latest?.members.map((member) => member.name)).toEqual(['Nico'])
  })

  it('starts the game when the conditions hold', async () => {
    const { useCases, roomReadyToStart, publisher } = createRoomKit()
    const { narrator } = await roomReadyToStart(6)
    expect(publisher.latest?.startReadiness.canStart).toBe(true)
    unwrap(await useCases.startGame.execute(narrator))
    expect(publisher.latest?.status).toBe('in-game')
  })

  it('hands the opening to the game starter after the room is saved', async () => {
    const { useCases, roomReadyToStart, starter, publisher } = createRoomKit()
    const { code, narrator, players } = await roomReadyToStart(6)
    unwrap(await useCases.startGame.execute(narrator))
    expect(publisher.latest?.status).toBe('in-game')
    expect(starter.openings).toEqual([
      {
        code,
        narratorId: narrator.memberId,
        playerIds: players.map((player) => player.actor.memberId),
        deck: { werewolf: 1, villager: 5, seer: 0, doctor: 0, witch: 0, hunter: 0, fool: 0, drunk: 0 },
        timers: { night: 60, day: 180, vote: 60 },
        revealRoleOnDeath: true,
        anonymousVotes: false
      }
    ])
  })

  it('does not open a match when the start is rejected', async () => {
    const { useCases, createRoom, starter } = createRoomKit()
    const { narrator } = await createRoom()
    await useCases.startGame.execute(narrator)
    expect(starter.openings).toEqual([])
  })

  it('rejects a player leaving during a game', async () => {
    const { useCases, roomReadyToStart } = createRoomKit()
    const { narrator, firstPlayer } = await roomReadyToStart(6)
    unwrap(await useCases.startGame.execute(narrator))
    expect(await useCases.leaveRoom.execute(firstPlayer.actor)).toEqual({
      ok: false,
      error: { code: 'game-already-started' }
    })
  })

  it('rejects starting with unmet conditions', async () => {
    const { useCases, createRoom } = createRoomKit()
    const { narrator } = await createRoom()
    expect(await useCases.startGame.execute(narrator)).toEqual({
      ok: false,
      error: { code: 'start-conditions-unmet', unmet: ['not-enough-players', 'deck-mismatch'] }
    })
  })
})
