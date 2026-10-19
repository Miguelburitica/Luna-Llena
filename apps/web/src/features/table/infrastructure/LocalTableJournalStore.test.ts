import { afterEach, describe, expect, it } from 'vitest'
import { journalWith, logged, JUAN, START } from '../domain/tableJournal.fixtures'
import { LocalTableJournalStore } from './LocalTableJournalStore'

afterEach(() => localStorage.clear())

describe('LocalTableJournalStore', () => {
  it('keeps the journal on the device across store instances', () => {
    const journal = logged(journalWith(), { kind: 'hunt', targetId: JUAN, at: START })
    new LocalTableJournalStore().save(journal)

    expect(new LocalTableJournalStore().load()).toEqual(journal)
  })

  it('drops an unreadable save', () => {
    localStorage.setItem('luna-llena.table', JSON.stringify({ version: 99 }))

    expect(new LocalTableJournalStore().load()).toBeNull()
  })

  it('forgets the journal', () => {
    const store = new LocalTableJournalStore()
    store.save(journalWith())
    store.clear()

    expect(store.load()).toBeNull()
  })
})
