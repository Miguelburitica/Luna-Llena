import { createPinia, setActivePinia } from 'pinia'
import { createApp } from 'vue'
import type { TableJournal } from '../domain/tableJournal'
import { TABLE_CLOCK, TABLE_JOURNAL_STORE, TABLE_RANDOM, type Clock, type RandomSource, type TableJournalStore } from './ports'
import { useTableStore } from './useTableStore'

export class MemoryTableJournalStore implements TableJournalStore {
  constructor(public saved: TableJournal | null = null) {}

  load() {
    return this.saved === null ? null : (JSON.parse(JSON.stringify(this.saved)) as TableJournal)
  }

  save(journal: TableJournal) {
    this.saved = journal
  }

  clear() {
    this.saved = null
  }
}

export class ScriptedRandom implements RandomSource {
  private position = 0

  constructor(private readonly values: readonly number[] = [0.3, 0.7, 0.1, 0.9, 0.5]) {}

  next(): number {
    const value = this.values[this.position % this.values.length] ?? 0
    this.position += 1
    return value
  }
}

export class SteppingClock implements Clock {
  constructor(public current = 1_000_000) {}

  now(): number {
    return this.current
  }
}

export interface TableKit {
  readonly journals: MemoryTableJournalStore
  readonly random: ScriptedRandom
  readonly clock: SteppingClock
}

export const createTableKit = (saved: TableJournal | null = null): TableKit => ({
  journals: new MemoryTableJournalStore(saved),
  random: new ScriptedRandom(),
  clock: new SteppingClock()
})

export const tableProvides = (kit: TableKit): Record<symbol, unknown> => ({
  [TABLE_JOURNAL_STORE as symbol]: kit.journals,
  [TABLE_RANDOM as symbol]: kit.random,
  [TABLE_CLOCK as symbol]: kit.clock
})

export const createTableTestApp = (saved: TableJournal | null = null) => {
  const kit = createTableKit(saved)
  const pinia = createPinia()
  const app = createApp({})
  app.use(pinia)
  const provides = tableProvides(kit)
  for (const key of Object.getOwnPropertySymbols(provides)) app.provide(key, provides[key])
  setActivePinia(pinia)
  const store = app.runWithContext(() => useTableStore())
  return { app, pinia, kit, store }
}
