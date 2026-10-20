import { describe, expect, it } from 'vitest'
import { surprisePersonalityOf, surpriseWeightsOf } from './botPersonality'
import { FRIENDS, identityOf, openRoom, readyRoomOf, roomWith, SEAT_BOT, settingsWithDeckOf, unwrap } from './Room.fixtures'

describe('Room opening', () => {
  it('makes the creator the only member and the narrator', () => {
    const room = openRoom()
    expect(room.members).toHaveLength(1)
    expect(room.narrator.name.value).toBe('Nico')
    expect(room.narrator.isNarrator).toBe(true)
    expect(room.status).toBe('lobby')
  })
})

describe('Joining', () => {
  it('adds a player who is not ready and has no avatar', () => {
    const room = openRoom()
    const caro = unwrap(room.join(identityOf('Caro')))
    expect(caro.isNarrator).toBe(false)
    expect(caro.ready).toBe(false)
    expect(caro.avatar).toBeNull()
    expect(room.players).toEqual([caro])
  })

  it('rejects a name already in the room ignoring case, with free suggestions', () => {
    const room = roomWith(['Ana', 'Ana 2'])
    expect(room.join(identityOf('ana'))).toEqual({
      ok: false,
      error: { code: 'name-taken', suggestions: ['ana B.', 'ana 3', 'ana Jr.'] }
    })
  })

  it('treats the narrator name as taken', () => {
    expect(openRoom().join(identityOf('NICO'))).toMatchObject({ ok: false, error: { code: 'name-taken' } })
  })

  it('keeps suggestions within the name length limit', () => {
    const longName = 'Bartolomé Rodríguez1'
    const room = roomWith([longName])
    const result = room.join(identityOf(longName))
    expect(result.ok).toBe(false)
    if (!result.ok && result.error.code === 'name-taken') {
      expect(result.error.suggestions.every((name) => name.length <= 20)).toBe(true)
      expect(result.error.suggestions).toHaveLength(3)
    }
  })

  it('rejects joining a room with 15 players', () => {
    const fifteen = Array.from({ length: 15 }, (_, index) => `Player ${index + 1}`)
    expect(roomWith(fifteen).join(identityOf('Late'))).toEqual({ ok: false, error: { code: 'room-full' } })
  })

  it('rejects joining once the game started', () => {
    const room = readyRoomOf(6)
    unwrap(room.start('id-Nico'))
    expect(room.join(identityOf('Late'))).toEqual({ ok: false, error: { code: 'game-already-started' } })
  })
})

describe('Resuming', () => {
  it('reconnects the seat holding the token and keeps avatar and readiness', () => {
    const room = roomWith(['Caro'])
    unwrap(room.chooseAvatar('id-Caro', 'caro'))
    unwrap(room.setReady('id-Caro', true))
    room.disconnect('id-Caro')
    const caro = unwrap(room.resume('token-Caro'))
    expect(caro).toMatchObject({ connected: true, ready: true, avatar: 'caro' })
  })

  it('rejects an unknown token', () => {
    expect(openRoom().resume('nope')).toEqual({ ok: false, error: { code: 'session-invalid' } })
  })

  it('rejects the token of a kicked player', () => {
    const room = roomWith(['Tato'])
    unwrap(room.kick('id-Nico', 'id-Tato', SEAT_BOT))
    expect(room.resume('token-Tato')).toEqual({ ok: false, error: { code: 'session-invalid' } })
  })
})

describe('Avatars', () => {
  it('lets a member pick a free avatar and change it', () => {
    const room = roomWith(['Caro'])
    unwrap(room.chooseAvatar('id-Caro', 'caro'))
    unwrap(room.chooseAvatar('id-Caro', 'vale'))
    expect(room.avatarsInUse).toEqual(['vale'])
  })

  it('lets the narrator pick an avatar too', () => {
    const room = openRoom()
    unwrap(room.chooseAvatar('id-Nico', 'nico'))
    expect(room.narrator.avatar).toBe('nico')
  })

  it('rejects an avatar held by someone else', () => {
    const room = roomWith(['Ana', 'Caro'])
    unwrap(room.chooseAvatar('id-Ana', 'ana'))
    expect(room.chooseAvatar('id-Caro', 'ana')).toEqual({ ok: false, error: { code: 'avatar-taken' } })
  })

  it('lets a member re-pick the avatar they already hold or drop it', () => {
    const room = roomWith(['Ana'])
    unwrap(room.chooseAvatar('id-Ana', 'ana'))
    unwrap(room.chooseAvatar('id-Ana', 'ana'))
    unwrap(room.chooseAvatar('id-Ana', null))
    expect(room.avatarsInUse).toEqual([])
  })

  it('rejects an avatar outside the offered set', () => {
    expect(roomWith(['Ana']).chooseAvatar('id-Ana', 'dracula')).toEqual({ ok: false, error: { code: 'avatar-taken' } })
  })
})

