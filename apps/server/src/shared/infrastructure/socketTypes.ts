import type { ClientToServerEvents, ServerToClientEvents } from '@luna/contracts'
import type { Server, Socket } from 'socket.io'

export interface SessionBinding {
  readonly code: string
  readonly memberId: string
}

export interface SocketData {
  session?: SessionBinding | undefined
}

export type LunaServer = Server<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>

export type LunaSocket = Socket<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>
