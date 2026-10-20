import type { BotPersonality } from '@luna/contracts'
import { describe, expect, it } from 'vitest'
import { BOT_CHAT_LIMITS } from '../domain/ChatBudget'
import { BOT_IDS, CODE, createBotKit, HUMAN_ID, NAMES, ScriptedSpeech } from './botsUseCases.fixtures'

const TIMERS = { night: 45, day: 0, vote: 30 }

const advanceTo = async (kit: ReturnType<typeof createBotKit>, phase: string) => {
  for (let step = 0; step < 10 && kit.narratorView().phase !== phase; step += 1) {
    await kit.scheduler.advance(60_000)
    await kit.matches.advancePhase.execute(kit.narrator)
  }
}

const livingBotIn = (kit: ReturnType<typeof createBotKit>): string => {
  const living = kit.narratorView().players.filter((player) => player.alive).map((player) => player.id)
  const bot = BOT_IDS.find((id) => living.includes(id))
  if (bot === undefined) throw new Error('No living bot')
  return bot
}

describe('Bots in a match', () => {
  it('play a full game with one human to a winner without a single rejected command', async () => {
    const kit = createBotKit()
    await kit.start({ timers: TIMERS, lastWords: true })
    for (let step = 0; step < 80 && kit.narratorView().pendingWinner === null; step += 1) {
      await kit.scheduler.advance(60_000)
      await kit.matches.advancePhase.execute(kit.narrator)
    }
    expect(kit.narratorView().pendingWinner).not.toBeNull()
    expect(kit.rejected()).toEqual([])
    expect(kit.commands.some((command) => command.kind === 'act')).toBe(true)
    expect(kit.commands.some((command) => command.kind === 'vote')).toBe(true)
  })

  it('only ever see their own player view', async () => {
    const kit = createBotKit()
    await kit.start({ timers: TIMERS })
    await kit.scheduler.advance(60_000)
    expect(kit.observedViews.length).toBeGreaterThan(0)
    expect(kit.observedViews.every((entry) => entry.perspective === 'player')).toBe(true)
  })

  it('act before the night timer runs out', async () => {
    const kit = createBotKit()
    await kit.start({ timers: TIMERS })
    await kit.scheduler.advance(44_000)
    const waiting = kit.narratorView().night?.waitingOn ?? []
    expect(waiting.filter((memberId) => memberId !== HUMAN_ID)).toEqual([])
  })

  it('answer a human who names them in the village chat', async () => {
    const kit = createBotKit()
    await kit.start({ timers: TIMERS })
    await advanceTo(kit, 'day')
    await kit.scheduler.advance(60_000)
    const bot = livingBotIn(kit)
    const before = kit.said('village').filter((message) => message.authorId === bot).length
    const asked = await kit.humanSays('village', `${NAMES[bot]}, where were you last night?`)
    expect(asked.ok).toBe(true)
    await kit.scheduler.advance(10_000)
    expect(kit.said('village').filter((message) => message.authorId === bot).length).toBe(before + 1)
  })

  it('never write more than the daily budget, however much they are asked', async () => {
    const kit = createBotKit()
    await kit.start({ timers: TIMERS })
    await advanceTo(kit, 'day')
    const bot = livingBotIn(kit)
    const round = kit.narratorView().round
    for (let question = 0; question < 10; question += 1) {
      await kit.humanSays('village', `${NAMES[bot]}?? answer me ${question}`)
      await kit.humanSays('village', `ok ${question}`)
      await kit.humanSays('village', `hmm ${question}`)
      await kit.scheduler.advance(10_000)
    }
    const lines = kit.said('village').filter((message) => message.authorId === bot && message.sentAt > 0)
    expect(kit.narratorView().round).toBe(round)
    expect(lines.length).toBeLessThanOrEqual(BOT_CHAT_LIMITS.villageLinesPerDay)
  })

  it('fall back to scripted lines when no model answers', async () => {
    const speech = new ScriptedSpeech(null)
    const kit = createBotKit({ speech })
    await kit.start({ timers: TIMERS })
    await advanceTo(kit, 'day')
    const bot = livingBotIn(kit)
    await kit.humanSays('village', `${NAMES[bot]}, explain yourself`)
    await kit.scheduler.advance(10_000)
    const answer = kit.said('village').findLast((message) => message.authorId === bot)
    expect(speech.prompts.length).toBeGreaterThan(0)
    expect(answer?.text.length).toBeGreaterThan(0)
  })

  it('say what the model wrote when it answers', async () => {
    const kit = createBotKit({ speech: new ScriptedSpeech('Me? I was picking my nose all night.') })
    await kit.start({ timers: TIMERS })
    await advanceTo(kit, 'day')
    const bot = livingBotIn(kit)
    await kit.humanSays('village', `${NAMES[bot]}, explain yourself`)
    await kit.scheduler.advance(10_000)
    expect(kit.said('village').findLast((message) => message.authorId === bot)?.text).toBe(
      'Me? I was picking my nose all night.'
    )
  })
})

