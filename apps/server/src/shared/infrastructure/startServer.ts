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
import { BotAwareChatPublisher, BotAwareMatchPublisher, BotAwareRoomPublisher } from './botAwarePublishers'
import type { LunaServer } from './socketTypes'

export interface ServerOptions {
  readonly port: number
  readonly webOrigin: string
  readonly clock?: Clock
  readonly random?: RandomSource
  readonly botSpeech?: BotSpeech
  readonly botScheduler?: BotScheduler
}

export interface RunningServer {
  readonly port: number
  close(): Promise<void>
}

export const startServer = ({
  port,
  webOrigin,
  clock = new SystemClock(),
  random = new MathRandomSource(),
  botSpeech = new NoBotSpeech(),
  botScheduler = new TimerBotScheduler()
}: ServerOptions): Promise<RunningServer> => {
  const httpServer = createServer()
  const io: LunaServer = new Server(httpServer, { cors: { origin: webOrigin } })
  const wiredBots: { current?: BotsUseCases } = {}
  const bots = (): BotsUseCases => {
    if (wiredBots.current === undefined) throw new Error('Bots are wired before the server listens')
    return wiredBots.current
  }

  const matchUseCases = createMatchUseCases({
    matches: new InMemoryMatchRepository(),
    publisher: new BotAwareMatchPublisher(new SocketMatchPublisher(io), bots),
    clock,
    random,
    ids: new CryptoIdGenerator()
  })

  const chatUseCases = createChatUseCases({
    logs: new InMemoryChatLogRepository(),
    publisher: new BotAwareChatPublisher(new SocketChatPublisher(io), bots),
    audience: {
      membersOf: (code, now) => matchUseCases.describeChatAudience.execute(code, now),
      lastWordsSpoken: async (code, memberId) => {
        await matchUseCases.closeLastWords.execute({ code, memberId })
      }
    },
    clock,
    ids: new CryptoIdGenerator()
  })

  wiredBots.current = createBotsUseCases({
    tables: new InMemoryBotTables(),
    scheduler: botScheduler,
    speech: botSpeech,
    random,
    actions: {
      act: (actor, input) => matchUseCases.actAtNight.execute(actor, input),
      vote: (actor, targetId) => matchUseCases.castVote.execute(actor, targetId),
      lockVote: (actor) => matchUseCases.lockVote.execute(actor),
      avenge: (actor, targetId) => matchUseCases.takeRevenge.execute(actor, targetId),
      haunt: (actor, input) => matchUseCases.haunt.execute(actor, input),
      say: (actor, channel, text) => chatUseCases.sendMessage.execute(actor, { channel, text })
    }
  })

  registerRoomHandlers(
    io,
    createRoomUseCases({
      rooms: new InMemoryRoomRepository(),
      codes: new RandomRoomCodeGenerator(),
      ids: new CryptoIdGenerator(),
      publisher: new BotAwareRoomPublisher(new SocketRoomPublisher(io), bots),
      random,
      starter: {
        start: (opening) => matchUseCases.startMatch.execute(opening),
        isOver: (code) => matchUseCases.isMatchOver.execute(code),
        discard: async (code) => {
          await matchUseCases.discardMatch.execute(code)
          await chatUseCases.discardChat.execute(code)
        }
      }
    })
  )
  registerMatchHandlers(io, matchUseCases)
  registerChatHandlers(io, chatUseCases)

  return new Promise((resolve) => {
    httpServer.listen(port, () => {
      resolve({
        port: (httpServer.address() as AddressInfo).port,
        close: () => new Promise((closed) => void io.close(() => closed()))
      })
    })
  })
}
