import type { MatchError, Result } from '@luna/contracts'
import type { RandomSource } from '../../../shared/application/RandomSource'
import { changeMatchAs, type MatchAccess } from './matchAccess'
import type { Actor } from './ports'

export class ActAtNight {
  constructor(
    private readonly access: MatchAccess,
    private readonly random: RandomSource
  ) {}

  execute(actor: Actor, input: unknown): Promise<Result<void, MatchError>> {
    return changeMatchAs(this.access, actor, (match) => match.act(actor.memberId, input, this.random))
  }
}
