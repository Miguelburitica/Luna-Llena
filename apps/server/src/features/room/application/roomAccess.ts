import { done, err, ok, roomError, type Result, type RoomError } from '@luna/contracts'
import type { Clock } from '../../../shared/application/Clock'
import type { ClientIdentity } from '../../../shared/domain/ClientIdentity'
import type { Room } from '../domain/Room'
import { RoomCode } from '../domain/RoomCode'
import type { Actor, ContentGate, GameStarter, LobbyNotifier, ReviewedName, RoomPublisher, RoomRepository } from './ports'
import { toRoomSnapshot } from './roomViews'

export interface RoomAccess {
  readonly rooms: RoomRepository
  readonly publisher: RoomPublisher
  readonly lobby: LobbyNotifier
  readonly clock: Clock
  readonly starter: GameStarter
  readonly gate: ContentGate
}

export const findRoom = async (rooms: RoomRepository, rawCode: unknown): Promise<Result<Room, RoomError>> => {
  const code = RoomCode.parse(rawCode)
  if (!code.ok) return code
  const room = await rooms.find(code.value)
  return room === undefined ? err(roomError('room-not-found')) : ok(room)
}

export const findActorRoom = async (rooms: RoomRepository, actor: Actor): Promise<Result<Room, RoomError>> => {
  const room = await findRoom(rooms, actor.code)
  if (!room.ok) return err(roomError('session-invalid'))
  return room.value.memberWithId(actor.memberId) === undefined ? err(roomError('session-invalid')) : room
}

export const saveAndPublish = async ({ rooms, publisher, lobby, clock }: RoomAccess, room: Room): Promise<void> => {
  room.touch(clock.now())
  await rooms.save(room)
  publisher.publish(toRoomSnapshot(room))
  if (room.isPublic) lobby.changed()
}

export const changeRoomAs = async (
  access: RoomAccess,
  actor: Actor,
  change: (room: Room) => Result<unknown, RoomError>
): Promise<Result<void, RoomError>> => {
  const room = await findActorRoom(access.rooms, actor)
  if (!room.ok) return room
  const outcome = change(room.value)
  if (!outcome.ok) return outcome
  await saveAndPublish(access, room.value)
  return done
}

export const closeRoom = async ({ rooms, publisher, lobby, starter }: RoomAccess, room: Room): Promise<void> => {
  await rooms.remove(room.code)
  publisher.notifyClosed(room.code.value)
  await starter.discard(room.code.value)
  if (room.isPublic) lobby.changed()
}

export const requireNotBanned = async (gate: ContentGate, client: ClientIdentity): Promise<Result<void, RoomError>> => {
  const until = await gate.bannedUntil(client)
  return until === null ? done : err({ code: 'banned', until })
}

export const reviewPublicName = async (
  gate: ContentGate,
  input: { readonly roomCode: string; readonly text: string; readonly kind: ReviewedName; readonly client: ClientIdentity }
): Promise<Result<void, RoomError>> => {
  const outcome = await gate.review(input.roomCode, input.text, input.kind)
  if (outcome === null || outcome === 'ok') return done
  await gate.strike({ client: input.client, reason: 'name-blocked', roomCode: input.roomCode, excerpt: input.text })
  return err(roomError(input.kind === 'name' ? 'name-blocked' : 'room-name-blocked'))
}
