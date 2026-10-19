import type { Result, RoomError } from '@luna/contracts'
import type { Actor } from './ports'
import { changeRoomAs, type RoomAccess } from './roomAccess'

export class RemoveBot {
  constructor(private readonly access: RoomAccess) {}

  execute(actor: Actor, input: { readonly memberId?: unknown }): Promise<Result<void, RoomError>> {
    return changeRoomAs(this.access, actor, (room) => room.removeBot(actor.memberId, input.memberId))
  }
}
