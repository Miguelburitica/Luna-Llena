import { AWARD_IDS, type Award, type MatchOutcome, type MatchView, type RoleId, type TeamId, type TimelineEntry } from '@luna/contracts'

export interface Chapter {
  readonly id: string
  readonly period: 'night' | 'day'
  readonly round: number
  readonly entries: readonly TimelineEntry[]
}

export interface PlotTwist {
  readonly seen: RoleId
  readonly was: RoleId
}

export interface Fact {
  readonly key: string
  readonly memberIds: readonly string[]
  readonly count: number
  readonly role: RoleId | null
  readonly word?: string
}

const fact = (
  key: string,
  memberIds: readonly string[] = [],
  count = 0,
  role: RoleId | null = null,
  word?: string
): Fact => ({
  key,
  memberIds,
  count,
  role,
  ...(word === undefined ? {} : { word })
})

export const timelineChapters = (outcome: MatchOutcome): Chapter[] => {
  const votedRounds = new Set<number>()
  const resolvedRounds = new Set<number>()
  const chapters = new Map<string, { period: 'night' | 'day'; round: number; entries: TimelineEntry[] }>()
  for (const entry of outcome.timeline) {
    const isDay =
      entry.kind === 'vote' || votedRounds.has(entry.round) || (entry.kind === 'haunt' && resolvedRounds.has(entry.round))
    if (entry.kind === 'vote') votedRounds.add(entry.round)
    if (entry.kind === 'night') resolvedRounds.add(entry.round)
    const period = isDay ? 'day' : 'night'
    const id = `${period}-${entry.round}`
    const chapter = chapters.get(id) ?? { period, round: entry.round, entries: [] }
    chapter.entries.push(entry)
    chapters.set(id, chapter)
  }
  return [...chapters.entries()]
    .map(([id, chapter]) => ({ id, ...chapter }))
    .sort((first, second) => first.round - second.round || (first.period === second.period ? 0 : first.period === 'night' ? -1 : 1))
}

export const plotTwistOf = (view: MatchView, myId: string | undefined): PlotTwist | null => {
  if (view.perspective !== 'player') return null
  const was = view.players.find((player) => player.id === myId)?.revealedRole ?? null
  return was !== null && was !== view.you.role ? { seen: view.you.role, was } : null
}

export const flavorLineOf = (winner: TeamId): string => `match.over.flavor.${winner}`

const nightFacts = (entry: Extract<TimelineEntry, { kind: 'night' }>): Fact[] => [
  entry.victimId === null ? fact('noVictim') : fact('hunt', [entry.victimId]),
  ...(entry.protectedId === null
    ? []
    : [fact(entry.protectedId === entry.victimId ? 'doctorSaved' : 'doctorProtected', [entry.protectedId])]),
  ...(entry.healed && entry.victimId !== null ? [fact('witchHealed', [entry.victimId])] : []),
  ...(entry.poisonedId === null ? [] : [fact('witchPoisoned', [entry.poisonedId])]),
  ...entry.visions.map((vision) =>
    fact(`${vision.fromDrunk ? 'drunkVision' : 'vision'}${vision.isWolf ? 'Wolf' : 'Clear'}`, [vision.targetId])
  ),
  entry.deaths.length === 0 ? fact('noDeaths') : fact('died', entry.deaths, entry.deaths.length)
]

const voteFacts = (
  entry: Extract<TimelineEntry, { kind: 'vote' }>,
  roleOf: (memberId: string) => RoleId | null
): Fact[] => {
  const { verdict } = entry
  const ballots = verdict.tally.map((line) => fact('ballot', [line.targetId, ...(line.voterIds ?? [])], line.votes))
  const topVotes = Math.max(0, ...verdict.tally.map((line) => line.votes))
  const leaders = verdict.tally.filter((line) => line.votes === topVotes).map((line) => line.targetId)
  if (verdict.tally.length === 0) return [fact('noVotes')]
  if (verdict.executedId === null) return [...ballots, fact('tie', leaders, topVotes)]
  const role = roleOf(verdict.executedId)
  return [
    ...ballots,
    fact('executed', [verdict.executedId], topVotes),
    ...(role === null ? [] : [fact('executedRole', [verdict.executedId], 0, role)]),
    ...(verdict.foolWins ? [fact('foolWon', [verdict.executedId])] : [])
  ]
}

const hauntFacts = (entry: Extract<TimelineEntry, { kind: 'haunt' }>): Fact[] => {
  if (entry.haunt === 'flicker') return [fact('hauntFlicker', [entry.ghostId])]
  return [
    fact(
      'hauntWhisper',
      entry.targetId === null ? [entry.ghostId] : [entry.ghostId, entry.targetId],
      0,
      null,
      entry.word ?? ''
    )
  ]
}

export const factsOf = (entry: TimelineEntry, roleOf: (memberId: string) => RoleId | null): Fact[] => {
  switch (entry.kind) {
    case 'night':
      return nightFacts(entry)
    case 'vote':
      return voteFacts(entry, roleOf)
    case 'revenge':
      return [entry.targetId === null ? fact('hunterHeld', [entry.hunterId]) : fact('hunterShot', [entry.hunterId, entry.targetId])]
    case 'narrator':
      return [fact(entry.alive ? 'narratorRevived' : 'narratorKilled', [entry.memberId])]
    case 'haunt':
      return hauntFacts(entry)
  }
}

export const orderedAwards = (awards: readonly (Award | null)[]): Award[] =>
  AWARD_IDS.flatMap((id) => awards.find((award) => award?.award === id) ?? [])
