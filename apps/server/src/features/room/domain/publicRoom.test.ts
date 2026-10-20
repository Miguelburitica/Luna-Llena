import { ROOM_LIMITS } from '@luna/contracts'
import { describe, expect, it } from 'vitest'
import { DisplayName } from './DisplayName'
import { publicListingOf } from './publicListing'
import { Room } from './Room'
import { RoomCode } from './RoomCode'
import { RoomName } from './RoomName'
import { RoomSettings } from './RoomSettings'
import { FRIENDS, identityOf, openRoom, readyRoomOf, roomWith, SEAT_BOT, unwrap } from './Room.fixtures'

const MINUTE = 60_000

const deviceOf = (name: string, device: string) => ({ ...identityOf(name), client: { address: '10.0.0.1', device } })

const publicRoomNamed = (code: string, players: number) => {
  const room = Room.open({
    code: unwrap(RoomCode.parse(code)),
    name: unwrap(RoomName.create(`Sala ${code}`, 'public')),
    settings: RoomSettings.defaults(),
    visibility: 'public',
    narrator: identityOf('Nico')
  })
  for (let seat = 0; seat < players; seat += 1) unwrap(room.join(identityOf(`P${seat}`)))
  return room
}

describe('Room visibility', () => {
  it('is private by default', () => {
    const room = openRoom()
    expect(room.visibility).toBe('private')
    expect(room.isListed).toBe(false)
  })

  it('lists a public room while its narrator is connected', () => {
    const room = openRoom(undefined, 'public')
    expect(room.isListed).toBe(true)
    room.disconnect('id-Nico', 0)
    expect(room.isListed).toBe(false)
  })
})

describe('Clean names', () => {
  it('drops invisible characters before checking a name', () => {
    const room = roomWith(['Caro'])
    expect(unwrap(DisplayName.create('Ca​ro')).value).toBe('Caro')
    expect(room.join(identityOf('Ca​ro'))).toMatchObject({ ok: false, error: { code: 'name-taken' } })
  })

  it('rejects a name made only of invisible characters', () => {
    expect(DisplayName.create('​​')).toEqual({ ok: false, error: { code: 'name-invalid' } })
  })

  it('rejects a link in a public room name', () => {
    expect(RoomName.create('Free coins at www.spam.example', 'public')).toEqual({
      ok: false,
      error: { code: 'room-name-invalid' }
    })
  })

  it('accepts a link in a private room name', () => {
    expect(RoomName.create('Notas en www.example.com', 'private').ok).toBe(true)
  })
})

describe('Kicks', () => {
  it('lets a player kicked from a private room join again', () => {
    const room = openRoom()
    unwrap(room.join(deviceOf('Tato', 'device-tato')))
    unwrap(room.kick('id-Nico', 'id-Tato', SEAT_BOT))
    expect(room.join(deviceOf('Tato', 'device-tato')).ok).toBe(true)
  })

  it('bars the device of a player kicked from a public room', () => {
    const room = openRoom(undefined, 'public')
    unwrap(room.join(deviceOf('Tato', 'device-tato')))
    unwrap(room.kick('id-Nico', 'id-Tato', SEAT_BOT))
    expect(room.join(deviceOf('Tito', 'device-tato'))).toEqual({ ok: false, error: { code: 'kicked' } })
    expect(room.join(deviceOf('Tato', 'device-other')).ok).toBe(true)
  })

  it('hands the seat of a player kicked mid-game to a bot', () => {
    const room = readyRoomOf(6)
    unwrap(room.start('id-Nico'))
    const kick = unwrap(room.kick('id-Nico', 'id-Ana', SEAT_BOT))
    expect(kick.takeover).toEqual({ formerName: 'Ana', botName: 'Aureliano' })
    const seat = room.memberWithId('id-Ana')
    expect(seat?.isBot).toBe(true)
    expect(seat?.name.value).toBe('Aureliano')
    expect(seat?.holdsToken('token-Ana')).toBe(false)
    expect(room.players).toHaveLength(6)
    expect(room.botCast).toBe('solitude')
  })

  it('rejects kicking a bot mid-game', () => {
    const room = readyRoomOf(6)
    unwrap(room.start('id-Nico'))
    unwrap(room.kick('id-Nico', 'id-Ana', SEAT_BOT))
    expect(room.kick('id-Nico', 'id-Ana', SEAT_BOT)).toEqual({ ok: false, error: { code: 'not-a-player' } })
  })
})

