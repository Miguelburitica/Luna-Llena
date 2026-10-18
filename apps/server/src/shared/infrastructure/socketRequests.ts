import type { ClientToServerEvents } from '@luna/contracts'
import type { LunaSocket } from './socketTypes'

export type Payload = Readonly<Record<string, unknown>>

const asPayload = (value: unknown): Payload =>
  typeof value === 'object' && value !== null && !Array.isArray(value) ? (value as Payload) : {}

export const answer = (
  socket: LunaSocket,
  event: keyof ClientToServerEvents,
  handle: (payload: Payload) => Promise<unknown>
): void => {
  const listener = async (payload: unknown, acknowledge: unknown) => {
    try {
      const response = await handle(asPayload(payload))
      if (typeof acknowledge === 'function') acknowledge(response)
    } catch (failure) {
      console.error(`Socket request ${event} failed`, failure)
    }
  }
  socket.on(event, listener as never)
}
