import { describe, expect, it } from 'vitest'
import type { LunaSocket } from '@/shared/infrastructure/socket/lunaSocket'
import { HttpSocketAdminGateway } from './HttpSocketAdminGateway'

const fakeSocket = () => {
  const events: string[] = []
  let onConnect: (() => void) | undefined
  const socket = {
    once: (event: string, listener: () => void) => {
      if (event === 'connect') onConnect = listener
    },
    disconnect: () => {
      events.push('disconnect')
      return socket
    },
    connect: () => {
      events.push('connect')
      onConnect?.()
      return socket
    }
  }
  return { socket: socket as unknown as LunaSocket, events }
}

describe('HttpSocketAdminGateway', () => {
  it('posts the token once to the session endpoint and reconnects so the cookie reaches the socket', async () => {
    const requests: Array<{ input: string; init: RequestInit }> = []
    const { socket, events } = fakeSocket()
    const gateway = new HttpSocketAdminGateway(socket, async (input, init) => {
      requests.push({ input, init })
      return new Response(JSON.stringify({ ok: true, value: { signedIn: true, expiresAt: 1 } }))
    })
    expect(await gateway.signIn('luna-operator-secret')).toEqual({ ok: true, value: { signedIn: true, expiresAt: 1 } })
    expect(requests[0]?.input).toBe('/api/admin/session')
    expect(requests[0]?.init).toMatchObject({ method: 'POST', credentials: 'same-origin', body: JSON.stringify({ token: 'luna-operator-secret' }) })
    expect(events).toEqual(['disconnect', 'connect'])
    expect(JSON.stringify(localStorage)).not.toContain('luna-operator-secret')
    expect(JSON.stringify(sessionStorage)).not.toContain('luna-operator-secret')
  })

  it('does not reconnect after a failed sign-in and reports an unreachable server', async () => {
    const { socket, events } = fakeSocket()
    const denied = new HttpSocketAdminGateway(socket, async () => new Response(JSON.stringify({ ok: false, error: { code: 'admin-denied' } })))
    expect(await denied.signIn('nope')).toEqual({ ok: false, error: { code: 'admin-denied' } })
    expect(events).toEqual([])
    const offline = new HttpSocketAdminGateway(socket, async () => {
      throw new Error('offline')
    })
    expect(await offline.status()).toEqual({ ok: false, error: { code: 'unreachable' } })
  })
})
