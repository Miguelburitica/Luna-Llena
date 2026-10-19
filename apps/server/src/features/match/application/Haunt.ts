import { done, type HauntEffect, type MatchError, type Result } from '@luna/contracts'
import type { IdGenerator } from '../../../shared/application/IdGenerator'
import type { HauntOutcome, Match } from '@luna/rules'
import { findActorMatch, saveAndPublish, type MatchAccess } from './matchAccess'
import type { Actor, HauntDelivery } from './ports'

const deliveriesOf = (match: Match, outcome: HauntOutcome, shared: HauntEffect): HauntDelivery[] => {
  const narrator: HauntDelivery = { memberId: match.narratorId, effect: { ...shared, ghostId: outcome.ghostId } }
  if (outcome.targetId !== null) {
    return [{ memberId: outcome.targetId, effect: shared }, narrator]
  }
  const everyone = match.seats.map((seat) => ({ memberId: seat.memberId, effect: shared }))
  return [narrator, ...everyone]
}

export class Haunt {
  constructor(
    private readonly access: MatchAccess,
    private readonly ids: IdGenerator
  ) {}

  async execute(actor: Actor, input: unknown): Promise<Result<void, MatchError>> {
    const match = await findActorMatch(this.access.matches, actor)
    if (!match.ok) return match
    const outcome = match.value.haunt(actor.memberId, input)
    if (!outcome.ok) return outcome
    await saveAndPublish(this.access, match.value)
    const shared: HauntEffect = {
      id: this.ids.next(),
      kind: outcome.value.kind,
      word: outcome.value.word,
      ghostId: null,
      targetId: outcome.value.targetId,
      sentAt: this.access.clock.now()
    }
    this.access.publisher.haunt(match.value.code, deliveriesOf(match.value, outcome.value, shared))
    return done
  }
}
