import { done, type Result, type RoomError } from '@luna/contracts'
import type { Actor } from './ports'
import { changeRoomAs, type RoomAccess } from './roomAccess'

export class MarkDisconnected {
  constructor(private readonly access: RoomAccess) {}

  execute(actor: Actor): Promise<Result<void, RoomError>> {
    return changeRoomAs(this.access, actor, (room) => {
      room.disconnect(actor.memberId)
      return done
    })
  }
}
