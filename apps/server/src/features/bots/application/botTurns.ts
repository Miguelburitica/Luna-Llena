import { BOT_LIMITS, type ChatChannel, type PlayerMatchView } from '@luna/contracts'
import type { BotMind } from '../domain/BotMind'
import type { BotTable } from '../domain/BotTable'
import { buildBotPrompt } from '../domain/botPrompt'
import { hauntOf, nightActionOf, revengeTargetOf, voteTargetOf } from '../domain/decisions'
import {
  answerIntentOf,
  dawnIntentOf,
  ghostIntentOf,
  lastWordsIntentOf,
  openingIntentOf,
  voteIntentOf,
  wolfPlanIntentOf,
  type BotIntent
} from '../domain/intents'
import { lockDelayOf, nightDelayOf, talkDelayOf, voteDelayOf } from '../domain/pacing'
import { scriptedLineOf } from '../domain/scriptedLines'
import type { Actor, BotContext } from './ports'

const OPENING_ODDS = { paranoid: 0.8, follower: 0.5, detective: 0.8, chaos: 0.8, quiet: 0.3 } as const
const TALKATIVE = new Set(['paranoid', 'chaos', 'detective'])
const DAWN_REACTION_ODDS = 0.3
const GHOST_ODDS = 0.5

const actorOf = (table: BotTable, mind: BotMind): Actor => ({ code: table.code, memberId: mind.memberId })

const currentView = (mind: BotMind, phaseKey: string): PlayerMatchView | null => {
  const view = mind.view
  if (view === null || mind.phaseKey !== phaseKey || view.outcome !== null) return null
  return view
}

const later = (context: BotContext, table: BotTable, delayMs: number, task: () => Promise<void>): void =>
  context.scheduler.after(table.code, delayMs, task)

export const speak = async (
  context: BotContext,
  table: BotTable,
  mind: BotMind,
  channel: ChatChannel,
  intent: BotIntent
): Promise<void> => {
  const view = mind.view
  if (view === null || !view.chat.write.includes(channel)) return
  const phaseKey = mind.phaseKey
  if (!table.budget.allows(mind.memberId, channel, view.round, intent.kind === 'answer')) return
  table.budget.reserve(mind.memberId, channel, view.round)
  let text: string | null = null
  if (table.speechCalls < BOT_LIMITS.maxSpeechCallsPerGame) {
    table.speechCalls += 1
    text = await context.speech.say(buildBotPrompt({ mind, view, roster: table.roster, intent, chat: table.chat }))
  }
  const fresh = mind.view
  if (fresh === null || mind.phaseKey !== phaseKey || !fresh.chat.write.includes(channel)) return
  const line = text ?? scriptedLineOf(intent, table.roster.language, mind.profile.personality, context.random)
  await context.actions.say(actorOf(table, mind), channel, line)
}

const planNight = (context: BotContext, table: BotTable, mind: BotMind, view: PlayerMatchView): void => {
  const phaseKey = mind.phaseKey
  const delay = nightDelayOf(view, context.random)
  later(context, table, delay, async () => {
    const current = currentView(mind, phaseKey)
    if (current === null || !mind.isAlive) return
    const input = nightActionOf(mind, current, new Set(table.roster.bots.keys()), context.random)
    if (input !== null) await context.actions.act(actorOf(table, mind), input)
  })
  if (view.you.packIds.length === 0) return
  later(context, table, delay + talkDelayOf(2, 5, context.random), async () => {
    const current = currentView(mind, phaseKey)
    const intent = current === null ? null : wolfPlanIntentOf(current, table.roster)
    if (intent !== null) await speak(context, table, mind, 'wolves', intent)
  })
}

const planDawn = (context: BotContext, table: BotTable, mind: BotMind, view: PlayerMatchView): void => {
  const intent = dawnIntentOf(view, table.roster)
  if (intent === null || context.random.next() >= DAWN_REACTION_ODDS) return
  later(context, table, talkDelayOf(3, 10, context.random), () => speak(context, table, mind, 'village', intent))
}

const planDay = (context: BotContext, table: BotTable, mind: BotMind): void => {
  if (context.random.next() >= OPENING_ODDS[mind.profile.personality]) return
  const order = [...table.minds.keys()].indexOf(mind.memberId)
  const phaseKey = mind.phaseKey
  later(context, table, talkDelayOf(5, 10, context.random) + order * 7000, async () => {
    const current = currentView(mind, phaseKey)
    const intent = current === null ? null : openingIntentOf(mind, current, table.roster, context.random)
    if (intent !== null) await speak(context, table, mind, 'village', intent)
  })
}