describe('Readiness and presence', () => {
  it('marks a player ready', () => {
    const room = roomWith(['Caro'])
    unwrap(room.setReady('id-Caro', true))
    expect(room.memberWithId('id-Caro')?.ready).toBe(true)
  })

  it('gives the narrator no readiness', () => {
    expect(openRoom().setReady('id-Nico', true)).toEqual({ ok: false, error: { code: 'not-a-player' } })
  })

  it('keeps the seat of a disconnected member', () => {
    const room = roomWith(['Tato'])
    room.disconnect('id-Tato')
    expect(room.memberWithId('id-Tato')?.connected).toBe(false)
  })
})

describe('Leaving and kicking', () => {
  it('frees the seat and the name when a player leaves', () => {
    const room = roomWith(['Caro'])
    expect(room.leave('id-Caro')).toEqual({ ok: true, value: 'player-left' })
    expect(room.players).toEqual([])
    expect(room.join(identityOf('Caro')).ok).toBe(true)
  })

  it('keeps the seat when a player leaves during a game', () => {
    const room = readyRoomOf(6)
    unwrap(room.start('id-Nico'))
    expect(room.leave('id-Ana')).toEqual({ ok: false, error: { code: 'game-already-started' } })
    expect(room.players).toHaveLength(6)
  })

  it('closes the room when the narrator leaves', () => {
    expect(roomWith(['Caro']).leave('id-Nico')).toEqual({ ok: true, value: 'room-closed' })
  })

  it('lets the narrator kick a player', () => {
    const room = roomWith(['Tato'])
    expect(unwrap(room.kick('id-Nico', 'id-Tato', SEAT_BOT)).member.name.value).toBe('Tato')
    expect(room.players).toEqual([])
  })

  it('rejects kicks from players and kicks of the narrator', () => {
    const room = roomWith(['Ana', 'Tato'])
    expect(room.kick('id-Ana', 'id-Tato', SEAT_BOT)).toEqual({ ok: false, error: { code: 'not-narrator' } })
    expect(room.kick('id-Nico', 'id-Nico', SEAT_BOT)).toEqual({ ok: false, error: { code: 'member-not-found' } })
  })
})

describe('Settings authority', () => {
  it('lets the narrator update settings', () => {
    const room = openRoom()
    unwrap(room.updateSettings('id-Nico', { timers: { day: 300 } }))
    expect(room.settings.timers.day).toBe(300)
  })

  it('rejects settings changes from players', () => {
    const room = roomWith(['Ana'])
    expect(room.updateSettings('id-Ana', { timers: { day: 300 } })).toEqual({ ok: false, error: { code: 'not-narrator' } })
  })

  it('keeps settings unchanged when the update is invalid', () => {
    const room = openRoom()
    expect(room.updateSettings('id-Nico', { timers: { vote: 45 } }).ok).toBe(false)
    expect(room.settings.timers.vote).toBe(60)
  })
})

describe('Start conditions', () => {
  it('can start with 7 ready, connected players and a 7-card deck', () => {
    expect(readyRoomOf(7).startReadiness).toEqual({
      canStart: true,
      unmet: [],
      notReadyMemberIds: [],
      playerCount: 7,
      deckSize: 7
    })
  })

  it('reports a deck mismatch', () => {
    const room = readyRoomOf(7)
    unwrap(room.updateSettings('id-Nico', { deck: { villager: 8 } }))
    expect(room.startReadiness.unmet).toEqual(['deck-mismatch'])
  })

  it('names the players who are not ready or disconnected', () => {
    const room = readyRoomOf(7)
    unwrap(room.setReady('id-Marta', false))
    room.disconnect('id-Tato')
    expect(room.startReadiness.unmet).toEqual(['players-not-ready'])
    expect(room.startReadiness.notReadyMemberIds).toEqual(['id-Marta', 'id-Tato'])
  })

  it('needs at least 6 players', () => {
    const room = readyRoomOf(5)
    expect(room.startReadiness.unmet).toEqual(['not-enough-players'])
  })

  it('reports a deck without wolves', () => {
    const room = readyRoomOf(7)
    unwrap(room.updateSettings('id-Nico', { deck: { werewolf: 0, villager: 7 } }))
    expect(room.startReadiness.unmet).toEqual(['no-wolves'])
  })

  it('lists unmet conditions in the contract order', () => {
    const room = roomWith(FRIENDS.slice(0, 5), settingsWithDeckOf(6))
    unwrap(room.updateSettings('id-Nico', { deck: { werewolf: 0, villager: 7 } }))
    expect(room.startReadiness.unmet).toEqual(['not-enough-players', 'deck-mismatch', 'no-wolves', 'players-not-ready'])
  })

  it('does not count the narrator as a player', () => {
    const room = roomWith(FRIENDS.slice(0, 5), settingsWithDeckOf(6))
    expect(room.startReadiness.playerCount).toBe(5)
  })
})

