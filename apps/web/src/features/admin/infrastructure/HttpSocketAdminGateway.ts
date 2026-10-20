import { ADMIN_SESSION, err, type AdminSessionStatus, type ClientKey, type Result } from '@luna/contracts'
import { reachOrFail, type LunaSocket } from '@/shared/infrastructure/socket/lunaSocket'
import type { AdminFailure, AdminGateway } from '../application/ports'

type Fetch = (input: string, init: RequestInit) => Promise<Response>

export class HttpSocketAdminGateway implements AdminGateway {
  constructor(
    private readonly socket: LunaSocket,
    private readonly send: Fetch = (input, init) => fetch(input, init)
  ) {}

  status() {
    return this.session('GET')
  }

  async signIn(token: string) {
    const result = await this.session('POST', { token })
    if (result.ok) await this.reconnect()
    return result
  }

  async signOut() {
    const result = await this.session('DELETE')
    await this.reconnect()
    return result
  }

  overview() {
    return reachOrFail(() => this.socket.emitWithAck('admin:overview', {}))
  }

  ban(key: ClientKey, hours: number) {
    return reachOrFail(() => this.socket.emitWithAck('admin:ban', { ...key, hours }))
  }

  unban(key: ClientKey) {
    return reachOrFail(() => this.socket.emitWithAck('admin:unban', key))
  }

  closeRoom(code: string) {
    return reachOrFail(() => this.socket.emitWithAck('admin:closeRoom', { code }))
  }

  private async session(method: 'GET' | 'POST' | 'DELETE', body?: unknown): Promise<Result<AdminSessionStatus, AdminFailure>> {
    try {
      const response = await this.send(ADMIN_SESSION.path, {
        method,
        credentials: 'same-origin',
        headers: body === undefined ? {} : { 'Content-Type': 'application/json' },
        ...(body === undefined ? {} : { body: JSON.stringify(body) })
      })
      return (await response.json()) as Result<AdminSessionStatus, AdminFailure>
    } catch {
      return err({ code: 'unreachable' })
    }
  }

  private reconnect(): Promise<void> {
    return new Promise((resolve) => {
      this.socket.once('connect', () => resolve())
      this.socket.disconnect().connect()
    })
  }
}
