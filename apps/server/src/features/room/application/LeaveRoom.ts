import { done, type Result, type RoomError } from '@luna/contracts'
import type { Actor } from './ports'
import { findActorRoom, saveAndPublish, type RoomAccess } from './roomAccess'

export class LeaveRoom {
  constructor(private readonly access: RoomAccess) {}

  async execute(actor: Actor): Promise<Result<void, RoomError>> {
    const room = await findActorRoom(this.access.rooms, actor)
    if (!room.ok) return room
    const departure = room.value.leave(actor.memberId)
    if (!departure.ok) return departure
    if (departure.value === 'room-closed') {
      await this.access.rooms.remove(room.value.code)
      this.access.publisher.notifyClosed(room.value.code.value)
      return done
    }
    await saveAndPublish(this.access, room.value)
    return done
  }
}
