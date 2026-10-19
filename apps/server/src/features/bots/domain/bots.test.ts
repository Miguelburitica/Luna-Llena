import type { ChatMessage } from '@luna/contracts'
import { describe, expect, it } from 'vitest'
import { fixedRandom, mindOf, playerView, rosterFor, SELF } from './BotMind.fixtures'
import { buildBotPrompt, parseSpokenLine } from './botPrompt'
import { BOT_CHAT_LIMITS, ChatBudget } from './ChatBudget'
import { nightActionOf, settledHuntOf, voteTargetOf } from './decisions'
import { openingIntentOf, wolfPlanIntentOf } from './intents'
import { lockDelayOf, nightDelayOf } from './pacing'
import { scriptedLineOf } from './scriptedLines'
import { observeChat, observeView } from './suspicion'

const NO_BOTS: ReadonlySet<string> = new Set()

const village = (authorId: string, text: string, id = text): ChatMessage => ({
  id,
  channel: 'village',
  kind: 'player',
  authorId,
  text,
  sentAt: 0
})

describe('night decisions', () => {
  it('often joins the pack pick when agreeable', () => {
    const mind = mindOf({ personality: 'follower' })
    const view = playerView({
      role: 'werewolf',
      team: 'wolves',
      packIds: ['tato'],
      night: { action: 'hunt', targetId: null, packPicks: { tato: 'ana' }, packVictimId: 'ana' }
    })
    observeView(mind, view, fixedRandom(0.5))
    expect(nightActionOf(mind, view, NO_BOTS, fixedRandom(0))).toEqual({ kind: 'hunt', targetId: 'ana' })
  })

  it('picks its own victim when it does not go along with the pack', () => {
    const mind = mindOf({ personality: 'chaos' })
    const view = playerView({
      role: 'werewolf',
      team: 'wolves',
      packIds: ['tato'],
      night: { action: 'hunt', targetId: null, packPicks: { tato: 'ana' }, packVictimId: 'ana' }
    })
    observeView(mind, view, fixedRandom(0.5))
    const action = nightActionOf(mind, view, NO_BOTS, fixedRandom(0.9))
    expect(action).toEqual({ kind: 'hunt', targetId: 'baba' })
  })

  it('may give in to the pack late in the night, or hold its ground', () => {
    const night = { action: 'hunt' as const, targetId: 'baba', packPicks: { tato: 'ana', bot: 'baba' }, packVictimId: 'baba' }
    const view = playerView({ role: 'werewolf', team: 'wolves', packIds: ['tato'], night })
    const follower = mindOf({ personality: 'follower' })
    observeView(follower, view, fixedRandom(0.5))
    expect(settledHuntOf(follower, view, NO_BOTS, fixedRandom(0))).toEqual({ kind: 'hunt', targetId: 'ana' })
    const chaos = mindOf({ personality: 'chaos' })
    observeView(chaos, view, fixedRandom(0.5))
    expect(settledHuntOf(chaos, view, NO_BOTS, fixedRandom(0.9))).toBeNull()
  })

  it('prefers a bot as the first victim so humans get to play', () => {
    const mind = mindOf()
    const view = playerView({
      role: 'werewolf',
      team: 'wolves',
      night: { action: 'hunt', targetId: null, packPicks: {}, packVictimId: null }
    })
    observeView(mind, view, fixedRandom(0.5))
    expect(nightActionOf(mind, view, new Set([SELF, 'baba']), fixedRandom(0.99))).toEqual({ kind: 'hunt', targetId: 'baba' })
  })

  it('inspects someone it has no vision of, never itself', () => {
    const mind = mindOf()
    const view = playerView({
      role: 'seer',
      night: { action: 'inspect', targetId: null, vision: null },
      visions: [{ round: 1, targetId: 'luis', isWolf: false }],
      round: 2
    })
    observeView(mind, view, fixedRandom(0.5))
    const action = nightActionOf(mind, view, NO_BOTS, fixedRandom(0))
    expect(action?.kind).toBe('inspect')
    expect(action !== null && 'targetId' in action ? [SELF, 'luis'].includes(action.targetId) : true).toBe(false)
  })

  it('never protects the player it protected last night', () => {
    const mind = mindOf()
    const view = playerView({ role: 'doctor', night: { action: 'protect', targetId: null, blockedTargetId: SELF } })
    observeView(mind, view, fixedRandom(0.5))
    for (const value of [0, 0.3, 0.6, 0.99]) {
      const action = nightActionOf(mind, view, NO_BOTS, fixedRandom(value))
      expect(action !== null && 'targetId' in action ? action.targetId : null).not.toBe(SELF)
    }
  })

  it('heals the victim on the first night and keeps the poison without strong suspicion', () => {
    const mind = mindOf()
    const view = playerView({
      role: 'witch',
      night: { action: 'potions', acted: false, victimId: 'ana', heal: false, poisonTargetId: null, healAvailable: true, poisonAvailable: true }
    })
    observeView(mind, view, fixedRandom(0.5))
    expect(nightActionOf(mind, view, NO_BOTS, fixedRandom(0))).toEqual({ kind: 'potions', heal: true, poisonTargetId: null })
  })
})

