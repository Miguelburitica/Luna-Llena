import { ROLE_IDS, type Result } from '@luna/contracts'
import { DisplayName } from './DisplayName'
import type { MemberIdentity } from './Member'
import { Room } from './Room'
import { RoomCode } from './RoomCode'
import { RoomName } from './RoomName'
import { RoomSettings } from './RoomSettings'

export const FRIENDS = ['Ana', 'Juan', 'Marta', 'Luis', 'Sofi', 'Caro', 'Tato', 'Pipe', 'Vale'] as const

export const unwrap = <T>(result: Result<T, unknown>): T => {
  if (!result.ok) throw new Error(`Expected success, got ${JSON.stringify(result.error)}`)
  return result.value
}

export const identityOf = (name: string): MemberIdentity => ({
  id: `id-${name}`,
  token: `token-${name}`,
  name: unwrap(DisplayName.create(name))
})

export const settingsWithDeckOf = (cards: number): RoomSettings =>
  unwrap(
    RoomSettings.defaults().apply({
      deck: { ...Object.fromEntries(ROLE_IDS.map((role) => [role, 0])), villager: cards }
    })
  )

export const openRoom = (settings: RoomSettings = RoomSettings.defaults()): Room =>
  Room.open({
    code: unwrap(RoomCode.parse('LUNA42')),
    name: unwrap(RoomName.create('Los Primos · Viernes')),
    settings,
    narrator: identityOf('Nico')
  })

export const roomWith = (playerNames: readonly string[], settings?: RoomSettings): Room => {
  const room = openRoom(settings)
  for (const name of playerNames) unwrap(room.join(identityOf(name)))
  return room
}

export const readyRoomOf = (playerCount: number): Room => {
  const names = FRIENDS.slice(0, playerCount)
  const room = roomWith(names, settingsWithDeckOf(playerCount))
  for (const name of names) unwrap(room.setReady(`id-${name}`, true))
  return room
}
