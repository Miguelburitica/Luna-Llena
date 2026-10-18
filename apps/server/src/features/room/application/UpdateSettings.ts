import type { Result, RoomError } from '@luna/contracts'
import type { Actor } from './ports'
import { changeRoomAs, type RoomAccess } from './roomAccess'

export class UpdateSettings {
  constructor(private readonly access: RoomAccess) {}

  execute(actor: Actor, input: { readonly settings?: unknown }): Promise<Result<void, RoomError>> {
    return changeRoomAs(this.access, actor, (room) => room.updateSettings(actor.memberId, input.settings))
  }
}
