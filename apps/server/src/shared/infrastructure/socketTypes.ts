import type { ClientToServerEvents, ServerToClientEvents } from '@luna/contracts'
import type { Server, Socket } from 'socket.io'
import type { ClientIdentity } from '../domain/ClientIdentity'

export interface SessionBinding {
  readonly code: string
  readonly memberId: string
}

export interface SocketData {
  session?: SessionBinding | undefined
  client?: ClientIdentity | undefined
  adminSession?: string | undefined
}

export type LunaServer = Server<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>

export type LunaSocket = Socket<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>
