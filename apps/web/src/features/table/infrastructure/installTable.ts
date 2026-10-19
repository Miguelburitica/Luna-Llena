import type { App } from 'vue'
import { TABLE_CLOCK, TABLE_JOURNAL_STORE, TABLE_RANDOM } from '../application/ports'
import { LocalTableJournalStore } from './LocalTableJournalStore'
import { MathRandomSource } from './MathRandomSource'
import { SystemClock } from './SystemClock'

export const installTable = (app: App): void => {
  app.provide(TABLE_JOURNAL_STORE, new LocalTableJournalStore())
  app.provide(TABLE_RANDOM, new MathRandomSource())
  app.provide(TABLE_CLOCK, new SystemClock())
}
