import { ADMIN_SESSION, type AdminSessionStatus } from '@luna/contracts'
import type { IncomingMessage, Server, ServerResponse } from 'node:http'
import { addressOf, adminSessionIdOf } from '../../../shared/infrastructure/clientIdentity'
import type { ModerationUseCases } from '../application/moderationUseCases'

export interface AdminHttpOptions {
  readonly webOrigin: string
  readonly trustProxy: boolean
}

const HOUR_SECONDS = 3600

const cookieOf = (value: string, maxAgeSeconds: number, webOrigin: string): string => {
  const secure = /^http:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(webOrigin) || webOrigin === '*' ? '' : '; Secure'
  return `${ADMIN_SESSION.cookieName}=${value}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${maxAgeSeconds}${secure}`
}

const sendJson = (response: ServerResponse, status: number, body: unknown, cookie?: string): void => {
  response.statusCode = status
  response.setHeader('Content-Type', 'application/json; charset=utf-8')
  response.setHeader('Cache-Control', 'no-store')
  if (cookie !== undefined) response.setHeader('Set-Cookie', cookie)
  response.end(JSON.stringify(body))
}

const sameOrigin = (request: IncomingMessage, webOrigin: string): boolean => {
  const origin = request.headers.origin
  return webOrigin === '*' || origin === undefined || origin === webOrigin
}

const readSmallJson = (request: IncomingMessage): Promise<unknown> =>
  new Promise((resolve) => {
    let size = 0
    const chunks: Buffer[] = []
    request.on('data', (chunk: Buffer) => {
      size += chunk.length
      if (size > ADMIN_SESSION.maxBodyBytes) {
        resolve(undefined)
        request.destroy()
        return
      }
      chunks.push(chunk)
    })
    request.on('end', () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')))
      } catch {
        resolve(undefined)
      }
    })
    request.on('error', () => resolve(undefined))
  })

export const registerAdminHttpRoutes = (http: Server, useCases: ModerationUseCases, options: AdminHttpOptions): void => {
  http.on('request', (request: IncomingMessage, response: ServerResponse) => {
    const path = (request.url ?? '').split('?')[0]
    if (path !== ADMIN_SESSION.path) return
    if (!sameOrigin(request, options.webOrigin)) {
      sendJson(response, 403, { ok: false, error: { code: 'admin-denied' } })
      return
    }
    const sessionId = adminSessionIdOf(request.headers.cookie)
    if (request.method === 'GET') {
      const status = useCases.adminSessionOf.execute(sessionId)
      sendJson(response, status.ok ? 200 : 404, status)
      return
    }
    if (request.method === 'DELETE') {
      useCases.signOutAdmin.execute(sessionId)
      sendJson(response, 200, { ok: true, value: { signedIn: false, expiresAt: null } }, cookieOf('', 0, options.webOrigin))
      return
    }
    if (request.method !== 'POST' || !(request.headers['content-type'] ?? '').startsWith('application/json')) {
      sendJson(response, 405, { ok: false, error: { code: 'admin-denied' } })
      return
    }
    void readSmallJson(request).then((body) => {
      const token = typeof body === 'object' && body !== null ? (body as { token?: unknown }).token : undefined
      const address = addressOf(request.socket.remoteAddress, request.headers, options.trustProxy)
      const session = useCases.signInAdmin.execute(token, address)
      if (!session.ok) {
        sendJson(response, session.error.code === 'admin-disabled' ? 404 : 401, session)
        return
      }
      const status: AdminSessionStatus = { signedIn: true, expiresAt: session.value.expiresAt }
      sendJson(response, 200, { ok: true, value: status }, cookieOf(session.value.id, ADMIN_SESSION.lifetimeHours * HOUR_SECONDS, options.webOrigin))
    })
  })
}
