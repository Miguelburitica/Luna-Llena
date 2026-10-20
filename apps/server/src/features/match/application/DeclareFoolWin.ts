import type { MatchError, Result } from '@luna/contracts'
import { changeMatchAs, type MatchAccess } from './matchAccess'
import type { Actor } from './ports'

export class DeclareFoolWin {
  constructor(private readonly access: MatchAccess) {}

  execute(actor: Actor, input: { readonly memberId?: unknown }): Promise<Result<void, MatchError>> {
    return changeMatchAs(this.access, actor, (match) => match.declareFoolWin(actor.memberId, input.memberId))
  }
}
