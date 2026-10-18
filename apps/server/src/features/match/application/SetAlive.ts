import type { MatchError, Result } from '@luna/contracts'
import { changeMatchAs, type MatchAccess } from './matchAccess'
import type { Actor } from './ports'

export class SetAlive {
  constructor(private readonly access: MatchAccess) {}

  execute(
    actor: Actor,
    input: { readonly memberId?: unknown; readonly alive?: unknown }
  ): Promise<Result<void, MatchError>> {
    return changeMatchAs(this.access, actor, (match) => match.setAlive(actor.memberId, input.memberId, input.alive))
  }
}
