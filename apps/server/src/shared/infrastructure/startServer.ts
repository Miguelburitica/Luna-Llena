import { ADMIN_SESSION } from '@luna/contracts'
import { createServer } from 'node:http'
import type { AddressInfo } from 'node:net'
import { Server } from 'socket.io'
import { createBotsUseCases, type BotsUseCases } from '../../features/bots/application/botsUseCases'
import type { BotScheduler, BotSpeech } from '../../features/bots/application/ports'
import { InMemoryBotTables } from '../../features/bots/infrastructure/InMemoryBotTables'
import { NoBotSpeech } from '../../features/bots/infrastructure/NoBotSpeech'
import { TimerBotScheduler } from '../../features/bots/infrastructure/TimerBotScheduler'
import { createChatUseCases } from '../../features/chat/application/chatUseCases'
import { InMemoryChatLogRepository } from '../../features/chat/infrastructure/InMemoryChatLogRepository'
import { registerChatHandlers } from '../../features/chat/infrastructure/registerChatHandlers'
import { SocketChatPublisher } from '../../features/chat/infrastructure/SocketChatPublisher'
import { createMatchUseCases } from '../../features/match/application/matchUseCases'
import { InMemoryMatchRepository } from '../../features/match/infrastructure/InMemoryMatchRepository'
import { registerMatchHandlers } from '../../features/match/infrastructure/registerMatchHandlers'
import { SocketMatchPublisher } from '../../features/match/infrastructure/SocketMatchPublisher'
import { createModerationUseCases, type ModerationUseCases } from '../../features/moderation/application/moderationUseCases'
import type { ContentClassifier } from '../../features/moderation/application/ports'
import { blockedByWordList } from '../../features/moderation/domain/wordList'
import { EnvironmentAdminSecret } from '../../features/moderation/infrastructure/EnvironmentAdminSecret'
import { InMemoryAdminSessions } from '../../features/moderation/infrastructure/InMemoryAdminSessions'
import { InMemoryModeration } from '../../features/moderation/infrastructure/InMemoryModeration'
import { NoContentClassifier } from '../../features/moderation/infrastructure/NoContentClassifier'
import { registerAdminHandlers } from '../../features/moderation/infrastructure/registerAdminHandlers'
import { registerAdminHttpRoutes } from '../../features/moderation/infrastructure/registerAdminHttpRoutes'
import { createRoomUseCases, type RoomUseCases } from '../../features/room/application/roomUseCases'
import { InMemoryRoomRepository } from '../../features/room/infrastructure/InMemoryRoomRepository'
import { IntervalRoomSweeper } from '../../features/room/infrastructure/IntervalRoomSweeper'
import { RandomRoomCodeGenerator } from '../../features/room/infrastructure/RandomRoomCodeGenerator'
import { registerRoomHandlers } from '../../features/room/infrastructure/registerRoomHandlers'
import { SocketRoomPublisher } from '../../features/room/infrastructure/SocketRoomPublisher'
import { ThrottledLobbyNotifier } from '../../features/room/infrastructure/ThrottledLobbyNotifier'
import type { Clock } from '../application/Clock'
import type { RandomSource } from '../application/RandomSource'
import { adminSessionIdOf, clientIdentityOf } from './clientIdentity'
import { CryptoIdGenerator } from './CryptoIdGenerator'
import { MathRandomSource } from './MathRandomSource'
import { serveWebApp } from './serveWebApp'
import { SystemClock } from './SystemClock'
import { BotAwareChatPublisher, BotAwareMatchPublisher, BotAwareRoomPublisher } from './botAwarePublishers'
import type { LunaServer } from './socketTypes'

export interface ServerOptions {
  readonly port: number
  readonly webOrigin: string
  readonly clock?: Clock
  readonly random?: RandomSource
  readonly botSpeech?: BotSpeech
  readonly botScheduler?: BotScheduler
  readonly classifier?: ContentClassifier
  readonly adminToken?: string | undefined
  readonly trustProxy?: boolean
  readonly webRoot?: string | undefined
  readonly lobbyThrottleMs?: number
  readonly sweepIntervalMs?: number
}

export interface RunningServer {
  readonly port: number
  readonly rooms: RoomUseCases
  readonly moderation: ModerationUseCases
  close(): Promise<void>
}

const lazy = <T>(name: string) => {
  const holder: { current?: T } = {}
  return {
    set: (value: T) => {
      holder.current = value
    },
    get: (): T => {
      if (holder.current === undefined) throw new Error(`${name} is wired before the server listens`)
      return holder.current
    }
  }
}

