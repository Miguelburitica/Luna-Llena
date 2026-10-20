import { err, ok, type AdminSessionStatus, type ClientKey, type ModerationOverview, type Result } from '@luna/contracts'
import type { AdminFailure, AdminGateway } from './ports'

export const overviewOf = (overrides: Partial<ModerationOverview> = {}): ModerationOverview => ({
  bans: [{ key: { kind: 'device', value: 'device-tato' }, until: Date.UTC(2026, 9, 21, 12), source: 'strikes' }],
  strikes: [
    {
      device: 'device-tato',
      address: '10.0.0.7',
      reason: 'message-flagged',
      roomCode: 'SPAM42',
      excerpt: 'algo feo',
      at: Date.UTC(2026, 9, 20, 12)
    }
  ],
  reports: [{ roomCode: 'SPAM42', roomName: 'Sala de spam', address: '10.0.0.9', at: Date.UTC(2026, 9, 20, 12) }],
  rooms: [
    {
      code: 'SPAM42',
      name: 'Sala de spam',
      narratorName: 'Tato',
      visibility: 'public',
      status: 'lobby',
      playerCount: 2,
      reports: 3,
      hidden: true
    }
  ],
  ...overrides
})

export class FakeAdminGateway implements AdminGateway {
  readonly calls: Array<{ command: string; input?: unknown }> = []
  session: AdminSessionStatus = { signedIn: false, expiresAt: null }
  token = 'luna-operator-secret'
  current: ModerationOverview = overviewOf()

  disabled = false

  status() {
    this.calls.push({ command: 'status' })
    if (this.disabled) return Promise.resolve(err({ code: 'admin-disabled' }) as Result<AdminSessionStatus, AdminFailure>)
    return Promise.resolve(ok(this.session) as Result<AdminSessionStatus, AdminFailure>)
  }

  signIn(token: string) {
    this.calls.push({ command: 'signIn', input: token })
    if (token !== this.token) return Promise.resolve(err({ code: 'admin-denied' }) as Result<AdminSessionStatus, AdminFailure>)
    this.session = { signedIn: true, expiresAt: Date.UTC(2026, 9, 20, 20) }
    return Promise.resolve(ok(this.session) as Result<AdminSessionStatus, AdminFailure>)
  }

  signOut() {
    this.calls.push({ command: 'signOut' })
    this.session = { signedIn: false, expiresAt: null }
    return Promise.resolve(ok(this.session) as Result<AdminSessionStatus, AdminFailure>)
  }

  overview() {
    this.calls.push({ command: 'overview' })
    if (!this.session.signedIn) return Promise.resolve(err({ code: 'admin-denied' }) as Result<ModerationOverview, AdminFailure>)
    return Promise.resolve(ok(this.current) as Result<ModerationOverview, AdminFailure>)
  }

  ban(key: ClientKey, hours: number) {
    this.calls.push({ command: 'ban', input: { ...key, hours } })
    return Promise.resolve(ok(undefined) as Result<void, AdminFailure>)
  }

  unban(key: ClientKey) {
    this.calls.push({ command: 'unban', input: key })
    return Promise.resolve(ok(undefined) as Result<void, AdminFailure>)
  }

  closeRoom(code: string) {
    this.calls.push({ command: 'closeRoom', input: code })
    return Promise.resolve(ok(undefined) as Result<void, AdminFailure>)
  }

  commands(): string[] {
    return this.calls.map((call) => call.command)
  }
}
