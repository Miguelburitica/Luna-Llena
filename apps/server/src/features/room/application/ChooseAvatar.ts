import type { Result, RoomError } from '@luna/contracts'
import type { Actor } from './ports'
import { changeRoomAs, type RoomAccess } from './roomAccess'

export class ChooseAvatar {
  constructor(private readonly access: RoomAccess) {}

  execute(actor: Actor, input: { readonly avatar?: unknown }): Promise<Result<void, RoomError>> {
    return changeRoomAs(this.access, actor, (room) => room.chooseAvatar(actor.memberId, input.avatar ?? null))
  }
}
