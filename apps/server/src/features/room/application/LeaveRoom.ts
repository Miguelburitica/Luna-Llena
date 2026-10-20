import { done, type Result, type RoomError } from '@luna/contracts'
import type { Actor } from './ports'
import { closeRoom, findActorRoom, saveAndPublish, type RoomAccess } from './roomAccess'

export class LeaveRoom {
  constructor(private readonly access: RoomAccess) {}

  async execute(actor: Actor): Promise<Result<void, RoomError>> {
    const room = await findActorRoom(this.access.rooms, actor)
    if (!room.ok) return room
    const departure = room.value.leave(actor.memberId)
    if (!departure.ok) return departure
    if (departure.value === 'room-closed') {
      await closeRoom(this.access, room.value)
      return done
    }
    await saveAndPublish(this.access, room.value)
    return done
  }
}
