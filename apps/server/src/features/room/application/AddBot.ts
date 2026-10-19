import { BOT_CAST_IDS, BOT_DIFFICULTIES, BOT_PERSONALITIES, err, roomError, type BotProfile, type Result, type RoomError } from '@luna/contracts'
import type { IdGenerator } from '../../../shared/application/IdGenerator'
import type { RandomSource } from '../../../shared/application/RandomSource'
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
    const profile = this.profileOf(input)
    if (profile === null) return Promise.resolve(err(roomError('settings-invalid')))
    const cast = BOT_CAST_IDS[Math.floor(this.random.next() * BOT_CAST_IDS.length)] ?? 'solitude'
    return changeRoomAs(this.access, actor, (room) =>
      room.addBot(actor.memberId, { id: this.ids.next(), token: this.ids.next() }, profile, cast)
    )
  }

  private profileOf(input: { readonly personality?: unknown; readonly difficulty?: unknown }): BotProfile | null {
    const personality =
      input.personality === undefined
        ? BOT_PERSONALITIES[Math.floor(this.random.next() * BOT_PERSONALITIES.length)]
        : input.personality
    const difficulty = input.difficulty ?? 'normal'
    if (!includes(BOT_PERSONALITIES, personality) || !includes(BOT_DIFFICULTIES, difficulty)) return null
    return { personality, difficulty }
  }
}
