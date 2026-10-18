import type { MatchView, NarratorMatchView, PlayerMatchView, Verdict, VoteTally } from '@luna/contracts'
import type { Target } from './night'
import type { Seat } from './seating'

export type RevengeStance = 'shooter' | 'watcher' | 'settled'

export type VerdictOutcome = 'executed' | 'tie' | 'nobody'

export interface VoteProgress {
  readonly voted: number
  readonly locked: number
  readonly voters: number
  readonly remaining: number
}

export interface TallyBar extends VoteTally {
  readonly percent: number
  readonly isTop: boolean
}

export interface VoteLine {
  readonly seat: Seat
  readonly targetId: string | null
  readonly locked: boolean
}

const FULL_BAR = 100

const offered = (seat: Seat): Target => ({ seat, blocked: null })

export const voteTargetsFor = (view: PlayerMatchView, seats: readonly Seat[]): Target[] => {
  if (view.voting === null) return []
  return seats.filter((seat) => seat.alive && !seat.isYou).map(offered)
}

export const revengeStanceOf = (view: MatchView, seats: readonly Seat[]): RevengeStance | null => {
  if (view.revenge === null) return null
  if (!view.revenge.pending) return 'settled'
  const shooterSeat = seats.find((seat) => seat.id === view.revenge?.hunterId)
  return shooterSeat?.isYou ? 'shooter' : 'watcher'
}

export const revengeTargetsFor = (view: PlayerMatchView, seats: readonly Seat[]): Target[] => {
  if (view.revenge === null) return []
  const hunterId = view.revenge.hunterId
  return seats.filter((seat) => seat.alive && seat.id !== hunterId).map(offered)
}

export const voteProgressOf = (view: MatchView): VoteProgress | null => {
  if (view.voting === null) return null
  const { voted, locked, voters } = view.voting
  return { voted, locked, voters, remaining: Math.max(0, voters - voted) }
}

export const tallyBars = (verdict: Verdict): TallyBar[] => {
  const top = Math.max(0, ...verdict.tally.map((entry) => entry.votes))
  return verdict.tally.map((entry) => ({
    ...entry,
    percent: top === 0 ? 0 : Math.round((entry.votes / top) * FULL_BAR),
    isTop: verdict.executedId === entry.targetId
  }))
}

export const verdictOutcomeOf = (verdict: Verdict): VerdictOutcome => {
  if (verdict.executedId !== null) return 'executed'
  return verdict.tie ? 'tie' : 'nobody'
}

export const voteLinesOf = (view: NarratorMatchView, seats: readonly Seat[]): VoteLine[] =>
  seats
    .filter((seat) => seat.alive)
    .map((seat) => {
      const cast = view.votes?.[seat.id]
      return { seat, targetId: cast?.targetId ?? null, locked: cast?.locked ?? false }
    })
