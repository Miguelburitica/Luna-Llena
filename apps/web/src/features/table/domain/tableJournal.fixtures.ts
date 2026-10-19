import { DEFAULT_ROOM_SETTINGS, ROLE_IDS, type RoleId } from '@luna/contracts'
import { appendEntry, JOURNAL_VERSION, seatIdOf, type JournalEntry, type TableJournal } from './tableJournal'
import type { TableSetup } from './tableSetup'

export const START = 1_000_000

export const DEFAULT_DECK_ROLES: readonly RoleId[] = [
  'werewolf',
  'werewolf',
  'seer',
  'drunk',
  'doctor',
  'witch',
  'hunter',
  'fool'
]

export const TABLE_NAMES = ['Luis', 'Tato', 'Marta', 'Caro', 'Juan', 'Sofi', 'Pipe', 'Ana']

export const LUIS = 'seat-1'
export const TATO = 'seat-2'
export const MARTA = 'seat-3'
export const CARO = 'seat-4'
export const JUAN = 'seat-5'
export const SOFI = 'seat-6'
export const PIPE = 'seat-7'
export const ANA = 'seat-8'

const deckOf = (roles: readonly RoleId[]): Record<RoleId, number> =>
  Object.fromEntries(ROLE_IDS.map((role) => [role, roles.filter((held) => held === role).length])) as Record<RoleId, number>

export const setupFor = (roles: readonly RoleId[], names: readonly string[] = TABLE_NAMES): TableSetup => ({
  names: roles.map((_, index) => names[index] ?? ''),
  timers: DEFAULT_ROOM_SETTINGS.timers,
  revealRoleOnDeath: true,
  deck: deckOf(roles)
})

export const journalWith = (
  roles: readonly RoleId[] = DEFAULT_DECK_ROLES,
  { names = TABLE_NAMES, opened = true }: { names?: readonly string[]; opened?: boolean } = {}
): TableJournal => ({
  version: JOURNAL_VERSION,
  setup: setupFor(roles, names),
  seats: roles.map((role, index) => ({ id: seatIdOf(index), role })),
  seen: opened ? roles.length : 0,
  logbookOpen: opened,
  startedAt: START,
  entries: []
})

export const logged = (journal: TableJournal, ...entries: JournalEntry[]): TableJournal =>
  entries.reduce((current, entry) => {
    const result = appendEntry(current, entry)
    if (!result.ok) throw new Error(`Expected ${entry.kind} to be accepted, got ${result.error.code}`)
    return result.value
  }, journal)

export const advance = (times = 1): JournalEntry[] => Array.from({ length: times }, () => ({ kind: 'advance', at: START }))