export const startServer = ({
  port,
  webOrigin,
  clock = new SystemClock(),
  random = new MathRandomSource(),
  botSpeech = new NoBotSpeech(),
  botScheduler = new TimerBotScheduler(),
  classifier = new NoContentClassifier(),
  adminToken,
  trustProxy = false,
  webRoot,
  lobbyThrottleMs,
  sweepIntervalMs
}: ServerOptions): Promise<RunningServer> => {
  const httpServer = createServer()
  const io: LunaServer = new Server(httpServer, { cors: { origin: webOrigin, credentials: true } })
  io.use((socket, next) => {
    socket.data.client = clientIdentityOf(socket.handshake, socket.id, trustProxy)
    socket.data.adminSession = adminSessionIdOf(socket.handshake.headers.cookie)
    next()
  })
  const bots = lazy<BotsUseCases>('Bots')
  const rooms = lazy<RoomUseCases>('Rooms')

  const moderation = createModerationUseCases({
    records: new InMemoryModeration(),
    classifier,
    sessions: new InMemoryAdminSessions(),
    secret: new EnvironmentAdminSecret(adminToken),
    clock,
    directory: {
      rooms: () => rooms.get().adminRooms.list(),
      close: (code) => rooms.get().adminRooms.close(code)
    }
  })

  const matchUseCases = createMatchUseCases({
    matches: new InMemoryMatchRepository(),
    publisher: new BotAwareMatchPublisher(new SocketMatchPublisher(io), bots.get),
    clock,
    random,
    ids: new CryptoIdGenerator()
  })

  const chatUseCases = createChatUseCases({
    logs: new InMemoryChatLogRepository(),
    publisher: new BotAwareChatPublisher(new SocketChatPublisher(io), bots.get),
    audience: {
      membersOf: (code, now) => matchUseCases.describeChatAudience.execute(code, now),
      lastWordsSpoken: async (code, memberId) => {
        await matchUseCases.closeLastWords.execute({ code, memberId })
      }
    },
    moderation: {
      isPublic: (code) => rooms.get().roomFacts.isPublic(code),
      isMuted: (code, memberId) => rooms.get().roomFacts.isMuted(code, memberId),
      bannedUntil: async (client) => moderation.checkBan.execute(client),
      blockedByWordList,
      review: async (code, text) => {
        const outcome = await moderation.reviewText.execute({ roomCode: code, text, kind: 'message' })
        return outcome === 'blocked' ? 'profanity' : outcome
      },
      strike: async (strike) => moderation.recordStrike.execute(strike)
    },
    clock,
    ids: new CryptoIdGenerator()
  })

  bots.set(
    createBotsUseCases({
      tables: new InMemoryBotTables(),
      scheduler: botScheduler,
      speech: botSpeech,
      random,
      clock,
      actions: {
        act: (actor, input) => matchUseCases.actAtNight.execute(actor, input),
        vote: (actor, targetId) => matchUseCases.castVote.execute(actor, targetId),
        lockVote: (actor) => matchUseCases.lockVote.execute(actor),
        avenge: (actor, targetId) => matchUseCases.takeRevenge.execute(actor, targetId),
        haunt: (actor, input) => matchUseCases.haunt.execute(actor, input),
        say: (actor, channel, text) => chatUseCases.sendMessage.execute(actor, { channel, text })
      }
    })
  )

  const lobby = new ThrottledLobbyNotifier(io, () => rooms.get().listPublicRooms.execute(), lobbyThrottleMs)

  rooms.set(
    createRoomUseCases({
      rooms: new InMemoryRoomRepository(),
      codes: new RandomRoomCodeGenerator(),
      ids: new CryptoIdGenerator(),
      publisher: new BotAwareRoomPublisher(new SocketRoomPublisher(io), bots.get),
      random,
      clock,
      lobby,
      gate: {
        bannedUntil: async (client) => moderation.checkBan.execute(client),
        review: (roomCode, text, kind) => moderation.reviewText.execute({ roomCode, text, kind }),
        strike: async (strike) => moderation.recordStrike.execute(strike),
        noteReport: async (report) => moderation.recordReport.execute(report)
      },
      starter: {
        start: (opening) => matchUseCases.startMatch.execute(opening),
        isOver: (code) => matchUseCases.isMatchOver.execute(code),
        handOver: (code) => matchUseCases.republishMatch.execute(code),
        discard: async (code) => {
          await matchUseCases.discardMatch.execute(code)
          await chatUseCases.discardChat.execute(code)
        }
      }
    })
  )
  registerRoomHandlers(io, rooms.get())
  registerMatchHandlers(io, matchUseCases)
  registerChatHandlers(io, chatUseCases)
  registerAdminHandlers(io, moderation)
  registerAdminHttpRoutes(httpServer, moderation, { webOrigin, trustProxy })
  serveWebApp(httpServer, webRoot, [ADMIN_SESSION.path])

  const sweeper = new IntervalRoomSweeper(() => rooms.get().sweepRooms.execute(), sweepIntervalMs)
  sweeper.start()

  return new Promise((resolve) => {
    httpServer.listen(port, () => {
      resolve({
        port: (httpServer.address() as AddressInfo).port,
        rooms: rooms.get(),
        moderation,
        close: () =>
          new Promise((closed) => {
            sweeper.stop()
            lobby.stop()
            void io.close(() => closed())
          })
      })
    })
  })
}