describe('Starting the game', () => {
  it('moves the room to in-game', () => {
    const room = readyRoomOf(6)
    unwrap(room.start('id-Nico'))
    expect(room.status).toBe('in-game')
    expect(room.isAcceptingPlayers).toBe(false)
  })

  it('rejects starting with unmet conditions and stays in the lobby', () => {
    const room = readyRoomOf(7)
    unwrap(room.updateSettings('id-Nico', { deck: { villager: 8 } }))
    expect(room.start('id-Nico')).toEqual({ ok: false, error: { code: 'start-conditions-unmet', unmet: ['deck-mismatch'] } })
    expect(room.status).toBe('lobby')
  })

  it('rejects a player starting the game', () => {
    expect(readyRoomOf(6).start('id-Ana')).toEqual({ ok: false, error: { code: 'not-narrator' } })
  })

  it('locks settings once the game started', () => {
    const room = readyRoomOf(6)
    unwrap(room.start('id-Nico'))
    expect(room.updateSettings('id-Nico', { timers: { day: 300 } })).toEqual({
      ok: false,
      error: { code: 'game-already-started' }
    })
  })
})

describe('Voice call', () => {
  it('has no link unless opened with one', () => {
    expect(openRoom().voiceCall).toBeNull()
  })

  it('lets the narrator set and remove the link in any status', () => {
    const room = readyRoomOf(6)
    unwrap(room.setVoiceCall('id-Nico', 'https://discord.gg/abc123'))
    unwrap(room.start('id-Nico'))
    unwrap(room.setVoiceCall('id-Nico', 'https://meet.jit.si/Luna'))
    expect(room.voiceCall?.value).toBe('https://meet.jit.si/Luna')
    unwrap(room.setVoiceCall('id-Nico', null))
    expect(room.voiceCall).toBeNull()
  })

  it('rejects players and strangers', () => {
    const room = roomWith(['Caro'])
    expect(room.setVoiceCall('id-Caro', 'https://discord.gg/abc123')).toEqual({ ok: false, error: { code: 'not-narrator' } })
    expect(room.setVoiceCall('ghost', 'https://discord.gg/abc123')).toEqual({ ok: false, error: { code: 'session-invalid' } })
  })

  it('keeps the previous link when the new one is invalid', () => {
    const room = openRoom()
    unwrap(room.setVoiceCall('id-Nico', 'https://discord.gg/abc123'))
    expect(room.setVoiceCall('id-Nico', 'nope')).toEqual({ ok: false, error: { code: 'voice-call-invalid' } })
    expect(room.voiceCall?.value).toBe('https://discord.gg/abc123')
  })

  it('keeps the link after reopening', () => {
    const room = readyRoomOf(6)
    unwrap(room.setVoiceCall('id-Nico', 'https://discord.gg/abc123'))
    unwrap(room.start('id-Nico'))
    room.reopen()
    expect(room.voiceCall?.value).toBe('https://discord.gg/abc123')
  })
})

describe('Reopening after a game', () => {
  it('goes back to the lobby keeping members and clearing readiness', () => {
    const room = readyRoomOf(6)
    unwrap(room.start('id-Nico'))
    unwrap(room.permitReplay('id-Nico'))
    room.reopen()
    expect(room.status).toBe('lobby')
    expect(room.isAcceptingPlayers).toBe(true)
    expect(room.players.map((player) => player.name.value)).toEqual(['Ana', 'Juan', 'Marta', 'Luis', 'Sofi', 'Caro'])
    expect(room.players.every((player) => !player.ready)).toBe(true)
  })

  it('permits a replay only for the narrator of a game in progress', () => {
    const room = readyRoomOf(6)
    expect(room.permitReplay('id-Nico')).toEqual({ ok: false, error: { code: 'game-not-over' } })
    unwrap(room.start('id-Nico'))
    expect(room.permitReplay('id-Ana')).toEqual({ ok: false, error: { code: 'not-narrator' } })
    expect(room.permitReplay('ghost')).toEqual({ ok: false, error: { code: 'session-invalid' } })
  })
})

describe('Surprise me', () => {
  it('makes every other personality four times as likely as one already at the table', () => {
    const weights = new Map(surpriseWeightsOf(['paranoid']))
    for (const personality of ['follower', 'detective', 'chaos'] as const) {
      expect((weights.get(personality) ?? 0) / (weights.get('paranoid') ?? 1)).toBe(4)
    }
    expect(weights.get('quiet')).toBe(0.6)
  })

  it('walks the weights with the roll', () => {
    expect(surprisePersonalityOf([], 0)).toBe('paranoid')
    expect(surprisePersonalityOf(['paranoid'], 0.1)).toBe('follower')
    expect(surprisePersonalityOf([], 0.999)).toBe('quiet')
  })
})
