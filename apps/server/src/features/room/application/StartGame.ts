import { done, type Result, type RoomError } from '@luna/contracts'
import type { Room } from '../domain/Room'
import type { Actor, GameOpening, GameStarter } from './ports'
import { findActorRoom, saveAndPublish, type RoomAccess } from './roomAccess'

const openingOf = (room: Room): GameOpening => ({
  code: room.code.value,
  narratorId: room.narrator.id,
  playerIds: room.players.map((player) => player.id),
  deck: room.settings.deck,
  timers: room.settings.timers,
  revealRoleOnDeath: room.settings.houseRules.revealRoleOnDeath,
  anonymousVotes: room.settings.houseRules.anonymousVotes,
  lastWords: room.settings.houseRules.lastWords,
  ghostPowers: room.settings.houseRules.ghostPowers
})

export class StartGame {
  constructor(
    private readonly access: RoomAccess,
    private readonly starter: GameStarter
  ) {}

  async execute(actor: Actor): Promise<Result<void, RoomError>> {
    const room = await findActorRoom(this.access.rooms, actor)
    if (!room.ok) return room
    const started = room.value.start(actor.memberId)
    if (!started.ok) return started
    await saveAndPublish(this.access, room.value)
    await this.starter.start(openingOf(room.value))
    return done
  }
}
