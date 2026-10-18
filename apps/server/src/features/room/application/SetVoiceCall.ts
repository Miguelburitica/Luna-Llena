import type { Result, RoomError } from '@luna/contracts'
import type { Actor } from './ports'
import { changeRoomAs, type RoomAccess } from './roomAccess'

export class SetVoiceCall {
  constructor(private readonly access: RoomAccess) {}

  execute(actor: Actor, input: { readonly url?: unknown }): Promise<Result<void, RoomError>> {
    return changeRoomAs(this.access, actor, (room) => room.setVoiceCall(actor.memberId, input.url))
  }
}
