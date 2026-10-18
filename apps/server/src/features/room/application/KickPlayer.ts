import type { Result, RoomError } from '@luna/contracts'
import type { Actor } from './ports'
import { changeRoomAs, type RoomAccess } from './roomAccess'

export class KickPlayer {
  constructor(private readonly access: RoomAccess) {}

  async execute(actor: Actor, input: { readonly memberId?: unknown }): Promise<Result<void, RoomError>> {
    const outcome = await changeRoomAs(this.access, actor, (room) => room.kick(actor.memberId, input.memberId))
    if (outcome.ok) this.access.publisher.notifyKicked(actor.code, String(input.memberId))
    return outcome
  }
}
