import type { MatchError, Result } from '@luna/contracts'
import { changeMatchAs, type MatchAccess } from './matchAccess'
import type { Actor } from './ports'

export class CastVote {
  constructor(private readonly access: MatchAccess) {}

  execute(actor: Actor, targetId: unknown): Promise<Result<void, MatchError>> {
    return changeMatchAs(this.access, actor, (match) => match.vote(actor.memberId, targetId))
  }
}