describe('Bots talking to bots', () => {
  it('answer a bot that accuses them by name, within the bot share of the chat', async () => {
    const profiles = Object.fromEntries(BOT_IDS.map((id) => [id, { personality: 'paranoid', difficulty: 'normal' } as const]))
    const kit = createBotKit({ profiles })
    await kit.start({ timers: TIMERS })
    await advanceTo(kit, 'day')
    await kit.scheduler.advance(120_000)
    const living = kit.narratorView().players.filter((player) => player.alive).map((player) => player.id)
    const [accuser, accused] = BOT_IDS.filter((id) => living.includes(id))
    if (accuser === undefined || accused === undefined) throw new Error('Not enough living bots')
    for (let human = 0; human < 10; human += 1) await kit.humanSays('village', `hmm ${human}`)
    const before = kit.said('village').filter((message) => message.authorId === accused).length
    for (let attempt = 0; attempt < 3; attempt += 1) {
      await kit.chat.sendMessage.execute({ code: CODE, memberId: accuser }, { channel: 'village', text: `${NAMES[accused]} is the wolf ${attempt}` })
      await kit.scheduler.advance(10_000)
    }
    expect(kit.said('village').filter((message) => message.authorId === accused).length).toBeGreaterThan(before)
  })
})

const everyBot = (personality: BotPersonality) =>
  Object.fromEntries(BOT_IDS.map((id) => [id, { personality, difficulty: 'normal' } as const]))

const botLinesBetween = (kit: ReturnType<typeof createBotKit>, from: number, to: number) =>
  kit.said('village').filter((message) => BOT_IDS.includes(message.authorId as (typeof BOT_IDS)[number]) && message.sentAt >= from && message.sentAt < to)

const dawnReactionCounts = async (kit: ReturnType<typeof createBotKit>): Promise<number[]> => {
  const counts: number[] = []
  for (let step = 0; step < 40 && kit.narratorView().pendingWinner === null; step += 1) {
    const phase = kit.narratorView().phase
    const from = kit.clock.now()
    await kit.scheduler.advance(60_000)
    if (phase === 'dawn' && (kit.narratorView().dawn?.deaths.length ?? 0) > 0) counts.push(botLinesBetween(kit, from, kit.clock.now() + 1).length)
    await kit.matches.advancePhase.execute(kit.narrator)
  }
  return counts
}

describe('Bot tempo', () => {
  it('take turns in the village chat and read the line before theirs', async () => {
    const speech = new ScriptedSpeech(null)
    const kit = createBotKit({ speech, profiles: everyBot('paranoid') })
    await kit.start({ timers: TIMERS })
    await advanceTo(kit, 'day')
    const from = kit.clock.now()
    await kit.scheduler.advance(120_000)
    const lines = botLinesBetween(kit, from, kit.clock.now() + 1)
    expect(lines.length).toBeGreaterThanOrEqual(3)
    for (let index = 1; index < lines.length; index += 1) {
      const [earlier, later] = [lines[index - 1], lines[index]]
      if (earlier === undefined || later === undefined) throw new Error('Missing line')
      expect(later.sentAt - earlier.sentAt).toBeGreaterThanOrEqual(4_000)
      const promptOfLater = speech.prompts.filter((prompt) => prompt.system.includes(`YOU: ${NAMES[later.authorId]}.`)).at(-1)
      expect(promptOfLater?.user).toContain(earlier.text)
    }
  })

  it('let at most two bots react to the same dawn', async () => {
    const kit = createBotKit({ profiles: everyBot('paranoid') })
    await kit.start({ timers: TIMERS })
    const counts = await dawnReactionCounts(kit)
    expect(counts.length).toBeGreaterThan(0)
    expect(counts.some((count) => count > 0)).toBe(true)
    expect(counts.every((count) => count <= 2)).toBe(true)
  })

  it('keep followers from opening a dawn nobody reacted to', async () => {
    const kit = createBotKit({ profiles: everyBot('follower') })
    await kit.start({ timers: TIMERS })
    const counts = await dawnReactionCounts(kit)
    expect(counts.length).toBeGreaterThan(0)
    expect(counts.every((count) => count === 0)).toBe(true)
  })
})

describe('Witch bot', () => {
  it('heals the first victim even when the wolves pick after it acted', async () => {
    const kit = createBotKit({ seed: 3 })
    const roles = await kit.start({ timers: TIMERS })
    const witch = Object.entries(roles).find(([, role]) => role === 'witch')?.[0]
    const wolves = Object.entries(roles).filter(([, role]) => role === 'werewolf').map(([id]) => id)
    expect(witch).not.toBe(HUMAN_ID)
    await kit.scheduler.advance(44_000)
    const victim = kit.narratorView().night?.preview.victimId
    expect(victim).not.toBeNull()
    expect(wolves.includes(String(victim))).toBe(false)
    await kit.scheduler.advance(10_000)
    expect(kit.narratorView().night?.preview.healing).toBe(true)
  })
})
