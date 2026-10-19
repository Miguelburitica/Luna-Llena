import {
  DEFAULT_ROOM_SETTINGS,
  type BotLanguage,
  type BotProfile,
  type ChatChannel,
  type MemberView,
  type PlayerMatchView,
  type RoomSnapshot
} from '@luna/contracts'
import { FixedClock, SeededRandom, SequentialIds } from '../../../shared/application/clockAndRandom.fixtures'
import { BotAwareChatPublisher, BotAwareMatchPublisher } from '../../../shared/infrastructure/botAwarePublishers'
import { createChatUseCases } from '../../chat/application/chatUseCases'
import { RecordingChatPublisher } from '../../chat/application/chatUseCases.fixtures'
import { InMemoryChatLogRepository } from '../../chat/infrastructure/InMemoryChatLogRepository'
import { createMatchUseCases } from '../../match/application/matchUseCases'
import { InMemoryMatchRepository } from '../../match/infrastructure/InMemoryMatchRepository'
import { asNarrator, asPlayer, openingOf, RecordingMatchPublisher, SEVEN_CARD_DECK } from '../../match/application/matchUseCases.fixtures'
import type { MatchOpening } from '../../match/application/ports'
import { NARRATOR_ID, START_TIME } from '@luna/rules/fixtures'
import type { BotPrompt } from '../domain/botPrompt'
import { InMemoryBotTables } from '../infrastructure/InMemoryBotTables'
import { createBotsUseCases, type BotsUseCases } from './botsUseCases'
import type { Actor, BotActions, BotScheduler, BotSpeech, CommandResult } from './ports'

export const CODE = 'LUNA42'
export const HUMAN_ID = 'p1'
export const BOT_IDS = ['p2', 'p3', 'p4', 'p5', 'p6', 'p7'] as const
export const NAMES: Readonly<Record<string, string>> = {
  [NARRATOR_ID]: 'Nico',
  p1: 'Ana',
  p2: 'Moco-Bot',
  p3: 'Verruga 3000',
  p4: 'Baba-Tron',
  p5: 'Lagaña-Matic',
  p6: 'Mosca-Droid',
  p7: 'Chicle-X'
}

const PERSONALITIES: readonly BotProfile['personality'][] = ['paranoid', 'follower', 'detective', 'chaos', 'quiet', 'detective']

export class FakeScheduler implements BotScheduler {
  private tasks: Array<{ code: string; at: number; order: number; task: () => Promise<void> }> = []
  private order = 0

  constructor(private readonly clock: FixedClock) {}

  after(code: string, delayMs: number, task: () => Promise<void>): void {
    this.tasks.push({ code, at: this.clock.now() + delayMs, order: (this.order += 1), task })
  }

  cancelAll(code: string): void {
    this.tasks = this.tasks.filter((entry) => entry.code !== code)
  }

  get pending(): number {
    return this.tasks.length
  }

  async advance(milliseconds: number): Promise<void> {
    const target = this.clock.now() + milliseconds
    for (;;) {
      const due = this.tasks
        .filter((entry) => entry.at <= target)
        .sort((first, second) => first.at - second.at || first.order - second.order)[0]
      if (due === undefined) break
      this.tasks = this.tasks.filter((entry) => entry !== due)
      this.clock.advanceBy(Math.max(0, due.at - this.clock.now()))
      await due.task()
    }
    this.clock.advanceBy(Math.max(0, target - this.clock.now()))
  }
}

export class ScriptedSpeech implements BotSpeech {
  readonly prompts: BotPrompt[] = []

  constructor(private readonly reply: string | null = null) {}

  async say(prompt: BotPrompt): Promise<string | null> {
    this.prompts.push(prompt)
    return this.reply
  }
}

export interface IssuedCommand {
  readonly kind: string
  readonly actor: Actor
  readonly result: CommandResult
}

const snapshotOf = (bots: ReadonlyMap<string, BotProfile>, language: BotLanguage, status: RoomSnapshot['status']): RoomSnapshot => {
  const member = (id: string, isNarrator: boolean): MemberView => ({
    id,
    name: NAMES[id] ?? id,
    avatar: null,
    isNarrator,
    bot: bots.get(id) ?? null,
    ready: true,
    connected: true
  })
  return {
    code: CODE,
    name: 'Los Primos',
    status,
    voiceCallUrl: null,
    settings: { ...DEFAULT_ROOM_SETTINGS, botLanguage: language },
    members: [member(NARRATOR_ID, true), member(HUMAN_ID, false), ...BOT_IDS.map((id) => member(id, false))],
    botCast: 'solitude',
    startReadiness: { canStart: true, unmet: [], notReadyMemberIds: [], playerCount: 7, deckSize: 7 }
  }
}

