import { createServer } from 'node:http'
import type { AddressInfo } from 'node:net'
import { Server } from 'socket.io'
import { createMatchUseCases } from '../../features/match/application/matchUseCases'
import { InMemoryMatchRepository } from '../../features/match/infrastructure/InMemoryMatchRepository'
import { registerMatchHandlers } from '../../features/match/infrastructure/registerMatchHandlers'
import { SocketMatchPublisher } from '../../features/match/infrastructure/SocketMatchPublisher'
import { createRoomUseCases } from '../../features/room/application/roomUseCases'
import { InMemoryRoomRepository } from '../../features/room/infrastructure/InMemoryRoomRepository'
import { RandomRoomCodeGenerator } from '../../features/room/infrastructure/RandomRoomCodeGenerator'
import { registerRoomHandlers } from '../../features/room/infrastructure/registerRoomHandlers'
import { SocketRoomPublisher } from '../../features/room/infrastructure/SocketRoomPublisher'
import type { Clock } from '../application/Clock'
import type { RandomSource } from '../application/RandomSource'
import { CryptoIdGenerator } from './CryptoIdGenerator'
import { MathRandomSource } from './MathRandomSource'
import { SystemClock } from './SystemClock'
import type { LunaServer } from './socketTypes'

export interface ServerOptions {
  readonly port: number
  readonly webOrigin: string
  readonly clock?: Clock
  readonly random?: RandomSource
}

export interface RunningServer {
  readonly port: number
  close(): Promise<void>
}

export const startServer = ({
  port,
  webOrigin,
  clock = new SystemClock(),
  random = new MathRandomSource()
}: ServerOptions): Promise<RunningServer> => {
  const httpServer = createServer()
  const io: LunaServer = new Server(httpServer, { cors: { origin: webOrigin } })

  const matchUseCases = createMatchUseCases({
    matches: new InMemoryMatchRepository(),
    publisher: new SocketMatchPublisher(io),
    clock,
    random
  })

  registerRoomHandlers(
    io,
    createRoomUseCases({
      rooms: new InMemoryRoomRepository(),
      codes: new RandomRoomCodeGenerator(),
      ids: new CryptoIdGenerator(),
      publisher: new SocketRoomPublisher(io),
      starter: { start: (opening) => matchUseCases.startMatch.execute(opening) }
    })
  )
  registerMatchHandlers(io, matchUseCases)

  return new Promise((resolve) => {
    httpServer.listen(port, () => {
      resolve({
        port: (httpServer.address() as AddressInfo).port,
        close: () => new Promise((closed) => void io.close(() => closed()))
      })
    })
  })
}
