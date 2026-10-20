import { adminError, done, err, type AdminError, type Result } from '@luna/contracts'
import type { Clock } from '../../../shared/application/Clock'
import type { AdminSecret, AdminSessions } from './ports'

export interface AdminAccess {
  readonly secret: AdminSecret
  readonly sessions: AdminSessions
  readonly clock: Clock
}

export const requireAdmin = (access: AdminAccess, sessionId: string | undefined): Result<void, AdminError> => {
  if (!access.secret.configured) return err(adminError('admin-disabled'))
  const session = sessionId === undefined ? undefined : access.sessions.find(sessionId, access.clock.now())
  return session === undefined ? err(adminError('admin-denied')) : done
}
