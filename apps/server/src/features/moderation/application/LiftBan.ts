import { adminError, done, err, type AdminError, type Result } from '@luna/contracts'
import { requireAdmin, type AdminAccess } from './adminAccess'
import { clientKeyOf } from './BanClient'
import type { ModerationRecords } from './ports'

export class LiftBan {
  constructor(
    private readonly access: AdminAccess,
    private readonly records: ModerationRecords
  ) {}

  execute(sessionId: string | undefined, input: { readonly kind?: unknown; readonly value?: unknown }): Result<void, AdminError> {
    const allowed = requireAdmin(this.access, sessionId)
    if (!allowed.ok) return allowed
    const key = clientKeyOf(input)
    if (key === null) return err(adminError('ban-invalid'))
    this.records.bans.lift(key)
    this.records.ledger.forgive(key)
    return done
  }
}