const planVote = (context: BotContext, table: BotTable, mind: BotMind, view: PlayerMatchView): void => {
  const phaseKey = mind.phaseKey
  const voteDelay = voteDelayOf(view, context.random)
  later(context, table, voteDelay, async () => {
    const current = currentView(mind, phaseKey)
    if (current === null || !mind.isAlive || current.you.vote?.locked === true) return
    const target = voteTargetOf(mind, current, context.random)
    if (target === null) return
    const cast = await context.actions.vote(actorOf(table, mind), target)
    if (cast.ok && TALKATIVE.has(mind.profile.personality) && context.random.next() < 0.5) {
      later(context, table, talkDelayOf(2, 5, context.random), () =>
        speak(context, table, mind, 'village', voteIntentOf(mind, current, table.roster, target))
      )
    }
  })
  later(context, table, Math.max(lockDelayOf(view), voteDelay + 1500), () => lockVote(context, table, mind, phaseKey))
}

const lockVote = async (context: BotContext, table: BotTable, mind: BotMind, phaseKey: string): Promise<void> => {
  const current = currentView(mind, phaseKey)
  if (current === null || !mind.isAlive || current.you.vote === null || current.you.vote.locked) return
  if (current.you.vote.targetId === null || mind.profile.personality === 'paranoid') {
    const target = voteTargetOf(mind, current, context.random)
    if (target !== null && target !== current.you.vote.targetId) await context.actions.vote(actorOf(table, mind), target)
  }
  if (currentView(mind, phaseKey)?.you.vote?.targetId !== null) await context.actions.lockVote(actorOf(table, mind))
}

const planGhost = (context: BotContext, table: BotTable, mind: BotMind): void => {
  if (mind.markOnce('ghost-line') && context.random.next() < GHOST_ODDS) {
    later(context, table, talkDelayOf(5, 15, context.random), async () => {
      const view = mind.view
      if (view !== null) await speak(context, table, mind, 'ghosts', ghostIntentOf(mind, view, table.roster, context.random))
    })
  }
  if (mind.markOnce('haunt') && context.random.next() < GHOST_ODDS) {
    later(context, table, talkDelayOf(8, 20, context.random), async () => {
      const view = mind.view
      const input = view === null ? null : hauntOf(mind, view, table.roster.language, context.random)
      if (input !== null) await context.actions.haunt(actorOf(table, mind), input)
    })
  }
}

export const planPhase = (context: BotContext, table: BotTable, mind: BotMind, view: PlayerMatchView): void => {
  if (!mind.isAlive) {
    if (view.you.haunt !== null) planGhost(context, table, mind)
    return
  }
  if (view.phase === 'night') planNight(context, table, mind, view)
  if (view.phase === 'dawn') planDawn(context, table, mind, view)
  if (view.phase === 'day') planDay(context, table, mind)
  if (view.phase === 'vote') planVote(context, table, mind, view)
}

export const reactWithinPhase = (context: BotContext, table: BotTable, mind: BotMind, view: PlayerMatchView): void => {
  const phaseKey = mind.phaseKey
  const revenge = view.revenge
  if (revenge?.pending === true && revenge.hunterId === mind.memberId && mind.markOnce(`revenge:${phaseKey}`)) {
    later(context, table, talkDelayOf(2, 5, context.random), async () => {
      const current = mind.view
      const target = current === null ? null : revengeTargetOf(mind, current, context.random)
      if (target !== null) await context.actions.avenge(actorOf(table, mind), target)
    })
  }
  if (view.chat.lastWordsUntil !== null && mind.markOnce(`last-words:${phaseKey}`)) {
    later(context, table, talkDelayOf(2, 4, context.random), async () => {
      const current = mind.view
      if (current !== null) {
        await speak(context, table, mind, 'village', lastWordsIntentOf(mind, current, table.roster, context.random))
      }
    })
  }
  const potions = view.you.night
  if (
    view.phase === 'night' &&
    mind.isAlive &&
    potions?.action === 'potions' &&
    potions.victimId !== null &&
    potions.healAvailable &&
    mind.markOnce(`victim:${phaseKey}:${potions.victimId}`)
  ) {
    later(context, table, talkDelayOf(3, 8, context.random), async () => {
      const current = currentView(mind, phaseKey)
      if (current === null || !mind.isAlive) return
      const input = nightActionOf(mind, current, new Set(table.roster.bots.keys()), context.random)
      if (input !== null) await context.actions.act(actorOf(table, mind), input)
    })
  }
  const voting = view.voting
  const vote = view.you.vote
  if (
    view.phase === 'vote' &&
    voting !== null &&
    vote !== null &&
    !vote.locked &&
    vote.targetId !== null &&
    voting.locked === voting.voters - 1 &&
    mind.markOnce(`lock-now:${phaseKey}`)
  ) {
    later(context, table, talkDelayOf(1, 2, context.random), () => lockVote(context, table, mind, phaseKey))
  }
}

export const planAnswer = (
  context: BotContext,
  table: BotTable,
  mind: BotMind,
  askerId: string,
  question: string
): void => {
  later(context, table, talkDelayOf(3, 8, context.random), async () => {
    const view = mind.view
    if (view === null || !mind.isAlive) return
    await speak(context, table, mind, 'village', answerIntentOf(mind, view, table.roster, askerId, question, context.random))
  })
}
