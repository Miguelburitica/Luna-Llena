import type { RandomSource } from '../../../shared/application/RandomSource'
import { dealRoles } from '../domain/dealRoles'
import { Match } from '../domain/Match'
import { saveAndPublish, type MatchAccess } from './matchAccess'
import type { MatchOpening } from './ports'

export class StartMatch {
  constructor(
    private readonly access: MatchAccess,
    private readonly random: RandomSource
  ) {}

  async execute(opening: MatchOpening): Promise<void> {
    const match = Match.begin({
      code: opening.code,
      narratorId: opening.narratorId,
      seats: dealRoles(opening.deck, opening.playerIds, this.random),
      timers: opening.timers,
      revealRoleOnDeath: opening.revealRoleOnDeath,
      now: this.access.clock.now()
    })
    await saveAndPublish(this.access, match)
  }
}
