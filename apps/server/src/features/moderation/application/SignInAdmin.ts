import { adminError, err, ok, type AdminError, type Result } from '@luna/contracts'
import type { AdminAccess } from './adminAccess'
import type { AdminSession, ModerationRecords } from './ports'

export class SignInAdmin {
  constructor(
    private readonly access: AdminAccess,
    private readonly records: ModerationRecords
  ) {}

  execute(token: unknown, address: string): Result<AdminSession, AdminError> {
    const { secret, sessions, clock } = this.access
    if (!secret.configured) return err(adminError('admin-disabled'))
    const now = clock.now()
    if (this.records.lockout.isLocked(address, now)) return err(adminError('admin-denied'))
    if (!secret.matches(token)) {
      this.records.lockout.fail(address, now)
      return err(adminError('admin-denied'))
    }
    return ok(sessions.start(now))
  }
}
