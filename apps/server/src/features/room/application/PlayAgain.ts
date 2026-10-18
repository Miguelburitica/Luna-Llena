import { done, err, roomError, type Result, type RoomError } from '@luna/contracts'
import type { Actor, GameStarter } from './ports'
import { findActorRoom, saveAndPublish, type RoomAccess } from './roomAccess'

export class PlayAgain {
  constructor(
    private readonly access: RoomAccess,
    private readonly starter: GameStarter
  ) {}

  async execute(actor: Actor): Promise<Result<void, RoomError>> {
    const room = await findActorRoom(this.access.rooms, actor)
    if (!room.ok) return room
    const permitted = room.value.permitReplay(actor.memberId)
    if (!permitted.ok) return permitted
    if (!(await this.starter.isOver(actor.code))) return err(roomError('game-not-over'))
    room.value.reopen()
    await saveAndPublish(this.access, room.value)
    await this.starter.discard(actor.code)
    return done
  }
}
