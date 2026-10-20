import type { AdminSessions } from './ports'

export class SignOutAdmin {
  constructor(private readonly sessions: AdminSessions) {}

  execute(sessionId: string | undefined): void {
    if (sessionId !== undefined) this.sessions.end(sessionId)
  }
}