describe('Muting', () => {
  it('lets the narrator mute and unmute a player at any time', () => {
    const room = readyRoomOf(6)
    unwrap(room.start('id-Nico'))
    unwrap(room.mute('id-Nico', 'id-Caro', true))
    expect(room.isMuted('id-Caro')).toBe(true)
    unwrap(room.mute('id-Nico', 'id-Caro', false))
    expect(room.isMuted('id-Caro')).toBe(false)
  })

  it('rejects mutes from players and of the narrator', () => {
    const room = roomWith(['Caro', 'Tato'])
    expect(room.mute('id-Caro', 'id-Tato', true)).toEqual({ ok: false, error: { code: 'not-narrator' } })
    expect(room.mute('id-Nico', 'id-Nico', true)).toEqual({ ok: false, error: { code: 'member-not-found' } })
  })
})

describe('Reports', () => {
  it('counts one report per address and hides the room at three', () => {
    const room = openRoom(undefined, 'public')
    expect(unwrap(room.report('1.1.1.1'))).toBe(false)
    expect(unwrap(room.report('1.1.1.1'))).toBe(false)
    expect(room.reportCount).toBe(1)
    unwrap(room.report('2.2.2.2'))
    expect(unwrap(room.report('3.3.3.3'))).toBe(true)
    expect(room.isListed).toBe(false)
  })

  it('rejects reports of a private room', () => {
    expect(openRoom().report('1.1.1.1')).toEqual({ ok: false, error: { code: 'room-not-public' } })
  })
})

describe('Public listing', () => {
  it('marks a full room as full and not joinable', () => {
    const [card] = publicListingOf([publicRoomNamed('FULLRM', ROOM_LIMITS.maxPlayers)])
    expect(card).toMatchObject({ status: 'full', joinable: false, playerCount: 15 })
  })

  it('puts joinable rooms first, then fuller ones, then newer ones', () => {
    const full = publicRoomNamed('FULLRM', ROOM_LIMITS.maxPlayers)
    const small = publicRoomNamed('SMALLR', 2)
    const newerSmall = publicRoomNamed('NEWERR', 2)
    const bigger = publicRoomNamed('BGGRRR', 4)
    const codes = publicListingOf([full, small, bigger, newerSmall]).map((card) => card.code)
    expect(codes).toEqual(['BGGRRR', 'NEWERR', 'SMALLR', 'FULLRM'])
  })

  it('shows a running game as in progress', () => {
    const room = publicRoomNamed('RUNNNN', 0)
    const names = FRIENDS.slice(0, 6)
    for (const name of names) unwrap(room.join(identityOf(name)))
    unwrap(room.updateSettings('id-Nico', { deck: { werewolf: 1, seer: 0, doctor: 0, witch: 0, hunter: 0, fool: 0, drunk: 0, villager: 11 } }))
    unwrap(room.updateSettings('id-Nico', { deck: { villager: 5 } }))
    for (const name of names) unwrap(room.setReady(`id-${name}`, true))
    unwrap(room.start('id-Nico'))
    expect(publicListingOf([room])[0]).toMatchObject({ status: 'in-progress', joinable: false })
  })
})

describe('Cleanup', () => {
  it('abandons a room whose narrator stays away for 10 minutes', () => {
    const room = roomWith(['Caro'])
    room.disconnect('id-Nico', 0)
    expect(room.abandonment(9 * MINUTE)).toBeNull()
    expect(room.abandonment(10 * MINUTE)).toBe('narrator-gone')
  })

  it('keeps a room whose narrator comes back in time', () => {
    const room = roomWith(['Caro'])
    room.disconnect('id-Nico', 0)
    unwrap(room.resume('token-Nico'))
    expect(room.abandonment(11 * MINUTE)).toBeNull()
  })

  it('abandons a lobby with no change for 60 minutes', () => {
    const room = roomWith(['Caro'])
    room.touch(0)
    expect(room.abandonment(59 * MINUTE)).toBeNull()
    room.touch(30 * MINUTE)
    expect(room.abandonment(89 * MINUTE)).toBeNull()
    expect(room.abandonment(90 * MINUTE)).toBe('idle-lobby')
  })

  it('abandons a room where only bots stay connected for 5 minutes', () => {
    const room = readyRoomOf(6)
    unwrap(room.start('id-Nico'))
    room.touch(0)
    for (const name of FRIENDS.slice(0, 6)) room.disconnect(`id-${name}`, 0)
    expect(room.abandonment(MINUTE)).toBeNull()
    room.disconnect('id-Nico', MINUTE)
    expect(room.abandonment(5 * MINUTE)).toBeNull()
    expect(room.abandonment(6 * MINUTE)).toBe('no-humans')
  })
})
