import { done, err, ok, roomError, type Result, type RoomError } from '@luna/contracts'
import type { Room } from '../domain/Room'
import { RoomCode } from '../domain/RoomCode'
import type { Actor, RoomPublisher, RoomRepository } from './ports'
import { toRoomSnapshot } from './roomViews'

export interface RoomAccess {
  readonly rooms: RoomRepository
  readonly publisher: RoomPublisher
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

export const saveAndPublish = async ({ rooms, publisher }: RoomAccess, room: Room): Promise<void> => {
  await rooms.save(room)
  publisher.publish(toRoomSnapshot(room))
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
