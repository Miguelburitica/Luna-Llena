import { adminError, err, ok, type AdminError, type AdminSessionStatus, type Result } from '@luna/contracts'
import type { AdminAccess } from './adminAccess'

export class AdminSessionOf {
  constructor(private readonly access: AdminAccess) {}

  execute(sessionId: string | undefined): Result<AdminSessionStatus, AdminError> {
    if (!this.access.secret.configured) return err(adminError('admin-disabled'))
    const session = sessionId === undefined ? undefined : this.access.sessions.find(sessionId, this.access.clock.now())
    return ok({ signedIn: session !== undefined, expiresAt: session?.expiresAt ?? null })
  }
}
