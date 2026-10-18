import type { MatchError, Result } from '@luna/contracts'
import { changeMatchAs, type MatchAccess } from './matchAccess'
import type { Actor } from './ports'

export class CloseLastWords {
  constructor(private readonly access: MatchAccess) {}

  execute(actor: Actor): Promise<Result<void, MatchError>> {
    return changeMatchAs(this.access, actor, (match) => match.closeLastWords(actor.memberId))
  }
}
