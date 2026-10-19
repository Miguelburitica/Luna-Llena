import {
  done,
  err,
  matchError,
  ok,
  ROLE_IDS,
  tableError,
  type MatchError,
  type Result,
  type RoleId,
  type TableError
} from '@luna/contracts'
import { dealRoles, Match } from '@luna/rules'
import { isTableSetup, type TableSetup } from './tableSetup'

export const TABLE_NARRATOR_ID = 'narrator'
export const TABLE_CODE = 'TABLE'
export const JOURNAL_VERSION = 1

interface RandomNumbers {
  next(): number
}

export interface DealtSeat {
  readonly id: string
  readonly role: RoleId
}

export type JournalEntry =
  | { readonly kind: 'hunt'; readonly targetId: string; readonly at: number }
  | { readonly kind: 'inspect'; readonly seerId: string; readonly targetId: string; readonly draw: number; readonly at: number }
  | { readonly kind: 'protect'; readonly doctorId: string; readonly targetId: string; readonly at: number }
  | {
      readonly kind: 'potions'
      readonly witchId: string
      readonly heal: boolean
      readonly poisonTargetId: string | null
      readonly at: number
    }
  | { readonly kind: 'vote'; readonly voterId: string; readonly targetId: string | null; readonly at: number }
  | { readonly kind: 'avenge'; readonly targetId: string; readonly at: number }
  | { readonly kind: 'skip-revenge'; readonly at: number }
  | { readonly kind: 'set-alive'; readonly seatId: string; readonly alive: boolean; readonly at: number }
  | { readonly kind: 'advance'; readonly at: number }
  | { readonly kind: 'extend-timer'; readonly at: number }
  | { readonly kind: 'keep-playing'; readonly at: number }
  | { readonly kind: 'end-game'; readonly at: number }

export interface TableJournal {
  readonly version: number
  readonly setup: TableSetup
  readonly seats: readonly DealtSeat[]
  readonly seen: number
  readonly logbookOpen: boolean
  readonly startedAt: number
  readonly entries: readonly JournalEntry[]
}

export type DealProgress =
  | { readonly stage: 'dealing'; readonly seatIndex: number }
  | { readonly stage: 'hand-back' }
  | { readonly stage: 'logbook' }

export const seatIdOf = (index: number): string => `seat-${index + 1}`

export const seatIndexOf = (seatId: string): number => Number(seatId.replace('seat-', '')) - 1

export const dealJournal = (setup: TableSetup, random: RandomNumbers, now: number): TableJournal => ({
  version: JOURNAL_VERSION,
  setup,
  seats: dealRoles(setup.deck, setup.names.map((_, index) => seatIdOf(index)), random).map((seat) => ({
    id: seat.memberId,
    role: seat.role
  })),
  seen: 0,
  logbookOpen: false,
  startedAt: now,
  entries: []
})

export const dealProgressOf = (journal: TableJournal): DealProgress => {
  if (journal.seen < journal.seats.length) return { stage: 'dealing', seatIndex: journal.seen }
  return journal.logbookOpen ? { stage: 'logbook' } : { stage: 'hand-back' }
}

export const markSeen = (journal: TableJournal): TableJournal =>
  journal.seen < journal.seats.length ? { ...journal, seen: journal.seen + 1 } : journal

export const openLogbook = (journal: TableJournal, now: number): TableJournal =>
  journal.seen >= journal.seats.length && !journal.logbookOpen ? { ...journal, logbookOpen: true, startedAt: now } : journal

const fixed = (value: number): RandomNumbers => ({ next: () => value })

const applyEntry = (match: Match, entry: JournalEntry): Result<void, MatchError> => {
  switch (entry.kind) {
    case 'hunt': {
      const wolves = match.seats.filter((seat) => seat.alive && seat.role === 'werewolf')
      if (wolves.length === 0) return err(matchError('not-your-action'))
      for (const wolf of wolves) {
        const result = match.act(wolf.memberId, { kind: 'hunt', targetId: entry.targetId }, fixed(0))
        if (!result.ok) return result
      }
      return done
    }
    case 'inspect':
      return match.act(entry.seerId, { kind: 'inspect', targetId: entry.targetId }, fixed(entry.draw))
    case 'protect':
      return match.act(entry.doctorId, { kind: 'protect', targetId: entry.targetId }, fixed(0))
    case 'potions':
      return match.act(entry.witchId, { kind: 'potions', heal: entry.heal, poisonTargetId: entry.poisonTargetId }, fixed(0))
    case 'vote':
      return match.vote(entry.voterId, entry.targetId)
    case 'avenge': {
      const hunterId = match.revenge?.pending === true ? match.revenge.hunterId : null
      return hunterId === null ? err(matchError('no-revenge')) : match.avenge(hunterId, entry.targetId, entry.at)
    }
    case 'skip-revenge':
      return match.skipRevenge(TABLE_NARRATOR_ID)
    case 'set-alive':
      return match.setAlive(TABLE_NARRATOR_ID, entry.seatId, entry.alive)
    case 'advance':
      return match.advance(TABLE_NARRATOR_ID, entry.at)
    case 'extend-timer':
      return match.extendTimer(TABLE_NARRATOR_ID)
    case 'keep-playing':
      return match.keepPlaying(TABLE_NARRATOR_ID)
    case 'end-game':
      return match.endGame(TABLE_NARRATOR_ID)
  }
}

const beginTableMatch = (journal: TableJournal): Match =>
  Match.begin({
    code: TABLE_CODE,
    narratorId: TABLE_NARRATOR_ID,
    seats: journal.seats.map((seat) => ({ memberId: seat.id, role: seat.role, alive: true })),
    timers: journal.setup.timers,
    revealRoleOnDeath: journal.setup.revealRoleOnDeath,
    anonymousVotes: false,
    lastWords: false,
    ghostPowers: false,
    now: journal.startedAt
  })

export const replayJournal = (journal: TableJournal): Result<Match, MatchError> => {
  const match = beginTableMatch(journal)
  for (const entry of journal.entries) {
    const result = applyEntry(match, entry)
    if (!result.ok) return result
  }
  return ok(match)
}

export const appendEntry = (journal: TableJournal, entry: JournalEntry): Result<TableJournal, MatchError> => {
  const replayed = replayJournal(journal)
  if (!replayed.ok) return replayed
  const result = applyEntry(replayed.value, entry)
  return result.ok ? ok({ ...journal, entries: [...journal.entries, entry] }) : result
}

export const undoLast = (journal: TableJournal): Result<TableJournal, TableError> =>
  journal.entries.length === 0
    ? err(tableError('nothing-to-undo'))
    : ok({ ...journal, entries: journal.entries.slice(0, -1) })

export const isTableJournal = (value: unknown): value is TableJournal => {
  if (typeof value !== 'object' || value === null) return false
  const candidate = value as Record<string, unknown>
  return (
    candidate.version === JOURNAL_VERSION &&
    isTableSetup(candidate.setup) &&
    Array.isArray(candidate.seats) &&
    candidate.seats.every(
      (seat: unknown) =>
        typeof seat === 'object' &&
        seat !== null &&
        typeof (seat as DealtSeat).id === 'string' &&
        (ROLE_IDS as readonly unknown[]).includes((seat as DealtSeat).role)
    ) &&
    typeof candidate.seen === 'number' &&
    typeof candidate.logbookOpen === 'boolean' &&
    typeof candidate.startedAt === 'number' &&
    Array.isArray(candidate.entries)
  )
}
