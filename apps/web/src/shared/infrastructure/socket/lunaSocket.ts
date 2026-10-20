import type { ClientToServerEvents, Result, ServerToClientEvents } from '@luna/contracts'
import { err } from '@luna/contracts'
import { io, type Socket } from 'socket.io-client'
import { deviceIdOfThisBrowser } from './deviceId'

export type LunaSocket = Socket<ServerToClientEvents, ClientToServerEvents>

export interface Unreachable {
  readonly code: 'unreachable'
}

export const REQUEST_TIMEOUT_MS = 8000

export const createLunaSocket = (url?: string): LunaSocket => {
  const options = { autoConnect: false, withCredentials: true, auth: { device: deviceIdOfThisBrowser() } }
  return url === undefined ? io(options) : io(url, options)
}

export const reachOrFail = async <T, E>(send: () => Promise<Result<T, E>>): Promise<Result<T, E | Unreachable>> => {
  let timer: ReturnType<typeof setTimeout> | undefined
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error('Request timed out')), REQUEST_TIMEOUT_MS)
  })
  try {
    return await Promise.race([send(), timeout])
  } catch {
    return err({ code: 'unreachable' })
  } finally {
    clearTimeout(timer)
  }
}
