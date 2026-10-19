import {
  done,
  err,
  type ChatAccess,
  type MatchError,
  type NarratorMatchView,
  type Result,
  type TableError
} from '@luna/contracts'
import { narratorViewOf, type Match } from '@luna/rules'
import { defineStore } from 'pinia'
import { computed, inject, shallowRef } from 'vue'
import {
  appendEntry,
  dealJournal,
  dealProgressOf,
  markSeen as markJournalSeen,
  openLogbook as openJournalLogbook,
  replayJournal,
  undoLast,
  type DealProgress,
  type JournalEntry,
  type TableJournal
} from '../domain/tableJournal'
import { canDeal, type TableSetup } from '../domain/tableSetup'
import { TABLE_CLOCK, TABLE_JOURNAL_STORE, TABLE_RANDOM } from './ports'

export type TableFailure = MatchError | TableError

type EntryInput = JournalEntry extends infer Entry ? (Entry extends JournalEntry ? Omit<Entry, 'at'> : never) : never

const NO_CHAT: ChatAccess = { read: [], write: [], lastWordsUntil: null, villagePaused: false }

const required = <T>(value: T | undefined, name: string): T => {
  if (value === undefined) throw new Error(`${name} was not provided to the app`)
  return value
}

export const useTableStore = defineStore('table', () => {
  const journals = required(inject(TABLE_JOURNAL_STORE), 'TableJournalStore')
  const random = required(inject(TABLE_RANDOM), 'TableRandom')
  const clock = required(inject(TABLE_CLOCK), 'TableClock')

  const journal = shallowRef<TableJournal | null>(journals.load())
  const failure = shallowRef<TableFailure | null>(null)

  const match = computed<Match | null>(() => {
    if (journal.value === null) return null
    const replayed = replayJournal(journal.value)
    return replayed.ok ? replayed.value : null
  })
  const view = computed<NarratorMatchView | null>(() =>
    match.value === null ? null : narratorViewOf(match.value, clock.now(), NO_CHAT)
  )
  const progress = computed<DealProgress | null>(() => (journal.value === null ? null : dealProgressOf(journal.value)))
  const hasSaved = computed(() => journal.value !== null)

  const keep = (next: TableJournal | null) => {
    journal.value = next
    if (next === null) journals.clear()
    else journals.save(next)
  }

  const settle = <T>(result: Result<T, TableFailure>): Result<T, TableFailure> => {
    failure.value = result.ok ? null : result.error
    return result
  }

  const deal = (setup: TableSetup): boolean => {
    if (!canDeal(setup)) return false
    failure.value = null
    keep(dealJournal(setup, random, clock.now()))
    return true
  }

  const markSeen = () => {
    if (journal.value !== null) keep(markJournalSeen(journal.value))
  }

  const openLogbook = () => {
    if (journal.value !== null) keep(openJournalLogbook(journal.value, clock.now()))
  }

  const record = (input: EntryInput): Result<void, TableFailure> => {
    if (journal.value === null) return settle(err({ code: 'match-not-found' }))
    const next = appendEntry(journal.value, { ...input, at: clock.now() } as JournalEntry)
    if (!next.ok) return settle(next)
    keep(next.value)
    return settle(done)
  }

  const logHunt = (targetId: string) => record({ kind: 'hunt', targetId })
  const logVision = (seerId: string, targetId: string) => record({ kind: 'inspect', seerId, targetId, draw: random.next() })
  const logProtect = (doctorId: string, targetId: string) => record({ kind: 'protect', doctorId, targetId })
  const logPotions = (witchId: string, heal: boolean, poisonTargetId: string | null) =>
    record({ kind: 'potions', witchId, heal, poisonTargetId })
  const logVote = (voterId: string, targetId: string | null) => record({ kind: 'vote', voterId, targetId })
  const logRevenge = (targetId: string) => record({ kind: 'avenge', targetId })
  const skipRevenge = () => record({ kind: 'skip-revenge' })
  const setAlive = (seatId: string, alive: boolean) => record({ kind: 'set-alive', seatId, alive })
  const advance = () => record({ kind: 'advance' })
  const extendTimer = () => record({ kind: 'extend-timer' })
  const keepPlaying = () => record({ kind: 'keep-playing' })
  const endGame = () => record({ kind: 'end-game' })

  const undo = (): Result<void, TableFailure> => {
    if (journal.value === null) return settle(err({ code: 'nothing-to-undo' }))
    const previous = undoLast(journal.value)
    if (!previous.ok) return settle(previous)
    keep(previous.value)
    return settle(done)
  }

  const playAgain = () => {
    if (journal.value !== null) deal(journal.value.setup)
  }

  const abandon = () => {
    failure.value = null
    keep(null)
  }

  return {
    journal,
    failure,
    match,
    view,
    progress,
    hasSaved,
    deal,
    markSeen,
    openLogbook,
    logHunt,
    logVision,
    logProtect,
    logPotions,
    logVote,
    logRevenge,
    skipRevenge,
    setAlive,
    advance,
    extendTimer,
    keepPlaying,
    endGame,
    undo,
    playAgain,
    abandon
  }
})
