import type { MatchError, MatchView, Result } from '@luna/contracts'
import { viewOf, type MatchAccess } from './matchAccess'
import type { Actor } from './ports'

export class SyncMatch {
  constructor(private readonly access: MatchAccess) {}

  execute(actor: Actor): Promise<Result<MatchView, MatchError>> {
    return viewOf(this.access, actor)
  }
}
