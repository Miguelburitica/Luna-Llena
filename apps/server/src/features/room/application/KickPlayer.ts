import { BOT_CAST_IDS, BOT_PERSONALITIES, done, type Result, type RoomError } from '@luna/contracts'
import type { IdGenerator } from '../../../shared/application/IdGenerator'
import type { RandomSource } from '../../../shared/application/RandomSource'
import type { Actor } from './ports'
import { findActorRoom, saveAndPublish, type RoomAccess } from './roomAccess'

export class KickPlayer {
  constructor(
    private readonly access: RoomAccess,
    private readonly ids: IdGenerator,
    private readonly random: RandomSource
  ) {}

  async execute(actor: Actor, input: { readonly memberId?: unknown }): Promise<Result<void, RoomError>> {
    const room = await findActorRoom(this.access.rooms, actor)
    if (!room.ok) return room
    const personality = BOT_PERSONALITIES[Math.floor(this.random.next() * BOT_PERSONALITIES.length)] ?? 'detective'
    const castWhenNone = BOT_CAST_IDS[Math.floor(this.random.next() * BOT_CAST_IDS.length)] ?? 'solitude'
    const kick = room.value.kick(actor.memberId, input.memberId, {
      token: this.ids.next(),
      profile: { personality, difficulty: 'normal' },
      castWhenNone
    })
    if (!kick.ok) return kick
    const { publisher, gate, starter } = this.access
    await saveAndPublish(this.access, room.value)
    publisher.notifyKicked(actor.code, kick.value.member.id)
    if (kick.value.takeover !== null) {
      publisher.notifySeatTakenOver(actor.code, kick.value.takeover)
      await starter.handOver(actor.code)
    }
    if (room.value.isPublic && kick.value.client !== undefined) {
      await gate.strike({ client: kick.value.client, reason: 'kicked', roomCode: actor.code, excerpt: null })
    }
    return done
  }
}
