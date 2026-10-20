import { ADMIN_SESSION, DEVICE_ID_PATTERN } from '@luna/contracts'
import type { IncomingHttpHeaders } from 'node:http'
import type { ClientIdentity } from '../domain/ClientIdentity'

const firstForwarded = (headers: IncomingHttpHeaders): string | undefined => {
  const header = headers['x-forwarded-for']
  const value = Array.isArray(header) ? header[0] : header
  const first = value?.split(',')[0]?.trim()
  return first === undefined || first === '' ? undefined : first
}

export const addressOf = (directAddress: string | undefined, headers: IncomingHttpHeaders, trustProxy: boolean): string =>
  (trustProxy ? firstForwarded(headers) : undefined) ?? directAddress ?? 'unknown'

export const deviceOf = (auth: unknown, fallback: string): string => {
  const device = typeof auth === 'object' && auth !== null ? (auth as { device?: unknown }).device : undefined
  return typeof device === 'string' && DEVICE_ID_PATTERN.test(device) ? device : fallback
}

export const clientIdentityOf = (
  handshake: { readonly address: string; readonly headers: IncomingHttpHeaders; readonly auth: unknown },
  socketId: string,
  trustProxy: boolean
): ClientIdentity => ({
  address: addressOf(handshake.address, handshake.headers, trustProxy),
  device: deviceOf(handshake.auth, `socket-${socketId}`)
})

export const adminSessionIdOf = (cookieHeader: string | undefined): string | undefined => {
  for (const part of (cookieHeader ?? '').split(';')) {
    const separator = part.indexOf('=')
    if (separator < 0) continue
    if (part.slice(0, separator).trim() === ADMIN_SESSION.cookieName) {
      const value = part.slice(separator + 1).trim()
      return value === '' ? undefined : value
    }
  }
  return undefined
}
