import type { Result, RoomError } from '@luna/contracts'
import type { Actor } from './ports'
import { changeRoomAs, type RoomAccess } from './roomAccess'

export class SetReady {
  constructor(private readonly access: RoomAccess) {}

  execute(actor: Actor, input: { readonly ready?: unknown }): Promise<Result<void, RoomError>> {
    return changeRoomAs(this.access, actor, (room) => room.setReady(actor.memberId, input.ready))
  }
}
