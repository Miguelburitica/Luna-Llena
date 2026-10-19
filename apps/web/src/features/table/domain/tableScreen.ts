import type { DealProgress } from './tableJournal'

export type TableScreen = 'table-setup' | 'table-deal' | 'table' | 'table-over'

export const tableScreenOf = (progress: DealProgress | null, isOver: boolean): TableScreen => {
  if (progress === null) return 'table-setup'
  if (progress.stage !== 'logbook') return 'table-deal'
  return isOver ? 'table-over' : 'table'
}
