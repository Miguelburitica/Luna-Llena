import { randomBytes } from 'node:crypto'
import { ADMIN_SESSION } from '@luna/contracts'
import type { AdminSession, AdminSessions } from '../application/ports'

const HOUR = 3_600_000

export class InMemoryAdminSessions implements AdminSessions {
  private readonly sessions = new Map<string, AdminSession>()

  constructor(private readonly newId: () => string = () => randomBytes(32).toString('base64url')) {}

  start(now: number): AdminSession {
    const session = { id: this.newId(), expiresAt: now + ADMIN_SESSION.lifetimeHours * HOUR }
    this.sessions.set(session.id, session)
    return session
  }

  find(id: string, now: number): AdminSession | undefined {
    const session = this.sessions.get(id)
    if (session === undefined || session.expiresAt > now) return session
    this.sessions.delete(id)
    return undefined
  }

  end(id: string): void {
    this.sessions.delete(id)
  }
}