describe('votes', () => {
  it('never votes against the pack', () => {
    const mind = mindOf()
    const view = playerView({ role: 'werewolf', team: 'wolves', packIds: ['tato'], phase: 'vote' })
    observeView(mind, view, fixedRandom(0.5))
    observeChat(mind, village('ana', 'Tato is the wolf, vote Tato'), rosterFor())
    observeChat(mind, village('caro', 'yes Tato is lying'), rosterFor())
    expect(voteTargetOf(mind, view, fixedRandom(0))).not.toBe('tato')
  })

  it('follows the player the chat accused most today', () => {
    const mind = mindOf({ personality: 'follower' })
    const view = playerView({ phase: 'day' })
    observeView(mind, view, fixedRandom(0.5))
    observeChat(mind, village('ana', 'Luis is sus, vote Luis', '1'), rosterFor())
    observeChat(mind, village('caro', 'Luis lying for sure', '2'), rosterFor())
    observeChat(mind, village('pipe', 'maybe Tato is the wolf', '3'), rosterFor())
    expect(voteTargetOf(mind, playerView({ phase: 'vote' }), fixedRandom(0))).toBe('luis')
  })

  it('trusts its vision of a wolf above anything else', () => {
    const mind = mindOf()
    const view = playerView({ role: 'seer', phase: 'vote', visions: [{ round: 1, targetId: 'tato', isWolf: true }] })
    observeView(mind, view, fixedRandom(0.99))
    expect(voteTargetOf(mind, view, fixedRandom(0))).toBe('tato')
  })

  it('suspects those who voted out a villager', () => {
    const mind = mindOf()
    observeView(mind, playerView({ phase: 'vote' }), fixedRandom(0.5))
    const before = mind.scoreOf('caro')
    observeView(
      mind,
      playerView({
        phase: 'execution',
        players: [
          { id: SELF, alive: true, revealedRole: null },
          { id: 'ana', alive: false, revealedRole: 'villager' },
          { id: 'caro', alive: true, revealedRole: null }
        ],
        verdict: { round: 1, tally: [{ targetId: 'ana', votes: 1, voterIds: ['caro'] }], executedId: 'ana', tie: false, foolWins: false }
      }),
      fixedRandom(0.5)
    )
    expect(mind.scoreOf('caro')).toBeGreaterThan(before)
  })
})

