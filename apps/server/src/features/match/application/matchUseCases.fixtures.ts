import { DEFAULT_ROOM_SETTINGS, type CueEffect, type MatchView, type NarratorMatchView, type PlayerMatchView, type RoleId } from '@luna/contracts'
import { FixedClock, SeededRandom, SequentialIds } from '../../../shared/application/clockAndRandom.fixtures'
import { InMemoryMatchRepository } from '../infrastructure/InMemoryMatchRepository'
import { NARRATOR_ID, START_TIME, unwrap } from '../domain/Match.fixtures'
import { createMatchUseCases } from './matchUseCases'
import type { Actor, HauntDelivery, MatchOpening, MatchPublisher, MemberMatchView } from './ports'

export { NARRATOR_ID, START_TIME, unwrap }

export class RecordingMatchPublisher implements MatchPublisher {
  readonly batches: Array<{ code: string; views: readonly MemberMatchView[] }> = []
  readonly haunts: Array<{ code: string; deliveries: readonly HauntDelivery[] }> = []
  readonly cues: Array<{ code: string; memberIds: readonly string[]; effect: CueEffect }> = []

  publish(code: string, views: readonly MemberMatchView[]): void {
    this.batches.push({ code, views })
  }

  haunt(code: string, deliveries: readonly HauntDelivery[]): void {
    this.haunts.push({ code, deliveries })
  }

  cue(code: string, memberIds: readonly string[], effect: CueEffect): void {
    this.cues.push({ code, memberIds, effect })
  }

  get latest(): readonly MemberMatchView[] {
    return this.batches.at(-1)?.views ?? []
  }

  latestFor(memberId: string): MatchView {
    const entry = this.latest.find((candidate) => candidate.memberId === memberId)
    if (entry === undefined) throw new Error(`No view published for ${memberId}`)
    return entry.view
  }
}

export const asNarrator = (view: MatchView): NarratorMatchView => {
  if (view.perspective !== 'narrator') throw new Error('Expected the narrator view')
  return view
}

export const asPlayer = (view: MatchView): PlayerMatchView => {
  if (view.perspective !== 'player') throw new Error('Expected a player view')
  return view
}

const noCards: Record<RoleId, number> = {
  werewolf: 0,
  villager: 0,
  seer: 0,
  doctor: 0,
  witch: 0,
  hunter: 0,
  fool: 0,
  drunk: 0
}

export const deckOf = (cards: Partial<Record<RoleId, number>>): Record<RoleId, number> => ({ ...noCards, ...cards })

export const SEVEN_CARD_DECK = deckOf({ werewolf: 2, seer: 1, doctor: 1, witch: 1, hunter: 1, fool: 1 })

export const PLAYER_IDS = ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8'] as const

export const openingOf = (overrides: Partial<MatchOpening> = {}): MatchOpening => ({
  code: 'LUNA42',
  narratorId: NARRATOR_ID,
  playerIds: PLAYER_IDS.slice(0, 7),
  deck: SEVEN_CARD_DECK,
  timers: DEFAULT_ROOM_SETTINGS.timers,
  revealRoleOnDeath: true,
  anonymousVotes: false,
  lastWords: false,
  ghostPowers: true,
  ...overrides
})

export const createMatchKit = (seed = 11) => {
  const matches = new InMemoryMatchRepository()
  const publisher = new RecordingMatchPublisher()
  const clock = new FixedClock(START_TIME)
  const useCases = createMatchUseCases({ matches, publisher, clock, random: new SeededRandom(seed), ids: new SequentialIds() })

  const narrator: Actor = { code: 'LUNA42', memberId: NARRATOR_ID }
  const actorOf = (memberId: string): Actor => ({ code: 'LUNA42', memberId })

  const startMatch = async (overrides: Partial<MatchOpening> = {}) => {
    await useCases.startMatch.execute(openingOf(overrides))
    const roles = asNarrator(publisher.latestFor(NARRATOR_ID)).roles
    const holderOf = (role: RoleId): string => {
      const holder = Object.entries(roles).find(([, candidate]) => candidate === role)
      if (holder === undefined) throw new Error(`Nobody holds ${role}`)
      return holder[0]
    }
    const holdersOf = (role: RoleId): string[] =>
      Object.entries(roles).filter(([, candidate]) => candidate === role).map(([memberId]) => memberId)
    return { roles, holderOf, holdersOf }
  }

  return { useCases, matches, publisher, clock, narrator, actorOf, startMatch }
}
