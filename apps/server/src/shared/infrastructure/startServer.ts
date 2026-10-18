import { createServer } from 'node:http'
import type { AddressInfo } from 'node:net'
import { Server } from 'socket.io'
import { createRoomUseCases } from '../../features/room/application/roomUseCases'
import { InMemoryRoomRepository } from '../../features/room/infrastructure/InMemoryRoomRepository'
import { RandomRoomCodeGenerator } from '../../features/room/infrastructure/RandomRoomCodeGenerator'
import { registerRoomHandlers } from '../../features/room/infrastructure/registerRoomHandlers'
import { SocketRoomPublisher } from '../../features/room/infrastructure/SocketRoomPublisher'
import { CryptoIdGenerator } from './CryptoIdGenerator'
import type { LunaServer } from './socketTypes'

export interface ServerOptions {
  readonly port: number
  readonly webOrigin: string
}

export interface RunningServer {
  readonly port: number
  close(): Promise<void>
}

export const startServer = ({ port, webOrigin }: ServerOptions): Promise<RunningServer> => {
  const httpServer = createServer()
  const io: LunaServer = new Server(httpServer, { cors: { origin: webOrigin } })

  registerRoomHandlers(
    io,
    createRoomUseCases({
      rooms: new InMemoryRoomRepository(),
      codes: new RandomRoomCodeGenerator(),
      ids: new CryptoIdGenerator(),
      publisher: new SocketRoomPublisher(io)
    })
  )

  return new Promise((resolve) => {
    httpServer.listen(port, () => {
      resolve({
        port: (httpServer.address() as AddressInfo).port,
        close: () => new Promise((closed) => void io.close(() => closed()))
      })
    })
  })
}
