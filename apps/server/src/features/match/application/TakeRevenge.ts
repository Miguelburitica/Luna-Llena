import type { MatchError, Result } from '@luna/contracts'
import { changeMatchAs, type MatchAccess } from './matchAccess'
import type { Actor } from './ports'

export class TakeRevenge {
  constructor(private readonly access: MatchAccess) {}

  execute(actor: Actor, targetId: unknown): Promise<Result<void, MatchError>> {
    return changeMatchAs(this.access, actor, (match, now) => match.avenge(actor.memberId, targetId, now))
  }
}