export interface BotKitOptions {
  readonly seed?: number
  readonly language?: BotLanguage
  readonly speech?: BotSpeech
  readonly profiles?: Partial<Record<string, BotProfile>>
}

export const createBotKit = ({ seed = 7, language = 'en', speech = new ScriptedSpeech(), profiles = {} }: BotKitOptions = {}) => {
  const clock = new FixedClock(START_TIME)
  const random = new SeededRandom(seed)
  const scheduler = new FakeScheduler(clock)
  const matchRecorder = new RecordingMatchPublisher()
  const chatRecorder = new RecordingChatPublisher()
  const commands: IssuedCommand[] = []
  const observedViews: Array<{ memberId: string; perspective: string }> = []
  const wired: { bots?: BotsUseCases } = {}
  const botsOf = (): BotsUseCases => {
    if (wired.bots === undefined) throw new Error('Bots not wired')
    return wired.bots
  }

  const matches = createMatchUseCases({
    matches: new InMemoryMatchRepository(),
    publisher: new BotAwareMatchPublisher(matchRecorder, botsOf),
    clock,
    random,
    ids: new SequentialIds()
  })
  const chat = createChatUseCases({
    logs: new InMemoryChatLogRepository(),
    publisher: new BotAwareChatPublisher(chatRecorder, botsOf),
    audience: {
      membersOf: (code, now) => matches.describeChatAudience.execute(code, now),
      lastWordsSpoken: async (code, memberId) => {
        await matches.closeLastWords.execute({ code, memberId })
      }
    },
    clock,
    ids: new SequentialIds()
  })

  const record = async (kind: string, actor: Actor, run: () => Promise<CommandResult>): Promise<CommandResult> => {
    const result = await run()
    commands.push({ kind, actor, result })
    return result
  }

  const actions: BotActions = {
    act: (actor, input) => record('act', actor, () => matches.actAtNight.execute(actor, input)),
    vote: (actor, targetId) => record('vote', actor, () => matches.castVote.execute(actor, targetId)),
    lockVote: (actor) => record('lock', actor, () => matches.lockVote.execute(actor)),
    avenge: (actor, targetId) => record('avenge', actor, () => matches.takeRevenge.execute(actor, targetId)),
    haunt: (actor, input) => record('haunt', actor, () => matches.haunt.execute(actor, input)),
    say: (actor, channel, text) => record(`say:${channel}`, actor, () => chat.sendMessage.execute(actor, { channel, text }))
  }

  const real = createBotsUseCases({ tables: new InMemoryBotTables(), scheduler, speech, actions, random })
  const bots: BotsUseCases = {
    ...real,
    observeMatchView: {
      execute: (code, memberId, view) => {
        if (BOT_IDS.includes(memberId as (typeof BOT_IDS)[number])) observedViews.push({ memberId, perspective: view.perspective })
        real.observeMatchView.execute(code, memberId, view)
      }
    } as BotsUseCases['observeMatchView']
  }

  const profileMap = new Map<string, BotProfile>(
    BOT_IDS.map((id, index) => [id, profiles[id] ?? { personality: PERSONALITIES[index] ?? 'detective', difficulty: 'normal' }])
  )
  wired.bots = bots
  bots.observeRoomSnapshot.execute(snapshotOf(profileMap, language, 'lobby'))

  const narrator: Actor = { code: CODE, memberId: NARRATOR_ID }
  const human: Actor = { code: CODE, memberId: HUMAN_ID }

  const start = async (overrides: Partial<MatchOpening> = {}) => {
    botsOf().observeRoomSnapshot.execute(snapshotOf(profileMap, language, 'in-game'))
    await matches.startMatch.execute(
      openingOf({ playerIds: [HUMAN_ID, ...BOT_IDS], deck: SEVEN_CARD_DECK, ...overrides })
    )
    return asNarrator(matchRecorder.latestFor(NARRATOR_ID)).roles
  }

  const narratorView = () => asNarrator(matchRecorder.latestFor(NARRATOR_ID))
  const viewOf = (memberId: string): PlayerMatchView => asPlayer(matchRecorder.latestFor(memberId))
  const humanSays = (channel: ChatChannel, text: string) => chat.sendMessage.execute(human, { channel, text })
  const rejected = () => commands.filter((command) => !command.result.ok)
  const said = (channel: ChatChannel) =>
    chatRecorder.deliveries
      .map((delivery) => delivery.message)
      .filter((message, index, all) => message.channel === channel && all.findIndex((other) => other.id === message.id) === index)

  return {
    clock,
    scheduler,
    matches,
    chat,
    commands,
    observedViews,
    narrator,
    human,
    start,
    narratorView,
    viewOf,
    humanSays,
    rejected,
    said
  }
}
