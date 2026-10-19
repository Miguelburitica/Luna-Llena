import { forgetStored, readStored, writeStored } from '@/shared/infrastructure/storage/deviceStorage'
import type { TableJournalStore } from '../application/ports'
import { isTableJournal, type TableJournal } from '../domain/tableJournal'

const KEY = 'luna-llena.table'

export class LocalTableJournalStore implements TableJournalStore {
  load(): TableJournal | null {
    return readStored(KEY, isTableJournal)
  }

  save(journal: TableJournal): void {
    writeStored(KEY, journal)
  }

  clear(): void {
    forgetStored(KEY)
  }
}
