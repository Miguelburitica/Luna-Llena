import { BOT_CAST_IDS, BOT_DIFFICULTIES, BOT_PERSONALITIES, err, roomError, type BotProfile, type Result, type RoomError } from '@luna/contracts'
import type { IdGenerator } from '../../../shared/application/IdGenerator'
import type { RandomSource } from '../../../shared/application/RandomSource'
import { surprisePersonalityOf } from '../domain/botPersonality'
import type { Actor } from './ports'
import { changeRoomAs, type RoomAccess } from './roomAccess'

const includes = <T>(allowed: readonly T[], value: unknown): value is T => allowed.includes(value as T)

export class AddBot {
  constructor(
    private readonly access: RoomAccess,
    private readonly ids: IdGenerator,
    private readonly random: RandomSource
  ) {}

  execute(
    actor: Actor,
    input: { readonly personality?: unknown; readonly difficulty?: unknown }
  ): Promise<Result<void, RoomError>> {
    const chosen = input.personality
    const difficulty = input.difficulty ?? 'normal'
    if ((chosen !== undefined && !includes(BOT_PERSONALITIES, chosen)) || !includes(BOT_DIFFICULTIES, difficulty)) {
      return Promise.resolve(err(roomError('settings-invalid')))
    }
    const roll = this.random.next()
    const cast = BOT_CAST_IDS[Math.floor(this.random.next() * BOT_CAST_IDS.length)] ?? 'solitude'
    return changeRoomAs(this.access, actor, (room) => {
      const existing = room.bots.flatMap((bot) => (bot.bot === null ? [] : [bot.bot.personality]))
      const profile: BotProfile = { personality: chosen ?? surprisePersonalityOf(existing, roll), difficulty }
      return room.addBot(actor.memberId, { id: this.ids.next(), token: this.ids.next() }, profile, cast)
    })
  }
}
