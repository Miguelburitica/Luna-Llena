import type { Result, RoomError } from '@luna/contracts'
import type { Actor } from './ports'
import { changeRoomAs, type RoomAccess } from './roomAccess'

export class StartGame {
  constructor(private readonly access: RoomAccess) {}

  execute(actor: Actor): Promise<Result<void, RoomError>> {
    return changeRoomAs(this.access, actor, (room) => room.start(actor.memberId))
  }
}