describe('talk', () => {
  it('claims the seer vision of a wolf at the start of the day', () => {
    const mind = mindOf({ difficulty: 'sharp' })
    const view = playerView({ role: 'seer', phase: 'day', visions: [{ round: 1, targetId: 'tato', isWolf: true }] })
    observeView(mind, view, fixedRandom(0.5))
    expect(openingIntentOf(mind, view, rosterFor(), fixedRandom(0))).toEqual({
      kind: 'open-day',
      subject: 'Tato',
      claim: { subject: 'Tato', isWolf: true },
      lie: false
    })
  })

  it('caps the village lines per bot per day', () => {
    const budget = new ChatBudget()
    for (let line = 0; line < BOT_CHAT_LIMITS.villageLinesPerDay; line += 1) {
      expect(budget.allows('bot', 'village', 1)).toBe(true)
      budget.reserve('bot', 'village', 1)
      for (let human = 0; human < 3; human += 1) budget.heard(`human-${line}-${human}`, 'village', false)
    }
    expect(budget.allows('bot', 'village', 1)).toBe(false)
    expect(budget.allows('bot', 'village', 2)).toBe(true)
    expect(budget.allows('baba', 'village', 1)).toBe(true)
  })

  it('keeps bots under 40% of the last ten village messages', () => {
    const budget = new ChatBudget()
    for (const bot of ['b1', 'b2', 'b3', 'b4']) budget.reserve(bot, 'village', 1)
    expect(budget.allows('b5', 'village', 1)).toBe(false)
    expect(budget.allows('b5', 'village', 1, true)).toBe(true)
    for (let human = 0; human < 7; human += 1) budget.heard(`human-${human}`, 'village', false)
    expect(budget.allows('b5', 'village', 1)).toBe(true)
  })

  it('builds a prompt with the real names, the facts it knows and the intent', () => {
    const mind = mindOf({ personality: 'chaos' })
    const view = playerView({ role: 'seer', phase: 'day', visions: [{ round: 1, targetId: 'tato', isWolf: true }] })
    observeView(mind, view, fixedRandom(0.5))
    const prompt = buildBotPrompt({
      mind,
      view,
      roster: rosterFor('es'),
      intent: { kind: 'open-day', subject: 'Tato', claim: { subject: 'Tato', isWolf: true }, lie: false },
      chat: [{ author: 'Ana', text: 'quién fue??' }]
    })
    expect(prompt.system).toContain('Moco-Bot')
    expect(prompt.system).toContain('{"say"')
    expect(prompt.user).toContain('Tato es lobo')
    expect(prompt.user).toContain('Ana: quién fue??')
    expect(prompt.user).toContain('INTENCIÓN: Di que eres la Vidente')
    expect(prompt.examples.length).toBeGreaterThan(0)
  })

  it('reads the line out of the model answer and rejects anything else', () => {
    expect(parseSpokenLine('Sure! {"say": "Tato smells like wet wolf"}')).toBe('Tato smells like wet wolf')
    expect(parseSpokenLine('Tato is the wolf')).toBeNull()
    expect(parseSpokenLine('{"text": "hi"}')).toBeNull()
    expect(parseSpokenLine('{"say": "   "}')).toBeNull()
    expect(parseSpokenLine(undefined)).toBeNull()
  })

  it('has scripted lines in both languages for every intent', () => {
    const intent = { kind: 'answer', asker: 'Ana', question: '?', subject: 'Luis', lie: false } as const
    expect(scriptedLineOf(intent, 'en', 'detective', fixedRandom(0))).toContain('Luis')
    expect(scriptedLineOf(intent, 'es', 'detective', fixedRandom(0))).toContain('Luis')
  })
})

describe('pacing', () => {
  it('acts at night before the timer runs out', () => {
    const view = { ...playerView(), serverNow: 0, phaseEndsAt: 45_000 }
    expect(nightDelayOf(view, fixedRandom(0.999))).toBeLessThan(45_000)
    expect(nightDelayOf(view, fixedRandom(0))).toBeGreaterThanOrEqual(4_000)
  })

  it('locks the vote five seconds before the end', () => {
    expect(lockDelayOf({ ...playerView({ phase: 'vote' }), serverNow: 0, phaseEndsAt: 30_000 })).toBe(25_000)
  })
})

describe('scripted variety', () => {
  it('never repeats a scripted line in a room until the whole pool was used', () => {
    const used = new Set<string>()
    const intent = { kind: 'wolf-plan', subject: 'Ana', against: null } as const
    const lines = Array.from({ length: 5 }, (_, index) => scriptedLineOf(intent, 'es', 'detective', fixedRandom(index * 0.01), used))
    expect(new Set(lines).size).toBe(5)
    expect(scriptedLineOf(intent, 'es', 'detective', fixedRandom(0), used)).toContain('Ana')
  })
})

describe('wolf chat', () => {
  it('argues for its own pick when the packmate wants someone else', () => {
    const view = playerView({
      role: 'werewolf',
      team: 'wolves',
      packIds: ['tato'],
      night: { action: 'hunt', targetId: 'baba', packPicks: { tato: 'ana', [SELF]: 'baba' }, packVictimId: 'baba' }
    })
    expect(wolfPlanIntentOf(view, rosterFor(), SELF)).toEqual({ kind: 'wolf-plan', subject: 'Baba-Tron', against: 'Ana' })
    const agreed = playerView({
      role: 'werewolf',
      team: 'wolves',
      packIds: ['tato'],
      night: { action: 'hunt', targetId: 'ana', packPicks: { tato: 'ana', [SELF]: 'ana' }, packVictimId: 'ana' }
    })
    expect(wolfPlanIntentOf(agreed, rosterFor(), SELF)).toEqual({ kind: 'wolf-plan', subject: 'Ana', against: null })
  })
})
