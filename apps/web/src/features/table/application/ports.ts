import type { InjectionKey } from 'vue'
import type { TableJournal } from '../domain/tableJournal'

export interface TableJournalStore {
  load(): TableJournal | null
  save(journal: TableJournal): void
  clear(): void
}

export interface RandomSource {
  next(): number
}

export interface Clock {
  now(): number
}

export const TABLE_JOURNAL_STORE: InjectionKey<TableJournalStore> = Symbol('TableJournalStore')
export const TABLE_RANDOM: InjectionKey<RandomSource> = Symbol('TableRandom')
export const TABLE_CLOCK: InjectionKey<Clock> = Symbol('TableClock')
