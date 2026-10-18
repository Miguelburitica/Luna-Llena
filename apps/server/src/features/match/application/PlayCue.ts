import { done, type MatchError, type Result } from '@luna/contracts'
import type { IdGenerator } from '../../../shared/application/IdGenerator'
import { findActorMatch, type MatchAccess } from './matchAccess'
import type { Actor } from './ports'

export class PlayCue {
  constructor(
    private readonly access: MatchAccess,
    private readonly ids: IdGenerator
  ) {}

  async execute(actor: Actor, input: unknown): Promise<Result<void, MatchError>> {
    const match = await findActorMatch(this.access.matches, actor)
    if (!match.ok) return match
    const cue = match.value.validateCue(actor.memberId, input)
    if (!cue.ok) return cue
    const memberIds = [match.value.narratorId, ...match.value.seats.map((seat) => seat.memberId)]
    this.access.publisher.cue(match.value.code, memberIds, {
      ...cue.value,
      id: this.ids.next(),
      sentAt: this.access.clock.now()
    })
    return done
  }
}
